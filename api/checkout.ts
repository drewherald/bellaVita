import type { IncomingMessage, ServerResponse } from "node:http";
import type Stripe from "stripe";
import { getStripe, isEventProduct } from "./_stripe.js";

const readBody = async (request: IncomingMessage) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  return JSON.parse(body) as { priceId?: unknown };
};

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json");
  if (request.method !== "POST") {
    response.writeHead(405, { Allow: "POST" }).end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const { priceId } = await readBody(request);
    if (typeof priceId !== "string" || !priceId.startsWith("price_")) {
      response.statusCode = 400;
      response.end(JSON.stringify({ error: "Invalid event selection." }));
      return;
    }

    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product as Stripe.Product | Stripe.DeletedProduct;
    if (!price.active || price.type !== "one_time" || !isEventProduct(product)) {
      response.statusCode = 400;
      response.end(JSON.stringify({ error: "This event is not available." }));
      return;
    }

    const host = request.headers["x-forwarded-host"] ?? request.headers.host;
    const protocol = request.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "development" ? "http" : "https");
    const siteUrl = process.env.SITE_URL || `${protocol}://${host}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price: price.id,
        quantity: 1,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
      }],
      success_url: `${siteUrl}/events?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/events?checkout=cancelled`,
      billing_address_collection: "auto",
      customer_creation: "always",
      allow_promotion_codes: true,
      metadata: { event_product_id: product.id },
    });

    response.end(JSON.stringify({ url: session.url }));
  } catch (error) {
    console.error("Unable to create Stripe Checkout Session", error);
    response.statusCode = 500;
    response.end(JSON.stringify({ error: "Checkout could not be started. Please try again." }));
  }
}
