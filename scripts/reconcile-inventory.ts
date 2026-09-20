import { getPool } from "../api/_db.js";
import { getStripe } from "../api/_stripe.js";
import { reconcileReservations, settleReservation } from "../api/_inventory.js";

async function main() {
  const sessionId = process.argv[2];
  if (sessionId) {
    if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) throw new Error("Supply a Stripe Checkout Session ID beginning cs_.");
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    await settleReservation(session);
  } else await reconcileReservations();
  console.log("Reconciliation finished. Run npm run inventory:status to inspect remaining holds.");
}
main().catch(() => { console.error("Reconciliation failed. Inventory has not been released without Stripe confirmation."); process.exitCode = 1; })
  .finally(async () => { if (process.env.DATABASE_URL) await getPool().end(); });
