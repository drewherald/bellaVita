import type { IncomingMessage, ServerResponse } from "node:http";
import { getStripe } from "./_stripe.js";

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json");
  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET" }).end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const requestUrl = new URL(request.url ?? "", `https://${request.headers.host}`);
    const sessionId = requestUrl.searchParams.get("session_id");
    if (!sessionId?.startsWith("cs_")) {
      response.statusCode = 400;
      response.end(JSON.stringify({ confirmed: false }));
      return;
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    response.end(JSON.stringify({ confirmed: session.payment_status === "paid" }));
  } catch (error) {
    console.error("Unable to verify Stripe Checkout Session", error);
    response.statusCode = 400;
    response.end(JSON.stringify({ confirmed: false }));
  }
}
