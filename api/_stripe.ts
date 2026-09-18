import Stripe from "stripe";

let stripe: Stripe | undefined;

export const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
};

export const isEventProduct = (
  product: Stripe.Product | Stripe.DeletedProduct,
): product is Stripe.Product =>
  !("deleted" in product) && product.active &&
  (product.metadata.type === "event" || Boolean(product.metadata.event_date));
