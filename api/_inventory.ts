import type Stripe from "stripe";
import { getPool, transaction } from "./_db.js";
import { HttpError } from "./_http.js";
import { getStripe } from "./_stripe.js";

export class InventoryError extends HttpError {}

export const TICKET_HOLD_MINUTES = 10;

export type Reservation = {
  id: string;
  price_id: string;
  livemode: boolean;
  quantity: number;
  status: "pending" | "open" | "paid" | "expired" | "failed";
  stripe_session_id: string | null;
  checkout_url: string | null;
  checkout_params: Stripe.Checkout.SessionCreateParams;
  created_at: Date;
  expires_at: Date;
};

export const validRequestId = (id: unknown): id is string =>
  typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function getAvailability(priceIds: string[], livemode: boolean) {
  const result = await getPool().query<{
    price_id: string; capacity: number; configured: boolean; sold: number; reserved: number;
  }>(`
    SELECT i.price_id, i.capacity, i.enabled AS configured,
      (i.initial_sold + COALESCE(sum(r.quantity) FILTER (WHERE r.status = 'paid'), 0))::integer AS sold,
      COALESCE(sum(r.quantity) FILTER (WHERE r.status IN ('pending', 'open')), 0)::integer AS reserved
    FROM ticket_inventory i LEFT JOIN ticket_reservations r
      ON r.price_id = i.price_id AND r.livemode = i.livemode
    WHERE i.price_id = ANY($1::text[]) AND i.livemode = $2
    GROUP BY i.price_id, i.livemode
  `, [priceIds, livemode]);
  return new Map(result.rows.map((row) => [row.price_id, {
    ...row, remaining: row.configured ? Math.max(0, row.capacity - row.sold - row.reserved) : 0,
  }]));
}

export async function reserveTickets(input: {
  requestId: string; priceId: string; quantity: number; livemode: boolean;
  checkoutParams: Stripe.Checkout.SessionCreateParams;
}): Promise<Reservation> {
  if (!validRequestId(input.requestId) || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 10) {
    throw new InventoryError(400, "Choose a quantity between 1 and 10.");
  }
  return transaction(async (client) => {
    // Serialize retries even if a reused request ID names a different ticket tier.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [input.requestId.toLowerCase()]);
    const prior = await client.query<Reservation>("SELECT * FROM ticket_reservations WHERE id = $1", [input.requestId]);
    if (prior.rows[0]) {
      const reservation = prior.rows[0];
      if (reservation.price_id !== input.priceId || reservation.quantity !== input.quantity || reservation.livemode !== input.livemode) {
        throw new InventoryError(409, "Your ticket selection changed. Please try again.");
      }
      return reservation;
    }
    const inventory = await client.query<{ capacity: number; initial_sold: number; enabled: boolean }>(
      "SELECT * FROM ticket_inventory WHERE price_id = $1 AND livemode = $2 FOR UPDATE", [input.priceId, input.livemode],
    );
    const row = inventory.rows[0];
    if (!row?.enabled) throw new InventoryError(503, "Tickets are not available for this selection yet.");
    const allocated = await client.query<{ quantity: number }>(`
      SELECT COALESCE(sum(quantity), 0)::integer AS quantity FROM ticket_reservations
      WHERE price_id = $1 AND livemode = $2 AND status IN ('pending', 'open', 'paid')
    `, [input.priceId, input.livemode]);
    if (row.capacity - row.initial_sold - allocated.rows[0].quantity < input.quantity) {
      throw new InventoryError(409, "There isn’t enough availability for that quantity. Please choose a smaller quantity.");
    }
    const result = await client.query<Reservation>(`
      INSERT INTO ticket_reservations (id, price_id, livemode, quantity, checkout_params, expires_at)
      VALUES ($1, $2, $3, $4, $5, now() + $6::integer * interval '1 minute') RETURNING *
    `, [input.requestId, input.priceId, input.livemode, input.quantity, JSON.stringify(input.checkoutParams), TICKET_HOLD_MINUTES]);
    return result.rows[0];
  });
}

