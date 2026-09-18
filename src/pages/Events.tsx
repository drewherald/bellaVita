import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "../assets/styles/Events/Events.css";
import heroImage from "../assets/photos/home/stockinside.jpg";
import privateDiningImage from "../assets/photos/home/privateDining.png";

type Ticket = {
  priceId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
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
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const query = new URLSearchParams(window.location.search);
  const checkoutStatus = query.get("checkout");
  const checkoutSessionId = query.get("session_id");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/events", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Events are unavailable right now.");
        if (!response.headers.get("content-type")?.includes("application/json")) {
          throw new Error("The events API is not running. Restart the development server and try again.");
        }
        return response.json() as Promise<{ events: EventItem[] }>;
      })
      .then(({ events: eventData }) => setEvents(eventData))
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (checkoutStatus !== "success" || !checkoutSessionId) return;
    fetch(`/api/checkout-session?session_id=${encodeURIComponent(checkoutSessionId)}`)
      .then((response) => response.json() as Promise<{ confirmed: boolean }>)
      .then(({ confirmed }) => setPaymentConfirmed(confirmed))
      .catch(() => setPaymentConfirmed(false));
  }, [checkoutStatus, checkoutSessionId]);

  const buyTickets = async (priceId: string) => {
    setCheckingOut(priceId);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Checkout could not be started.");
      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
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

        {checkoutStatus === "success" && paymentConfirmed && (
          <div className="events-notice events-notice--success" role="status">
            Your payment is confirmed. Stripe will send your receipt to the email used at checkout.
          </div>
        )}
        {checkoutStatus === "cancelled" && (
          <div className="events-notice" role="status">Checkout was cancelled. Your spot has not been reserved.</div>
        )}
        {error && <div className="events-notice events-notice--error" role="alert">{error}</div>}

        <section className="events-list" aria-busy={loading}>
          {loading && <p className="events-state">Preparing the calendar…</p>}
          {!loading && !error && events.length === 0 && (
            <div className="events-state">
              <h2>More gatherings are coming soon.</h2>
              <p>Check back for our next dinner, tasting, or special celebration.</p>
            </div>
          )}
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
                  {event.tickets.map((ticket) => (
                    <div className="ticket-tier" key={ticket.priceId}>
                      <h3>{ticket.name}</h3>
                      <strong>{formatPrice(ticket.price, ticket.currency)}</strong>
                      {ticket.description && <p>{ticket.description}</p>}
                      <button onClick={() => buyTickets(ticket.priceId)} disabled={checkingOut !== null}>
                        {checkingOut === ticket.priceId ? "Opening checkout…" : "Buy tickets"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="private-events" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.52), rgba(0,0,0,.62)), url(${privateDiningImage})` }}>
          <div>
            <h2>Private Events</h2>
            <p>Book your table and settle in for a relaxed Italian meal, shared with good company.</p>
            <a href="/about">Reserve a table</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
