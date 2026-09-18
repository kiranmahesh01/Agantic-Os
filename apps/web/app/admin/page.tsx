import { redirect } from 'next/navigation';
import { desc, sql } from 'drizzle-orm';
import { db, organizations, user, generationJobs, posts, workspaces } from '@/db';
import { currentUser } from '@/lib/session';

const ADMINS = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);

export default async function Admin() {
  const u = await currentUser();
  if (!u) redirect('/login');
  if (ADMINS.length && !ADMINS.includes(u.email)) {
    return <p className="text-[var(--muted)]">Not authorised. Add your email to ADMIN_EMAILS in .env.local</p>;
  }

  const [orgs, users, jobs, recent] = await Promise.all([
    db.select().from(organizations).orderBy(desc(organizations.createdAt)).limit(50),
    db.select({ n: sql<number>`count(*)::int` }).from(user),
    db.select({
      status: generationJobs.status,
      n: sql<number>`count(*)::int`,
      cost: sql<number>`coalesce(sum(${generationJobs.costUsd}),0)::float`
    }).from(generationJobs).groupBy(generationJobs.status),
    db.select({ job: generationJobs, ws: workspaces })
      .from(generationJobs)
      .leftJoin(workspaces, sql`${workspaces.id} = ${generationJobs.workspaceId}`)
      .orderBy(desc(generationJobs.createdAt)).limit(20)
  ]);

  const postCount = await db.select({ n: sql<number>`count(*)::int` }).from(posts);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Organizations" value={orgs.length} />
        <Stat label="Users" value={users[0]?.n ?? 0} />
        <Stat label="Posts generated" value={postCount[0]?.n ?? 0} />
        <Stat label="Jobs" value={jobs.reduce((a, j) => a + j.n, 0)} />
      </div>

      <Section title="Jobs by status">
        <table className="w-full text-sm">
          <thead className="text-[var(--muted)] text-left">
            <tr><th className="py-2">Status</th><th>Count</th><th>Cost USD</th></tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.status} className="border-t border-[var(--line)]">
                <td className="py-2">{j.status}</td><td>{j.n}</td><td>${j.cost.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Organizations">
        <table className="w-full text-sm">
          <thead className="text-[var(--muted)] text-left">
            <tr><th className="py-2">Name</th><th>Plan</th><th>Credits</th><th>Stripe</th></tr>
          </thead>
          <tbody>
            {orgs.map(o => (
              <tr key={o.id} className="border-t border-[var(--line)]">
                <td className="py-2">{o.name}</td><td>{o.plan}</td><td>{o.credits}</td>
                <td className="text-[var(--muted)]">{o.stripeCustomerId ? 'linked' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Recent jobs">
        <table className="w-full text-sm">
          <thead className="text-[var(--muted)] text-left">
            <tr><th className="py-2">Client</th><th>Type</th><th>Status</th><th>Error</th></tr>
          </thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.job.id} className="border-t border-[var(--line)]">
                <td className="py-2">{r.ws?.brandName ?? '—'}</td>
                <td>{r.job.type}</td>
                <td className={r.job.status === 'error' ? 'text-red-400' : ''}>{r.job.status}</td>
                <td className="text-[var(--muted)] truncate max-w-xs">{r.job.error ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}
