import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { db, workspaces } from '@/db';
import { currentUser, currentOrg } from '@/lib/session';
import NewClient from '@/components/NewClient';

export default async function Dashboard() {
  const u = await currentUser();
  if (!u) redirect('/login');
  const { org, role } = await currentOrg(u.id);
  const clients = await db.select().from(workspaces)
    .where(eq(workspaces.orgId, org.id)).orderBy(desc(workspaces.createdAt));

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
          <p className="text-[var(--muted)] mt-1">
            {org.name} · {org.plan} plan · <span className="text-[var(--accent)]">{org.credits} credits</span> · you are {role}
          </p>
        </div>
        <Link href="/billing" className="text-sm underline underline-offset-4 text-[var(--muted)]">Billing</Link>
      </div>

      <NewClient />

      {clients.length === 0 ? (
        <p className="text-[var(--muted)]">No clients yet. Add your first one above.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map(c => (
            <Link key={c.id} href={`/dashboard/${c.id}`}
              className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 hover:border-[var(--accent)] transition">
              <div className="font-medium">{c.brandName}</div>
              <div className="text-sm text-[var(--muted)] mt-1">{c.websiteUrl || 'No website — owner intake'}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
