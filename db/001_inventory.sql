CREATE TABLE IF NOT EXISTS ticket_inventory (
  price_id text NOT NULL,
  livemode boolean NOT NULL,
  capacity integer NOT NULL CHECK (capacity >= 0),
  initial_sold integer NOT NULL DEFAULT 0 CHECK (initial_sold >= 0 AND initial_sold <= capacity),
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (price_id, livemode)
);

CREATE TABLE IF NOT EXISTS ticket_reservations (
  id uuid PRIMARY KEY,
  price_id text NOT NULL,
  livemode boolean NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'paid', 'expired', 'failed')),
  stripe_session_id text UNIQUE,
  checkout_url text,
  checkout_params jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_checked_at timestamptz,
  expires_at timestamptz NOT NULL,
  FOREIGN KEY (price_id, livemode) REFERENCES ticket_inventory (price_id, livemode)
);

CREATE INDEX IF NOT EXISTS ticket_reservations_inventory_idx
  ON ticket_reservations (price_id, livemode, status);
CREATE INDEX IF NOT EXISTS ticket_reservations_pending_idx
  ON ticket_reservations (last_checked_at) WHERE status IN ('pending', 'open');
