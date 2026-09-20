import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, describe, test } from "node:test";
import type Stripe from "stripe";
import { getPool } from "../api/_db.js";
import { ensureCheckoutSession, getAvailability, reserveTickets, settleReservation } from "../api/_inventory.js";
import { getStripe } from "../api/_stripe.js";

type Reservation = Awaited<ReturnType<typeof reserveTickets>>;

const fixturePriceIds = new Set<string>();
let databaseReady = false;
let databaseStarted = false;

const hasStatus = (statusCode: number) => (error: unknown) => {
  assert.ok(error && typeof error === "object" && "statusCode" in error);
  assert.equal(error.statusCode, statusCode);
  return true;
};

const createInventory = async (
  capacity = 8,
  options: { priceId?: string; livemode?: boolean; initialSold?: number; enabled?: boolean } = {},
) => {
  const priceId = options.priceId ?? `price_inventory_test_${randomUUID().replaceAll("-", "")}`;
  fixturePriceIds.add(priceId);
  await getPool().query(
    `INSERT INTO ticket_inventory (price_id, livemode, capacity, initial_sold, enabled)
     VALUES ($1, $2, $3, $4, $5)`,
    [priceId, options.livemode ?? false, capacity, options.initialSold ?? 0, options.enabled ?? true],
  );
  return priceId;
};

const reserve = (priceId: string, quantity: number, requestId = randomUUID(), livemode = false) => {
  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [{ price: priceId, quantity }],
    success_url: "https://inventory.example.test/events?checkout=success",
    cancel_url: "https://inventory.example.test/events?checkout=cancelled",
    client_reference_id: requestId,
    expand: ["line_items"],
    metadata: { reservation_id: requestId, price_id: priceId, quantity: String(quantity) },
  };
  return reserveTickets({ requestId, priceId, quantity, livemode, checkoutParams });
};

const availability = async (priceId: string, livemode = false) => {
  const result = (await getAvailability([priceId], livemode)).get(priceId);
  assert.ok(result, "Requested prices must have an availability result");
  return {
    capacity: result.capacity,
    sold: result.sold,
    reserved: result.reserved,
    remaining: result.remaining,
    configured: result.configured,
  };
};

const attachSession = async (reservation: Reservation) => {
  const sessionId = `cs_test_inventory_${randomUUID().replaceAll("-", "")}`;
  await getPool().query(
    `UPDATE ticket_reservations
     SET stripe_session_id = $2, status = 'open', checkout_url = $3
     WHERE id = $1`,
    [reservation.id, sessionId, `https://checkout.example.test/${sessionId}`],
  );
  return {
    id: sessionId,
    object: "checkout.session",
    livemode: reservation.livemode,
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    client_reference_id: reservation.id,
    url: `https://checkout.example.test/${sessionId}`,
    expires_at: Math.floor(Date.now() / 1000) + 1_800,
    line_items: {
      object: "list",
      has_more: false,
      url: `/v1/checkout/sessions/${sessionId}/line_items`,
      data: [{
        id: `li_inventory_${randomUUID()}`,
        object: "item",
        quantity: reservation.quantity,
        price: { id: reservation.price_id },
      }],
    },
    metadata: {
      reservation_id: reservation.id,
      price_id: reservation.price_id,
      quantity: String(reservation.quantity),
    },
  } as unknown as Stripe.Checkout.Session;
};

