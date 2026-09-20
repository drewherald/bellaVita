import type { IncomingMessage, ServerResponse } from "node:http";
import type Stripe from "stripe";
import { getStripe } from "./_stripe.js";
import { settleReservation, validRequestId } from "./_inventory.js";
import { HttpError, json, readRawBody } from "./_http.js";

export const config = { api: { bodyParser: false } };
const supportedEvents = new Set(["checkout.session.completed", "checkout.session.expired"]);

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Method not allowed" });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) return json(response, 503, { error: "Webhook is not configured" });
  let event: Stripe.Event;
  try {
    const signature = request.headers["stripe-signature"];
    if (typeof signature !== "string") return json(response, 400, { error: "Missing signature" });
    event = getStripe().webhooks.constructEvent(await readRawBody(request), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return json(response, error instanceof HttpError ? error.statusCode : 400, { error: "Invalid webhook" });
  }
  if (!supportedEvents.has(event.type)) return json(response, 200, { received: true });
  const incoming = event.data.object as Stripe.Checkout.Session;
  if (!validRequestId(incoming.metadata?.reservation_id)) return json(response, 200, { received: true });
  try {
    // Use current Stripe state so delayed notifications cannot roll back a sale.
    const session = await getStripe().checkout.sessions.retrieve(incoming.id, { expand: ["line_items"] });
    await settleReservation(session);
    json(response, 200, { received: true });
  } catch {
    console.error(`Unable to process ticket webhook ${event.id}; Stripe should retry.`);
    json(response, 500, { error: "Unable to process webhook" });
  }
}