export async function settleReservation(session: Stripe.Checkout.Session): Promise<void> {
  const id = session.metadata?.reservation_id;
  if (!validRequestId(id)) return; // Other Stripe sales do not belong to this integration.
  await transaction(async (client) => {
    const result = await client.query<Reservation>("SELECT * FROM ticket_reservations WHERE id = $1 FOR UPDATE", [id]);
    const reservation = result.rows[0];
    if (!reservation) {
      // A confirmed expired, unpaid checkout cannot consume stock. A delayed
      // expiration notification after an authorized reset needs no further work.
      if (session.status === "expired" && session.payment_status === "unpaid") return;
      throw new Error("Unknown ticket reservation");
    }
    const line = session.line_items?.data[0];
    if (session.livemode !== reservation.livemode || session.client_reference_id !== reservation.id ||
      session.metadata?.price_id !== reservation.price_id || session.metadata?.quantity !== String(reservation.quantity) ||
      session.line_items?.data.length !== 1 || session.line_items.has_more || line?.price?.id !== reservation.price_id ||
      line.quantity !== reservation.quantity || (reservation.stripe_session_id && reservation.stripe_session_id !== session.id)) {
      throw new Error("Stripe session does not match its ticket reservation");
    }
    // Match reserveTickets' capacity lock so release and allocation cannot interleave.
    await client.query("SELECT 1 FROM ticket_inventory WHERE price_id = $1 AND livemode = $2 FOR UPDATE", [reservation.price_id, reservation.livemode]);
    let status = reservation.status;
    if (session.status === "complete" && ["paid", "no_payment_required"].includes(session.payment_status)) {
      // A released session can never become payable again. Fail closed if Stripe violates this assumption.
      if (["expired", "failed"].includes(status)) throw new Error("Payment received for a released reservation; manual review required");
      status = "paid";
    } else if (status !== "paid") {
      if (session.status === "expired") status = "expired";
      else if (!["expired", "failed"].includes(status)) status = "open";
    }
    await client.query(`
      UPDATE ticket_reservations SET status = $2, stripe_session_id = $3, checkout_url = $4,
        expires_at = to_timestamp($5), updated_at = now(), last_checked_at = now() WHERE id = $1
    `, [id, status, session.id, session.url, session.expires_at]);
  });
}

export async function ensureCheckoutSession(reservation: Reservation): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  if (["expired", "failed", "paid"].includes(reservation.status)) {
    throw new InventoryError(409, "This checkout has already ended. Please start a new checkout.");
  }
  // Never reuse a potentially pruned Stripe idempotency key (Stripe retains it for >=24h).
  if (!reservation.stripe_session_id && Date.now() - reservation.created_at.getTime() >= 23 * 60 * 60 * 1000) {
    throw new InventoryError(503, "This reservation needs assistance. Please contact us before trying again.");
  }
  let session = reservation.stripe_session_id
    ? await stripe.checkout.sessions.retrieve(reservation.stripe_session_id, { expand: ["line_items"] })
    : await stripe.checkout.sessions.create(reservation.checkout_params, { idempotencyKey: `bv_ticket_${reservation.id}` });
  // End the hold in Stripe before releasing stock. Omitting expires_at from create
  // params keeps a lost first request safely retryable beyond Stripe's 30m minimum.
  if (session.status === "open" && Date.now() - reservation.created_at.getTime() >= TICKET_HOLD_MINUTES * 60 * 1000) {
    try {
      session = await stripe.checkout.sessions.expire(session.id, { expand: ["line_items"] });
    } catch (error) {
      // Payment or another worker may have won the race. A failed expire call alone
      // never proves inventory can be released; retrieve Stripe's current state.
      session = await stripe.checkout.sessions.retrieve(session.id, { expand: ["line_items"] });
      if (session.status === "open") {
        const failure = new InventoryError(503, "Stripe did not expire this checkout. Its tickets remain held.");
        failure.cause = error;
        throw failure;
      }
    }
    if (session.status === "open") throw new InventoryError(503, "Stripe returned an open checkout after expiration. Its tickets remain held.");
  }
  await settleReservation(session);
  return session;
}

export function reconciliationErrorDetails(error: unknown) {
  const outer = error && typeof error === "object" ? error : {};
  const inner = "cause" in outer && outer.cause && typeof outer.cause === "object" ? outer.cause : outer;
  // Only diagnostic identifiers: never log Stripe request bodies, API keys or customer data.
  return Object.fromEntries(["name", "type", "code", "statusCode", "requestId"].flatMap((key) => {
    const value = (inner as Record<string, unknown>)[key];
    return typeof value === "string" || typeof value === "number" ? [[key, value]] : [];
  }));
}

let reconciling = false;
export async function reconcileReservations(options: { force?: boolean } = {}) {
  const summary = { checked: 0, expired: 0, paid: 0, stillOpen: 0, failed: 0, skipped: false };
  if (reconciling) return { ...summary, skipped: true };
  reconciling = true;
  try {
    const result = await getPool().query<Reservation>(`
      SELECT * FROM ticket_reservations WHERE status IN ('pending', 'open')
        AND ($1::boolean OR last_checked_at IS NULL OR last_checked_at < now() - interval '55 seconds')
      ORDER BY last_checked_at ASC NULLS FIRST, created_at ASC LIMIT 100
    `, [options.force ?? false]);
    for (const reservation of result.rows) {
      summary.checked += 1;
      try {
        // A locked row must not prevent the rest of the batch from being reconciled.
        // A timeout never authorizes releasing inventory.
        await getPool().query("UPDATE ticket_reservations SET last_checked_at = now() WHERE id = $1", [reservation.id]);
        const session = await ensureCheckoutSession(reservation);
        if (session.status === "expired") summary.expired += 1;
        else if (session.status === "complete" && ["paid", "no_payment_required"].includes(session.payment_status)) summary.paid += 1;
        else summary.stillOpen += 1;
      } catch (error) {
        summary.failed += 1;
        console.error(`Unable to reconcile ticket reservation ${reservation.id}; its tickets remain held.`, reconciliationErrorDetails(error));
      }
    }
    return summary;
  } finally { reconciling = false; }
}
