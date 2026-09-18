import { redirect } from 'next/navigation';
import { desc, sql, eq } from 'drizzle-orm';
import { db, organizations, user, generationJobs, posts, workspaces } from '@/db';
import { currentUser } from '@/lib/session';

const ADMINS = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);

export default async function Admin() {
  const u = await currentUser();
  if (!u) redirect('/login');
  if (ADMINS.length && !ADMINS.includes(u.email)) {
    return (
      <div className="surface p-6 max-w-[60ch]">
        <h1 className="text-[18px] font-semibold text-[var(--chalk)]">Admin is restricted</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--chalk-dim)]">
          Add {u.email} to ADMIN_EMAILS in apps/web/.env.local and restart to see this page.
        </p>
      </div>
    );
  }

  const [orgs, userCount, jobsByStatus, recent, postCount] = await Promise.all([
    db.select().from(organizations).orderBy(desc(organizations.createdAt)).limit(50),
    db.select({ n: sql<number>`count(*)::int` }).from(user),
    db.select({
      status: generationJobs.status,
      n: sql<number>`count(*)::int`,
      cost: sql<number>`coalesce(sum(${generationJobs.costUsd}),0)::float`
    }).from(generationJobs).groupBy(generationJobs.status),
    db.select({ job: generationJobs, ws: workspaces }).from(generationJobs)
      .leftJoin(workspaces, eq(workspaces.id, generationJobs.workspaceId))
      .orderBy(desc(generationJobs.createdAt)).limit(15),
    db.select({ n: sql<number>`count(*)::int` }).from(posts)
  ]);

  const failed = jobsByStatus.find(j => j.status === 'error')?.n ?? 0;
  const totalJobs = jobsByStatus.reduce((a, j) => a + j.n, 0);
  const spend = jobsByStatus.reduce((a, j) => a + j.cost, 0);

  return (
    <div className="space-y-9">
      <header>
        <h1 className="text-[27px] font-bold tracking-tight text-[var(--chalk)]">Admin</h1>
        <p className="mt-1.5 text-[14px] text-[var(--chalk-dim)]">Everything across every account.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Accounts" value={orgs.length} />
        <Stat label="People" value={userCount[0]?.n ?? 0} />
        <Stat label="Posts written" value={postCount[0]?.n ?? 0} />
        <Stat label="Jobs run" value={totalJobs} />
        <Stat label="Failed" value={failed} alert={failed > 0} />
      </div>

      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold text-[var(--chalk)]">Accounts</h2>
        <table className="mt-3">
          <thead><tr><th>Name</th><th>Plan</th><th>Credits</th><th>Stripe</th></tr></thead>
          <tbody>
            {orgs.map(o => (
              <tr key={o.id}>
                <td className="text-[var(--chalk)]">{o.name}</td>
                <td>{o.plan}</td>
                <td>{o.credits}</td>
                <td className="text-[var(--chalk-dim)]">{o.stripeCustomerId ? 'connected' : 'not connected'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="surface p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--chalk)]">Recent jobs</h2>
          <span className="text-[13px] text-[var(--chalk-dim)]">${spend.toFixed(4)} spent so far</span>
        </div>
        <table className="mt-3">
          <thead><tr><th>Client</th><th>Kind</th><th>Result</th><th>What went wrong</th></tr></thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.job.id}>
                <td className="text-[var(--chalk)]">{r.ws?.brandName ?? '—'}</td>
                <td>{r.job.type}</td>
                <td className={r.job.status === 'error' ? 'text-[var(--bad)]' : ''}>{r.job.status}</td>
                <td className="text-[var(--chalk-dim)] max-w-[280px] truncate">{r.job.error ?? ''}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={4} className="text-[var(--chalk-dim)]">Nothing has run yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="surface p-4">
      <div className="text-[13px] text-[var(--chalk-dim)]">{label}</div>
      <div className={`mt-1.5 text-[24px] font-bold ${alert ? 'text-[var(--bad)]' : 'text-[var(--chalk)]'}`}>{value}</div>
    </div>
  );
}
