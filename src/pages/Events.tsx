import { useCallback, useEffect, useRef, useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "../assets/styles/Events/Events.css";
import heroImage from "../assets/photos/home/stockinside.jpg";
import tonyocean from '../assets/photos/events/tonyocean.jpg'

type Ticket = {
  priceId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  configured: boolean;
  remaining: number;
};

type EventItem = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  date: string | null;
  location: string | null;
  age: string | null;
  capacity: string | null;
  tickets: Ticket[];
};

const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);

const formatDate = (date: string | null) => {
  if (!date) return "Date to be announced";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryReady, setInventoryReady] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const checkoutRequests = useRef(new Map<string, string>());
  const query = new URLSearchParams(window.location.search);
  const checkoutStatus = query.get("checkout");
  const checkoutSessionId = query.get("session_id");
  const [paymentStatus, setPaymentStatus] = useState<"checking" | "confirmed" | "unverified">("checking");

  const refreshEvents = useCallback((signal?: AbortSignal) =>
    fetch("/api/events", { signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Events are unavailable right now. Please try again shortly.");
        }
        return response.json() as Promise<{ events: EventItem[]; inventoryReady: boolean }>;
      })
      .then(({ events: eventData, inventoryReady: ready }) => {
        setEvents(eventData);
        setInventoryReady(ready);
        setEventsError(null);
      }), []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshEvents(controller.signal)
      .catch(() => {
        if (!controller.signal.aborted) setEventsError("Events are unavailable right now. Please try again shortly.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    const refreshAvailability = () => {
      if (document.visibilityState === "visible") {
        void refreshEvents(controller.signal).catch(() => {});
      }
    };
    const interval = window.setInterval(refreshAvailability, 30_000);
    window.addEventListener("focus", refreshAvailability);
    document.addEventListener("visibilitychange", refreshAvailability);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshAvailability);
      document.removeEventListener("visibilitychange", refreshAvailability);
    };
  }, [refreshEvents]);

  useEffect(() => {
    if (checkoutStatus !== "success" || !checkoutSessionId) return;
    const controller = new AbortController();
    let timer: number | undefined;
    let attempts = 0;

    const checkPayment = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(checkoutSessionId)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.ok) {
          const { confirmed } = await response.json() as { confirmed: boolean };
          if (confirmed) {
            setPaymentStatus("confirmed");
            void refreshEvents(controller.signal).catch(() => {});
            return;
          }
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (controller.signal.aborted) return;
      if (attempts < 15) timer = window.setTimeout(() => void checkPayment(), 2_000);
      else setPaymentStatus("unverified");
    };

    void checkPayment();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [checkoutStatus, checkoutSessionId, refreshEvents]);

  const buyTickets = async (priceId: string, quantity: number) => {
    setCheckingOut(priceId);
    setError(null);
    try {
      const requestKey = `${priceId}:${quantity}`;
      const requestId = checkoutRequests.current.get(requestKey) ?? crypto.randomUUID();
      checkoutRequests.current.set(requestKey, requestId);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, quantity, requestId }),
      });
      if (response.status === 400 || response.status === 409) {
        checkoutRequests.current.delete(requestKey);
      }
      if (response.status === 409) {
        void refreshEvents().catch(() => {});
      }
      const data = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(response.status === 409
          ? "Ticket availability has changed. Please check the remaining tickets and try again."
          : "Checkout could not be started. Please try again shortly.");
        setCheckingOut(null);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("We couldn’t connect to checkout. Please check your connection and try again.");
      setCheckingOut(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="events-page">
        <section className="events-hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.48), rgba(0,0,0,.58)), url(${heroImage})` }}>
          <h1>Events</h1>
        </section>

        {!loading && !inventoryReady && (
          <div className="events-notice" role="status">Ticket sales are temporarily unavailable. Please check back shortly.</div>
        )}

        {checkoutStatus === "success" && (
          <div className={`events-notice${paymentStatus === "confirmed" ? " events-notice--success" : ""}`} role="status">
            {paymentStatus === "confirmed"
              ? "Your payment is confirmed. Stripe will send your receipt to the email used at checkout."
              : paymentStatus === "checking" && checkoutSessionId
                ? "We’re checking your payment. This may take a moment…"
                : "We couldn’t confirm your payment yet. Please check your email for a receipt or contact Bella Vita before purchasing again."}
          </div>
        )}
        {checkoutStatus === "cancelled" && (
          <div className="events-notice" role="status">Checkout wasn’t completed. Any temporary ticket hold will be released when checkout expires.</div>
        )}
        {eventsError && <div className="events-notice events-notice--error" role="alert">{eventsError}</div>}
        {error && <div className="events-notice events-notice--error" role="alert">{error}</div>}

        <section className="events-list" aria-busy={loading}>
          {loading && <p className="events-state">Preparing the calendar…</p>}
          {!loading && !eventsError && events.length === 0 && (
            <div className="events-state">
              <h2>More gatherings are coming soon.</h2>
              <p>Check back for our next dinner, tasting, or special celebration.</p>
            </div>
          )}

          <article className="event-card" >
              <div className="event-card__heading"><span />{"Upcoming Event"}<span /></div>
              <div className="event-card__feature">
                <div className="event-card__image-wrap">
                  <img className="event-card__image" src={tonyocean} alt="" /> 
                </div>
                <div className="event-card__body">
                  <p className="event-card__kicker">A Bella Vita Special Event</p>
                  <h2>Tony Ocean</h2>
                  <p className="event-card__date">Sunday, October 4, 2026 at 7:00 PM</p>
                  <p>Bella Vita Restaurant</p>
                  <p className="event-card__description">Get ready for an unforgettable night with Tony Ocean, bringing smooth vocals, timeless favorites, and high-energy entertainment to the stage.
                    Tony's upbeat style embodies a time from the past that will be popular as long as we still enjoy the music of Sinatra, Martin, Davis, and others whose romantic songs and lyrics have affected so many of our lives through the years.
                  </p>
                </div>
              </div>
            </article>

          {events.map((event, index) => (
            <article className="event-card" key={event.id}>
              <div className="event-card__heading"><span />{index === 0 ? "Featured Event" : "Upcoming Event"}<span /></div>
              <div className="event-card__feature">
                <div className="event-card__image-wrap">
                  {event.image ? <img className="event-card__image" src={event.image} alt="" /> : <div className="event-card__monogram">BV</div>}
                </div>
                <div className="event-card__body">
                  <p className="event-card__kicker">A Bella Vita Special Event</p>
                  <h2>{event.name}</h2>
                  <p className="event-card__date">{formatDate(event.date)}</p>
                  {event.location && <p>{event.location}</p>}
                  {event.age && <p>{event.age}</p>}
                  {event.capacity && <p>{event.capacity}</p>}
                  {event.description && <p className="event-card__description">{event.description}</p>}
                </div>
              </div>
              <div className="ticket-panel">
                <div className="ticket-panel__tiers">
                  {event.tickets.map((ticket) => {
                    const maximum = Math.max(0, Math.min(10, ticket.remaining));
                    const canPurchase = ticket.configured && maximum > 0;
                    const quantity = Math.min(quantities[ticket.priceId] ?? 1, maximum);
                    return (
                      <div className="ticket-tier" key={ticket.priceId}>
                        <h3>{ticket.name}</h3>
                        <strong>{formatPrice(ticket.price, ticket.currency)}</strong>
                        {ticket.description && <p>{ticket.description}</p>}
                        <p className="ticket-tier__availability">
                          {!inventoryReady ? "Ticket availability is temporarily unavailable" : !ticket.configured ? "Tickets coming soon" : ticket.remaining > 0
                            ? `${ticket.remaining} remaining`
                            : "Sold out"}
                        </p>
                        {canPurchase && (
                          <label className="ticket-tier__quantity">
                            Quantity
                            <select
                              aria-label={`Quantity for ${ticket.name}`}
                              value={quantity}
                              disabled={checkingOut !== null}
                              onChange={(event) => setQuantities((previous) => ({ ...previous, [ticket.priceId]: Number(event.target.value) }))}
                            >
                              {Array.from({ length: maximum }, (_, index) => index + 1).map((count) => (
                                <option key={count} value={count}>{count}</option>
                              ))}
                            </select>
                          </label>
                        )}
                        <button onClick={() => void buyTickets(ticket.priceId, quantity)} disabled={checkingOut !== null || !canPurchase}>
                          {checkingOut === ticket.priceId ? "Opening checkout…"
                            : !inventoryReady ? "Temporarily unavailable"
                              : !ticket.configured ? "Tickets coming soon"
                              : !canPurchase ? "Sold out" : "Buy tickets"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </section>

       {/* <section className="private-events" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.52), rgba(0,0,0,.62)), url(${privateDiningImage})` }}>
          <div>
            <h2>Private Events</h2>
            <p>Book your table and settle in for a relaxed Italian meal, shared with good company.</p>
            <a href="/about">Reserve a table</a>
          </div>
        </section>*/}
      </main>
      <Footer />
    </>
  );
}
