import { redirect } from 'next/navigation';
import { currentUser, currentOrg } from '@/lib/session';
import { PLANS, isBillingConfigured } from '@/lib/plans';
import Upgrade from '@/components/Upgrade';

export default async function Billing() {
  const u = await currentUser();
  if (!u) redirect('/login');
  const { org } = await currentOrg(u.id);
  const configured = isBillingConfigured();
  const keys = Object.keys(PLANS) as (keyof typeof PLANS)[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[27px] font-bold tracking-tight text-[var(--chalk)]">Plan</h1>
        <p className="mt-1.5 text-[14px] text-[var(--chalk-dim)]">
          On {PLANS[org.plan].name}. {org.credits} credits left. One credit covers a profile or a batch of posts.
        </p>
      </header>

      {!configured && (
        <p className="text-[13px] leading-relaxed text-[var(--lamp)] border-l-2 border-[var(--lamp-dim)] pl-4 max-w-[62ch]">
          Checkout is switched off until Stripe keys are set. Add STRIPE_SECRET_KEY and the
          three STRIPE_PRICE_ ids to apps/web/.env.local. Everything else works without them.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {keys.map(k => {
          const p = PLANS[k];
          const current = org.plan === k;
          return (
            <div key={k} className="surface p-5 flex flex-col"
              style={current ? { borderColor: 'var(--lamp)' } : undefined}>
              <div className="text-[15px] font-semibold text-[var(--chalk)]">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[26px] font-bold text-[var(--chalk)]">${p.priceUsd}</span>
                <span className="text-[13px] text-[var(--chalk-dim)]">/month</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-[13px] text-[var(--chalk-dim)] flex-1">
                <li>{p.credits} credits</li>
                <li>{p.clients} client{p.clients > 1 ? 's' : ''}</li>
              </ul>
              <div className="mt-5">
                {current
                  ? <div className="text-[13px] text-[var(--lamp)]">Your plan</div>
                  : <Upgrade plan={k} disabled={!configured || k === 'free'} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
