import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, organizations, creditLedger } from '@/db';
import { PLANS, type PlanKey } from '@/lib/plans';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  const body = await req.text();
  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(key);

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e: any) {
    return NextResponse.json({ error: `Bad signature: ${e.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const orgId = s.client_reference_id as string;
    const planKey = (Object.keys(PLANS) as PlanKey[])
      .find(k => PLANS[k].stripePriceEnv && process.env[PLANS[k].stripePriceEnv!] === s?.line_items?.data?.[0]?.price?.id)
      ?? 'starter';

    if (orgId) {
      await db.update(organizations).set({
        plan: planKey,
        credits: PLANS[planKey].credits,
        stripeCustomerId: s.customer as string,
        stripeSubscriptionId: s.subscription as string
      }).where(eq(organizations.id, orgId));

      await db.insert(creditLedger).values({
        orgId, delta: PLANS[planKey].credits, reason: `subscribed to ${planKey}`
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await db.update(organizations).set({ plan: 'free', credits: 10 })
      .where(eq(organizations.stripeSubscriptionId, sub.id));
  }

  return NextResponse.json({ received: true });
}
