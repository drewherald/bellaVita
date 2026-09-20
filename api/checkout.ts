import type { IncomingMessage, ServerResponse } from "node:http";
import type Stripe from "stripe";
import { getStripe, isEventProduct } from "./_stripe.js";
import { ensureCheckoutSession, reserveTickets, validRequestId } from "./_inventory.js";
import { HttpError, json, readRawBody, siteUrl } from "./_http.js";

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Method not allowed" });
  }
  try {
    const origin = siteUrl();
    if (request.headers.origin && request.headers.origin !== origin && process.env.NODE_ENV !== "development") {
      throw new HttpError(403, "Checkout must be started from our website.");
    }
    let body: { priceId?: unknown; quantity?: unknown; requestId?: unknown };
    try { body = JSON.parse((await readRawBody(request, 4096)).toString()); }
    catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(400, "Invalid checkout request.");
    }
    if (!body || typeof body !== "object") throw new HttpError(400, "Invalid checkout request.");
    const { priceId, quantity, requestId } = body;
    if (typeof priceId !== "string" || !/^price_[a-zA-Z0-9]+$/.test(priceId) || !validRequestId(requestId)) {
      throw new HttpError(400, "Invalid event selection. Please refresh and try again.");
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new HttpError(400, "Choose a quantity between 1 and 10.");
    }
    const price = await getStripe().prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product as Stripe.Product | Stripe.DeletedProduct;
    if (!price.active || price.type !== "one_time" || !isEventProduct(product)) {
      throw new HttpError(400, "This event is not available.");
    }
    const reservationId = requestId.toLowerCase();
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity }],
      success_url: `${origin}/events?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/events?checkout=cancelled`,
      billing_address_collection: "auto",
      customer_creation: "always",
      allow_promotion_codes: true,
      client_reference_id: reservationId,
      metadata: {
        reservation_id: reservationId, event_product_id: product.id,
        price_id: price.id, quantity: String(quantity),
      },
      expand: ["line_items"],
    };
    const reservation = await reserveTickets({ requestId: reservationId, priceId, quantity, livemode: price.livemode, checkoutParams: params });
    const session = await ensureCheckoutSession(reservation);
    if (session.status !== "open" || !session.url) throw new HttpError(409, "This checkout has already ended. Please try again.");
    json(response, 200, { url: session.url });
  } catch (error) {
    if (error instanceof HttpError) return json(response, error.statusCode, { error: error.message });
    console.error("Unable to start ticket checkout. Any uncertain reservation remains held.");
    json(response, 503, { error: "Checkout could not be started. Please retry the same selection shortly." });
  }
}
