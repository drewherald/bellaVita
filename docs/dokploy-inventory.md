# Ticket inventory on Dokploy

The website and Node API run in one Nixpacks application. PostgreSQL runs in the separate Dokploy database service you already created. Stripe remains the source of product descriptions and prices; PostgreSQL enforces ticket capacity by Price ID.

## 1. Configure Stripe's webhook

In Stripe **Workbench → Webhooks → Create an event destination**, select your account and a webhook endpoint with these snapshot events:

- `checkout.session.completed`
- `checkout.session.expired`

Use `https://YOUR-WEBSITE/api/stripe-webhook` as the endpoint URL. Copy its signing secret (`whsec_...`) to the application environment as `STRIPE_WEBHOOK_SECRET`. Keep the endpoint, signing secret, API key and Price IDs in the same Stripe mode (test or live).

You can create the destination before deploying the handler. It will become available after deployment. [Stripe webhook documentation](https://docs.stripe.com/webhooks)

## 2. Configure the Dokploy application

Keep **Build Type: Nixpacks**. In the website application's Environment tab, set:

```dotenv
DATABASE_URL=<your existing PostgreSQL Internal Connection URL>
STRIPE_SECRET_KEY=<your Stripe secret key>
STRIPE_WEBHOOK_SECRET=<the endpoint's signing secret>
SITE_URL=https://YOUR-WEBSITE
PORT=3000
NIXPACKS_SPA_CADDY=false
NIXPACKS_START_CMD=npm start
```

Replace placeholders; do not include angle brackets. Keep these server variables without a `VITE_` prefix. Use the same canonical website origin for `SITE_URL` and the browser, including `www` if applicable.

Under **Domains**, set the application's container port to **3000**. Clear any static **Publish Directory** setting: this application now runs Node, which serves both the built website and `/api` routes. The repository's `nixpacks.toml` runs `npm run build` and `npm start` and disables the default static Caddy server.

[Dokploy Nixpacks settings](https://docs.dokploy.com/docs/core/applications/build-type) · [Internal database connections](https://docs.dokploy.com/docs/core/databases/connection)

## 3. Deploy the code and initialize inventory

Push the reviewed repository changes to the branch Dokploy deploys, then deploy the application. No code is pushed or deployed automatically by the local implementation.

In the deployed **application's terminal**, run:

```sh
npm run inventory:setup
npm run inventory:status
```

The first command creates the schema and seeds these entries from `inventory.config.json`:

| Price | Capacity | Opening sales |
|---|---:|---:|
| `price_1UGlxi2KxPxu7vVIIYNof91a` | 68 | 0 |
| `price_1UGmKz2KxPxu7vVIrMDUZr0r` | 8 | 0 |

The second price is named **Reserved Table for Four** in Stripe. Its cap is eight purchasable tables (32 guests), plus 68 general admissions, matching the event's 100-guest description. Inventory counts each Stripe price's units; one table purchase consumes one of the eight table allocations.

The setup command retrieves the prices through your Stripe key and determines their mode. It checks existing Checkout Sessions before enabling a new price. If there are prior sales or unfinished checkouts, it stops with an explanation. Do not force zero opening sales if tickets have sold. Let old untracked checkouts finish or expire, and reconcile their sales before retrying setup.

Running setup again preserves reservations and sales. It refuses to overwrite existing capacity/opening balances with different values. Product metadata `capacity` remains display text; the limits above enforce sales.

All sales for these prices must pass through this inventory-aware checkout. Deactivate any other Payment Links or independent checkout routes selling the same tickets before enabling inventory. The initialization audit counts Checkout line items, not manually created invoices or unrelated payment records.

## 4. Verify before opening sales

- `/api/health` should return `{"status":"ok"}` for database connectivity.
- `/api/events` should return `inventoryReady: true`, with the configured counts on each price.
- The website should show available ticket quantities. Selecting two reserves and charges exactly two.
- In a Stripe sandbox/test deployment, complete a test purchase and verify the webhook gets a successful response and `inventory:status` moves two tickets from reserved to sold.
- Test abandoned checkout expiration and repeat webhook delivery. The automated local PostgreSQL suite also tests simultaneous attempts at the last tickets.

Use separate test Price IDs and a test configuration file (set `INVENTORY_CONFIG_PATH` to its path). Stripe test and live Prices are different objects. The default configuration contains the two supplied prices; it is not automatically converted to test mode.

This checkout currently accepts cards and supported card wallets. It disables quantity changes inside Stripe so payment matches the reserved quantity.

## Local development and the ticket-loading error

Dokploy's internal PostgreSQL hostname is only reachable inside its Docker network. Copying it into your laptop's `.env` produces `ENOTFOUND`; it cannot connect from local Vite.

`npm run dev` can still show Stripe event details while database availability is unavailable. Buying is disabled in that state, so no inventory protection is bypassed.

For full local testing, create a Stripe sandbox/test product with `type=event` metadata and test prices. Copy `.env.example` to `.env.local`, set the test key, and create `inventory.test.config.json`:

```json
[
  { "priceId": "price_YOUR_TEST_PRICE_A", "capacity": 68, "initialSold": 0 },
  { "priceId": "price_YOUR_TEST_PRICE_B", "capacity": 8, "initialSold": 0 }
]
```

Set `INVENTORY_CONFIG_PATH=inventory.test.config.json` in `.env.local`, then run:

```sh
npm run dev:inventory
```

This starts persistent local PostgreSQL on `127.0.0.1:55432`, creates the schema and initial inventory, and starts Vite at `http://localhost:5173`. It overrides the Dokploy database URL only in the child process. Local database files live in ignored `.local-inventory/`; live keys are rejected to prevent a separate local counter authorizing real sales.

For local webhook delivery, use Stripe CLI `stripe listen --forward-to localhost:5173/api/stripe-webhook` with the same test account. Put the CLI's signing secret in `.env.local` and restart the development command. The CLI signing secret differs from the deployed webhook's secret.

## Reservations, recovery and refunds

- The server checks outstanding reservations every minute. After about 35 minutes, it expires an unpaid Checkout Session through Stripe before releasing stock. Stripe's default 24-hour session expiration is the fallback if the worker is down.
- Returning from checkout does not immediately release the hold; a checkout may still be open in another tab.
- Duplicate callbacks and checkout retries do not double-count tickets.
- A network timeout leaves tickets held until Stripe confirms their state. Unbound holds older than 23 hours are not retried with potentially expired idempotency keys; they require review.
- `npm run inventory:status` lists active holds without printing customer data or credentials.
- `npm run inventory:reconcile` retries outstanding holds. If you find the matching Checkout Session in Stripe, `npm run inventory:reconcile -- cs_SESSION_ID` reconciles it using its metadata and line items. Do not manually release uncertain holds without checking Stripe's records.
- Refunds do not automatically restock tickets. Review cancellation/restocking decisions separately.

Configure scheduled database backups in Dokploy's database **Backups** tab with an S3 destination and verify a restore. Persistent volumes survive redeployment; backups cover recovery from data loss. [Dokploy backups](https://docs.dokploy.com/docs/core/databases/backups)

## Checks

```sh
npm test
npm run build
npm run lint
```

`npm test` starts a temporary real PostgreSQL instance. Alternatively set `TEST_DATABASE_URL` to a disposable database. Tests use unique fixture prices and never reset the production inventory. Do not point tests at the production database.
