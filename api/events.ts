import type { IncomingMessage, ServerResponse } from "node:http";
import type Stripe from "stripe";
import { getStripe, isEventProduct } from "./_stripe.js";

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET" }).end();
    return;
  }

  try {
    const prices = await getStripe().prices.list({
      active: true,
      type: "one_time",
      expand: ["data.product"],
      limit: 100,
    });

    const eventMap = new Map<string, {
      id: string;
      name: string;
      description: string | null;
      image: string | null;
      date: string | null;
      location: string | null;
      age: string | null;
      capacity: string | null;
      tickets: Array<{
        priceId: string;
        name: string;
        description: string | null;
        price: number;
        currency: string;
      }>;
    }>();

    for (const price of prices.data) {
      const product = price.product as Stripe.Product | Stripe.DeletedProduct;
      if (!price.unit_amount || !isEventProduct(product)) continue;

      const event = eventMap.get(product.id) ?? {
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.images[0] ?? null,
        date: product.metadata.event_date || null,
        location: product.metadata.location || null,
        age: product.metadata.age || null,
        capacity: product.metadata.capacity || null,
        tickets: [],
      };
      event.tickets.push({
        priceId: price.id,
        name: price.metadata.ticket_name || price.nickname || "General Admission",
        description: price.metadata.ticket_description || null,
        price: price.unit_amount,
        currency: price.currency.toUpperCase(),
      });
      eventMap.set(product.id, event);
    }

    const events = [...eventMap.values()]
      .map((event) => ({ ...event, tickets: event.tickets.sort((a, b) => a.price - b.price) }))
      .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));

    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ events }));
  } catch (error) {
    console.error("Unable to load Stripe events", error);
    response.statusCode = 500;
    response.end(JSON.stringify({ error: "Events are unavailable right now." }));
  }
}
