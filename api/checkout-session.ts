import type { IncomingMessage, ServerResponse } from "node:http";
import { getStripe } from "./_stripe.js";
import { settleReservation, validRequestId } from "./_inventory.js";
import { json } from "./_http.js";

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return json(response, 405, { confirmed: false });
  }
  try {
    const sessionId = new URL(request.url ?? "", "http://localhost").searchParams.get("session_id");
    if (!sessionId || !/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) return json(response, 400, { confirmed: false });
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    if (!validRequestId(session.metadata?.reservation_id)) return json(response, 400, { confirmed: false });
    await settleReservation(session);
    json(response, 200, { confirmed: session.status === "complete" && ["paid", "no_payment_required"].includes(session.payment_status) });
  } catch {
    json(response, 400, { confirmed: false });
  }
}
