import { getPool } from "../api/_db.js";
import { getStripe } from "../api/_stripe.js";
import { ensureCheckoutSession, reconcileReservations, reconciliationErrorDetails, settleReservation, validRequestId, type Reservation, TICKET_HOLD_MINUTES } from "../api/_inventory.js";

async function main() {
  console.log(`Checking ticket holds with a ${TICKET_HOLD_MINUTES}-minute timeout.`);
  const sessionId = process.argv[2];
  if (sessionId) {
    if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) throw new Error("Supply a Stripe Checkout Session ID beginning cs_.");
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    if (!validRequestId(session.metadata?.reservation_id)) throw new Error("This checkout does not belong to ticket inventory.");
    await settleReservation(session);
    const result = await getPool().query<Reservation>("SELECT * FROM ticket_reservations WHERE id = $1", [session.metadata.reservation_id]);
    const reservation = result.rows[0];
    if (reservation && ["pending", "open"].includes(reservation.status)) {
      const current = await ensureCheckoutSession(reservation);
      console.log(`Checkout status: ${current.status}; payment: ${current.payment_status}.`);
    } else console.log(`Reservation status: ${reservation?.status ?? "unknown"}.`);
  } else {
    const summary = await reconcileReservations({ force: true });
    console.table(summary);
    if (summary.failed) process.exitCode = 1;
  }
  console.log("Reconciliation finished. Run npm run inventory:status to inspect remaining holds.");
}
main().catch((error) => { console.error("Reconciliation failed. Inventory has not been released without Stripe confirmation.", reconciliationErrorDetails(error)); process.exitCode = 1; })
  .finally(async () => { if (process.env.DATABASE_URL) await getPool().end(); });
