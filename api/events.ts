import type { IncomingMessage, ServerResponse } from "node:http";
import type Stripe from "stripe";
import { getStripe, isEventProduct } from "./_stripe.js";
import { getAvailability } from "./_inventory.js";

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET" }).end();
    return;
  }

  try {
    const prices: Stripe.Price[] = [];
    for await (const price of getStripe().prices.list({
      active: true,
      type: "one_time",
      expand: ["data.product"],
      limit: 100,
    })) prices.push(price);
    let availability: Awaited<ReturnType<typeof getAvailability>> = new Map();
    let inventoryReady = true;
    try {
      if (prices.length) availability = await getAvailability(prices.map((price) => price.id), prices[0].livemode);
    } catch (error) {
      inventoryReady = false;
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "NOT_CONFIGURED";
      console.error(`Inventory database unavailable (${code}); ticket sales are disabled.`);
    }

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
        configured: boolean;
        remaining: number;
      }>;
    }>();

    for (const price of prices) {
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
        configured: availability.get(price.id)?.configured ?? false,
        remaining: availability.get(price.id)?.remaining ?? 0,
      });
      eventMap.set(product.id, event);
    }

    const events = [...eventMap.values()]
      .map((event) => ({ ...event, tickets: event.tickets.sort((a, b) => a.price - b.price) }))
      .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));

    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ events, inventoryReady }));
  } catch (error) {
    console.error("Unable to load ticket availability.", error instanceof Error ? error.name : "Unknown error");
    response.statusCode = 500;
    response.end(JSON.stringify({ error: "Events are unavailable right now." }));
  }
}
