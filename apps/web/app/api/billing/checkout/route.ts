import { NextResponse } from 'next/server';
import { PLANS, isBillingConfigured, type PlanKey } from '@/lib/plans';
import { currentUser, currentOrg } from '@/lib/session';

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  if (!isBillingConfigured()) {
    return NextResponse.json({
      error: 'Billing is not configured yet. Add STRIPE_SECRET_KEY and the STRIPE_PRICE_* ids to apps/web/.env.local'
    }, { status: 501 });
  }

  const { plan } = (await req.json()) as { plan: PlanKey };
  const def = PLANS[plan];
  if (!def?.stripePriceEnv) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });

  const priceId = process.env[def.stripePriceEnv];
  if (!priceId) return NextResponse.json({ error: `${def.stripePriceEnv} is not set` }, { status: 501 });

  const { org } = await currentOrg(u.id);

  // Loaded lazily so the app runs with no Stripe package/keys present.
  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: u.email,
    client_reference_id: org.id,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?ok=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`
  });

  return NextResponse.json({ url: session.url });
}