describe("PostgreSQL ticket inventory", { concurrency: false }, () => {
  before(async () => {
    assert.ok(process.env.TEST_DATABASE_URL, "Set TEST_DATABASE_URL to a disposable PostgreSQL test database");
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.STRIPE_SECRET_KEY = "sk_test_inventory_tests_only";
    getPool();
    databaseStarted = true;
    await getPool().query(await readFile(resolve("db/001_inventory.sql"), "utf8"));
    databaseReady = true;
  });

  after(async () => {
    if (!databaseStarted) return;
    try {
      if (databaseReady) {
        const priceIds = [...fixturePriceIds];
        await getPool().query("DELETE FROM ticket_reservations WHERE price_id = ANY($1::text[])", [priceIds]);
        await getPool().query("DELETE FROM ticket_inventory WHERE price_id = ANY($1::text[])", [priceIds]);
      }
    } finally {
      await getPool().end();
    }
  });

  test("concurrent buyers cannot reserve more than the eight available tickets", async () => {
    const priceId = await createInventory(8);
    const results = await Promise.allSettled(Array.from({ length: 20 }, () => reserve(priceId, 1)));
    const successful = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    assert.equal(successful.length, 8);
    assert.equal(rejected.length, 12);
    for (const result of rejected) hasStatus(409)(result.reason);
    assert.deepEqual(await availability(priceId), {
      capacity: 8, sold: 0, reserved: 8, remaining: 0, configured: true,
    });
  });

  test("concurrent retries reserve a request's quantity only once", async () => {
    const priceId = await createInventory();
    const requestId = randomUUID();
    const results = await Promise.all(Array.from({ length: 12 }, () => reserve(priceId, 3, requestId)));
    assert.equal(new Set(results.map((result) => result.id)).size, 1);
    assert.equal(results[0]?.id, requestId);
    assert.equal((await availability(priceId)).reserved, 3);
    assert.equal((await availability(priceId)).remaining, 5);
  });

  test("reusing a request ID cannot change its quantity, price, or Stripe mode", async () => {
    const priceId = await createInventory();
    await createInventory(8, { priceId, livemode: true });
    const otherPriceId = await createInventory();
    const requestId = randomUUID();
    await reserve(priceId, 2, requestId);
    await assert.rejects(reserve(priceId, 3, requestId), hasStatus(409));
    await assert.rejects(reserve(otherPriceId, 2, requestId), hasStatus(409));
    await assert.rejects(reserve(priceId, 2, requestId, true), hasStatus(409));
    assert.equal((await availability(priceId)).reserved, 2);
    assert.equal((await availability(otherPriceId)).reserved, 0);
    assert.equal((await availability(priceId, true)).reserved, 0);
  });

  test("quantity validation rejects invalid values without holding inventory", async () => {
    const priceId = await createInventory(68);
    for (const quantity of [0, -1, 11, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      await assert.rejects(reserve(priceId, quantity), hasStatus(400));
    }
    assert.equal((await availability(priceId)).reserved, 0);
  });

  test("missing or disabled inventory cannot accept purchases", async () => {
    const unknownPriceId = `price_inventory_missing_${randomUUID().replaceAll("-", "")}`;
    await assert.rejects(reserve(unknownPriceId, 1), hasStatus(503));
    assert.equal((await getAvailability([unknownPriceId], false)).has(unknownPriceId), false);
    const disabledPriceId = await createInventory(8, { enabled: false });
    await assert.rejects(reserve(disabledPriceId, 1));
    assert.equal((await availability(disabledPriceId)).reserved, 0);
  });

  test("initial sales and multi-ticket quantities both reduce remaining capacity", async () => {
    const priceId = await createInventory(68, { initialSold: 60 });
    await reserve(priceId, 6);
    await assert.rejects(reserve(priceId, 3), hasStatus(409));
    assert.deepEqual(await availability(priceId), {
      capacity: 68, sold: 60, reserved: 6, remaining: 2, configured: true,
    });
  });

  test("test and live purchases use separate inventory", async () => {
    const priceId = await createInventory(8);
    await createInventory(68, { priceId, livemode: true, initialSold: 1 });
    await reserve(priceId, 2);
    await reserve(priceId, 5, randomUUID(), true);
    assert.deepEqual(await availability(priceId), {
      capacity: 8, sold: 0, reserved: 2, remaining: 6, configured: true,
    });
    assert.deepEqual(await availability(priceId, true), {
      capacity: 68, sold: 1, reserved: 5, remaining: 62, configured: true,
    });
  });

  test("duplicate payment settlement sells tickets once and a stale expiry cannot undo it", async () => {
    const priceId = await createInventory();
    const session = await attachSession(await reserve(priceId, 3));
    await Promise.all(Array.from({ length: 8 }, () => settleReservation(session)));
    await settleReservation({ ...session, status: "expired", payment_status: "unpaid" });
    assert.deepEqual(await availability(priceId), {
      capacity: 8, sold: 3, reserved: 0, remaining: 5, configured: true,
    });
  });

  test("expired checkout releases its full hold once so another customer can buy", async () => {
    const priceId = await createInventory(2);
    const session = await attachSession(await reserve(priceId, 2));
    await assert.rejects(reserve(priceId, 1), hasStatus(409));
    const expiredSession = { ...session, status: "expired", payment_status: "unpaid" } as Stripe.Checkout.Session;
    await Promise.all([settleReservation(expiredSession), settleReservation(expiredSession)]);
    assert.equal((await availability(priceId)).remaining, 2);
    await reserve(priceId, 2);
    assert.equal((await availability(priceId)).remaining, 0);
  });

  test("completed but unpaid checkout keeps its hold until payment succeeds", async () => {
    const priceId = await createInventory(2);
    const session = await attachSession(await reserve(priceId, 2));
    await settleReservation({ ...session, payment_status: "unpaid" });
    assert.deepEqual(await availability(priceId), {
      capacity: 2, sold: 0, reserved: 2, remaining: 0, configured: true,
    });
    await assert.rejects(reserve(priceId, 1), hasStatus(409));
    await settleReservation(session);
    assert.equal((await availability(priceId)).sold, 2);
    assert.equal((await availability(priceId)).reserved, 0);
  });

  test("a completed free checkout consumes tickets after a full discount", async () => {
    const priceId = await createInventory();
    const session = await attachSession(await reserve(priceId, 2));
    await settleReservation({ ...session, payment_status: "no_payment_required" });
    assert.equal((await availability(priceId)).sold, 2);
    assert.equal((await availability(priceId)).reserved, 0);
  });

  test("a passed deadline alone cannot release a checkout that remains open", async () => {
    const priceId = await createInventory(2);
    const session = await attachSession(await reserve(priceId, 2));
    await getPool().query("UPDATE ticket_reservations SET expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1", [session.metadata?.reservation_id]);
    await settleReservation({ ...session, status: "open", payment_status: "unpaid", expires_at: Math.floor(Date.now() / 1000) - 60 });
    assert.equal((await availability(priceId)).reserved, 2);
    await assert.rejects(reserve(priceId, 1), hasStatus(409));
  });

  test("mismatched Session identity, mode, or metadata cannot settle another reservation", async () => {
    const priceId = await createInventory();
    const session = await attachSession(await reserve(priceId, 2));
    const forgedSessions: Stripe.Checkout.Session[] = [
      { ...session, id: `${session.id}_other` },
      { ...session, livemode: true },
      { ...session, client_reference_id: randomUUID() },
      { ...session, metadata: { ...session.metadata, price_id: "price_unrelated" } },
      { ...session, metadata: { ...session.metadata, quantity: "3" } },
      { ...session, line_items: { ...session.line_items!, data: [{ ...session.line_items!.data[0], quantity: 3 }] } },
      { ...session, line_items: { ...session.line_items!, has_more: true } },
    ];
    for (const forgedSession of forgedSessions) {
      await assert.rejects(settleReservation(forgedSession));
      assert.equal((await availability(priceId)).reserved, 2);
      assert.equal((await availability(priceId)).sold, 0);
    }
    await settleReservation(session);
    assert.equal((await availability(priceId)).sold, 2);
  });

  test("uncertain Stripe creation keeps the reservation held", async (context) => {
    const priceId = await createInventory(2);
    const reservation = await reserve(priceId, 2);
    context.mock.method(getStripe().checkout.sessions, "create", async () => { throw new Error("Timed out"); });
    await assert.rejects(ensureCheckoutSession(reservation));
    assert.equal((await availability(priceId)).reserved, 2);
    await assert.rejects(reserve(priceId, 1), hasStatus(409));
  });

  test("Stripe retries use the persisted parameters and the same idempotency key", async (context) => {
    const priceId = await createInventory(2);
    const reservation = await reserve(priceId, 2);
    const session = { ...await attachSession(reservation), status: "open", payment_status: "unpaid" } as Stripe.Checkout.Session;
    const calls: Array<{params: unknown; options: unknown}> = [];
    context.mock.method(getStripe().checkout.sessions, "create", async (params: unknown, options: unknown) => {
      calls.push({ params, options });
      return session;
    });
    await ensureCheckoutSession(reservation);
    await ensureCheckoutSession(reservation);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.deepEqual(call.params, reservation.checkout_params);
      assert.deepEqual(call.options, { idempotencyKey: `bv_ticket_${reservation.id}` });
    }
    assert.equal((await availability(priceId)).reserved, 2);
  });

  test("an old hold releases only after Stripe confirms expiration", async (context) => {
    const priceId = await createInventory(2);
    const reservation = await reserve(priceId, 2);
    reservation.created_at = new Date(Date.now() - 36 * 60 * 1000);
    const session = { ...await attachSession(reservation), status: "open", payment_status: "unpaid" } as Stripe.Checkout.Session;
    context.mock.method(getStripe().checkout.sessions, "create", async () => session);
    context.mock.method(getStripe().checkout.sessions, "expire", async () => ({ ...session, status: "expired" }));
    await ensureCheckoutSession(reservation);
    assert.equal((await availability(priceId)).remaining, 2);
  });

  test("payment winning an expiration race is recorded as sold", async (context) => {
    const priceId = await createInventory(2);
    const reservation = await reserve(priceId, 2);
    reservation.created_at = new Date(Date.now() - 36 * 60 * 1000);
    const paidSession = await attachSession(reservation);
    context.mock.method(getStripe().checkout.sessions, "create", async () => ({ ...paidSession, status: "open", payment_status: "unpaid" }));
    context.mock.method(getStripe().checkout.sessions, "expire", async () => { throw new Error("Session already completed"); });
    context.mock.method(getStripe().checkout.sessions, "retrieve", async () => paidSession);
    await ensureCheckoutSession(reservation);
    assert.equal((await availability(priceId)).sold, 2);
    assert.equal((await availability(priceId)).remaining, 0);
  });

  test("an unbound hold older than the safe retry window cannot create another session", async (context) => {
    const priceId = await createInventory(2);
    const reservation = await reserve(priceId, 2);
    reservation.created_at = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const create = context.mock.method(getStripe().checkout.sessions, "create", async () => { throw new Error("Must not create"); });
    await assert.rejects(ensureCheckoutSession(reservation), hasStatus(503));
    assert.equal(create.mock.callCount(), 0);
    assert.equal((await availability(priceId)).reserved, 2);
  });
});
