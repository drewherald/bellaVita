-- Run in DBeaver only after stopping the website and confirming in Stripe
-- that every linked checkout is expired and unpaid. This deletes reservations.
-- Capacity and opening-sales settings in ticket_inventory are retained.
-- Execute this whole DO statement; it runs as a single transaction.
DO $reset$
BEGIN
  PERFORM set_config('lock_timeout', '5s', true);
  LOCK TABLE ticket_reservations IN ACCESS EXCLUSIVE MODE;

  IF EXISTS (SELECT 1 FROM ticket_reservations WHERE status = 'paid') THEN
    RAISE EXCEPTION 'Reset stopped: paid reservations exist.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM ticket_reservations
    WHERE NOT livemode OR price_id NOT IN (
      'price_1UGlxi2KxPxu7vVIIYNof91a',
      'price_1UGmKz2KxPxu7vVIrMDUZr0r'
    )
  ) THEN
    RAISE EXCEPTION 'Reset stopped: reservations outside the two live ticket prices exist.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM ticket_reservations
    WHERE id NOT IN (
      '6d02f831-3b64-40bc-9270-410e2c6e93d2'::uuid,
      '00458296-afb7-486e-ac6d-156add4b2e8c'::uuid,
      'ff38d3aa-3d38-4662-882a-8db34ad8771d'::uuid,
      '8cef8c3f-2ae9-41d7-a8f6-23ecd886e98f'::uuid
    )
  ) THEN
    RAISE EXCEPTION 'Reset stopped: an additional reservation needs its Stripe checkout checked first.';
  END IF;

  TRUNCATE ONLY ticket_reservations;
END;
$reset$;
