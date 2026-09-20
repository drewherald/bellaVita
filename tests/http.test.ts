import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { after, before, test } from "node:test";
import eventsHandler from "../api/events.js";
import checkoutHandler from "../api/checkout.js";
import webhookHandler from "../api/stripe-webhook.js";
import { getPool } from "../api/_db.js";
import { getStripe } from "../api/_stripe.js";

process.env.STRIPE_SECRET_KEY = "sk_test_http_tests_only";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_signature_only";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.SITE_URL = "https://example.test";

const routes: Record<string, (request: IncomingMessage, response: ServerResponse) => Promise<void>> = {
  "/events": eventsHandler, "/checkout": checkoutHandler, "/webhook": webhookHandler,
};
const server = createServer((request, response) => {
  void routes[request.url!](request, response);
});
let origin: string;
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  origin = `http://127.0.0.1:${address.port}`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await getPool().end();
});

test("event details remain readable, but buying is disabled when the inventory DB is down", async (context) => {
  context.mock.method(getStripe().prices, "list", () => ({
    async *[Symbol.asyncIterator]() {
      yield {
        id: "price_example", active: true, type: "one_time", livemode: false, unit_amount: 5000, currency: "usd", metadata: {},
        product: { id: "prod_example", active: true, name: "Example event", images: [], metadata: { type: "event" } },
      };
    },
  }));
  context.mock.method(getPool(), "query", async () => { throw Object.assign(new Error("Unavailable"), { code: "ENOTFOUND" }); });
  const response = await fetch(`${origin}/events`);
  assert.equal(response.status, 200);
  const body = await response.json() as { inventoryReady: boolean; events: Array<{ tickets: Array<{ configured: boolean; remaining: number }> }> };
  assert.equal(body.inventoryReady, false);
  assert.equal(body.events.length, 1);
  assert.equal(body.events[0].tickets[0].configured, false);
  assert.equal(body.events[0].tickets[0].remaining, 0);
});

test("checkout rejects invalid quantities before making Stripe requests", async () => {
  const response = await fetch(`${origin}/checkout`, {
    method: "POST", body: JSON.stringify({ priceId: "price_test", quantity: 11, requestId: "6b112304-8047-45a8-a404-481e8a3f3a11" }),
  });
  assert.equal(response.status, 400);
});

test("webhook rejects a forged signature", async (context) => {
  const retrieve = context.mock.method(getStripe().checkout.sessions, "retrieve", async () => { throw new Error("Must not retrieve"); });
  const response = await fetch(`${origin}/webhook`, {
    method: "POST", headers: { "stripe-signature": "t=1,v1=forged" }, body: '{"type":"checkout.session.completed"}',
  });
  assert.equal(response.status, 400);
  assert.equal(retrieve.mock.callCount(), 0);
});

test("webhook verifies the original body and acknowledges an unrelated signed event", async () => {
  const payload = JSON.stringify({ id: "evt_test", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_test_unrelated", metadata: {} } } });
  const signature = getStripe().webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  const response = await fetch(`${origin}/webhook`, { method: "POST", headers: { "stripe-signature": signature }, body: payload });
  assert.equal(response.status, 200);
  const changedBody = await fetch(`${origin}/webhook`, { method: "POST", headers: { "stripe-signature": signature }, body: `${payload} ` });
  assert.equal(changedBody.status, 400);
});
