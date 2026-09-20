import { getPool } from "../api/_db.js";

async function main() {
  const inventory = await getPool().query(`SELECT i.price_id, i.livemode, i.capacity, i.enabled,
    (i.initial_sold + COALESCE(sum(r.quantity) FILTER (WHERE r.status = 'paid'), 0))::int AS sold,
    COALESCE(sum(r.quantity) FILTER (WHERE r.status IN ('pending','open')), 0)::int AS reserved
    FROM ticket_inventory i LEFT JOIN ticket_reservations r ON r.price_id=i.price_id AND r.livemode=i.livemode
    GROUP BY i.price_id,i.livemode ORDER BY i.price_id`);
  console.table(inventory.rows.map((row) => ({ ...row, remaining: Math.max(0, row.capacity-row.sold-row.reserved) })));
  const holds = await getPool().query(`SELECT id, price_id, quantity, status, stripe_session_id, created_at,
    created_at + interval '35 minutes' AS target_expiry FROM ticket_reservations
    WHERE status IN ('pending','open') ORDER BY created_at`);
  if (holds.rows.length) console.table(holds.rows);
}
main().catch(() => { console.error("Unable to read inventory. Check DATABASE_URL and run inventory:setup first."); process.exitCode = 1; })
  .finally(async () => { if (process.env.DATABASE_URL) await getPool().end(); });
