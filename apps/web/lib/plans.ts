export const PLANS = {
  free:    { name: 'Free',    priceUsd: 0,   credits: 10,   clients: 1,  stripePriceEnv: null },
  starter: { name: 'Starter', priceUsd: 29,  credits: 250,  clients: 1,  stripePriceEnv: 'STRIPE_PRICE_STARTER' },
  growth:  { name: 'Growth',  priceUsd: 49,  credits: 500,  clients: 3,  stripePriceEnv: 'STRIPE_PRICE_GROWTH' },
  pro:     { name: 'Pro',     priceUsd: 149, credits: 2000, clients: 10, stripePriceEnv: 'STRIPE_PRICE_PRO' }
} as const;

export type PlanKey = keyof typeof PLANS;
export const isBillingConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
