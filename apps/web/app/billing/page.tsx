import { redirect } from 'next/navigation';
import { currentUser, currentOrg } from '@/lib/session';
import { PLANS, isBillingConfigured } from '@/lib/plans';
import Upgrade from '@/components/Upgrade';

export default async function Billing() {
  const u = await currentUser();
  if (!u) redirect('/login');
  const { org } = await currentOrg(u.id);
  const configured = isBillingConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-[var(--muted)] mt-1">
          On <strong>{PLANS[org.plan].name}</strong> · {org.credits} credits left
        </p>
      </div>

      {!configured && (
        <p className="text-sm text-amber-400 border border-amber-900/50 bg-amber-950/30 rounded-lg px-4 py-3">
          Stripe is not connected yet. The plans below are live in the code — add
          STRIPE_SECRET_KEY and the STRIPE_PRICE_* ids to apps/web/.env.local to turn checkout on.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map(k => (
          <div key={k} className={`rounded-xl border p-5 ${org.plan === k ? 'border-[var(--accent)]' : 'border-[var(--line)]'} bg-[var(--card)]`}>
            <div className="font-medium">{PLANS[k].name}</div>
            <div className="text-2xl font-semibold mt-1">${PLANS[k].priceUsd}<span className="text-sm text-[var(--muted)]">/mo</span></div>
            <ul className="text-sm text-[var(--muted)] mt-3 space-y-1">
              <li>{PLANS[k].credits} credits</li>
              <li>{PLANS[k].clients} client{PLANS[k].clients > 1 ? 's' : ''}</li>
            </ul>
            {org.plan === k
              ? <div className="mt-4 text-sm text-[var(--accent)]">Current plan</div>
              : <Upgrade plan={k} disabled={!configured || k === 'free'} />}
          </div>
        ))}
      </div>
    </div>
  );
}
