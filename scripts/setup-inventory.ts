import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getPool, transaction } from "../api/_db.js";
import { getStripe, isEventProduct } from "../api/_stripe.js";
import { readInventoryConfig } from "./_config.js";
import type Stripe from "stripe";

async function main() {
  const config = await readInventoryConfig();
  const stripe = getStripe();
  const prices = await Promise.all(config.map((item) => stripe.prices.retrieve(item.priceId, { expand: ["product"] })));
  for (const price of prices) {
    if (!price.active || price.type !== "one_time" || !isEventProduct(price.product as Stripe.Product)) {
      throw new Error(`Price ${price.id} must be an active one-time price on an event product.`);
    }
  }
  const livemode = prices[0].livemode;
  if (prices.some((price) => price.livemode !== livemode)) throw new Error("Prices must all use the same Stripe mode.");
  const schema = await readFile(resolve("db/001_inventory.sql"), "utf8");
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(728416091)");
    await client.query(schema);
  });
  const existing = await getPool().query<{price_id: string; capacity: number; initial_sold: number}>(
    "SELECT price_id, capacity, initial_sold FROM ticket_inventory WHERE price_id = ANY($1::text[]) AND livemode = $2",
    [config.map((item) => item.priceId), livemode],
  );
  for (const row of existing.rows) {
    const item = config.find((entry) => entry.priceId === row.price_id)!;
    if (row.capacity !== item.capacity || row.initial_sold !== item.initialSold) {
      throw new Error(`Inventory for ${row.price_id} already exists with different counts. Setup will not reset existing inventory.`);
    }
  }
  const pending = config.filter((item) => !existing.rows.some((row) => row.price_id === item.priceId));
  if (pending.length) {
    // Verify the opening balance before enabling sales. Refunded tickets remain sold
    // until explicitly reviewed; they are not automatically returned to inventory.
    const sold = new Map(pending.map((item) => [item.priceId, 0]));
    const unfinished: string[] = [];
    for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
      if (session.status === "expired" || session.mode !== "payment") continue;
      let matches = false;
      for await (const line of stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })) {
        const priceId = line.price?.id;
        if (!priceId || !sold.has(priceId)) continue;
        matches = true;
        if (session.status === "complete" && ["paid", "no_payment_required"].includes(session.payment_status)) {
          sold.set(priceId, sold.get(priceId)! + (line.quantity ?? 0));
        }
      }
      if (matches && (session.status === "open" || session.payment_status === "unpaid")) unfinished.push(session.id);
    }
    if (unfinished.length) {
      throw new Error(`Existing checkouts must finish or expire before inventory is enabled: ${unfinished.join(", ")}`);
    }
    for (const item of pending) {
      if (sold.get(item.priceId) !== item.initialSold) {
        throw new Error(`Opening balance mismatch for ${item.priceId}: Stripe shows ${sold.get(item.priceId)} tickets; configuration has ${item.initialSold}. Review before changing initialSold.`);
      }
    }
    await transaction(async (client) => {
      for (const item of pending) {
        await client.query(`INSERT INTO ticket_inventory (price_id, livemode, capacity, initial_sold)
          VALUES ($1, $2, $3, $4) ON CONFLICT (price_id, livemode) DO NOTHING`,
        [item.priceId, livemode, item.capacity, item.initialSold]);
      }
    });
  }
  console.log(`Inventory is ready in Stripe ${livemode ? "LIVE" : "TEST"} mode. Existing reservations were preserved.`);
  console.table(config);
}

main().catch((error: unknown) => {
  // Stripe errors can contain request details; expose only their short type/code.
  console.error(error instanceof Error && !("raw" in error) ? error.message : "Stripe lookup failed. Check key mode, permissions and Price IDs.");
  process.exitCode = 1;
}).finally(async () => { if (process.env.DATABASE_URL) await getPool().end(); });
