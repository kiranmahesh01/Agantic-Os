import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, desc, sql } from 'drizzle-orm';
import { db, workspaces, posts } from '@/db';
import { currentUser, currentOrg } from '@/lib/session';
import NewClient from '@/components/NewClient';

export default async function Dashboard() {
  const u = await currentUser();
  if (!u) redirect('/login');
  const { org } = await currentOrg(u.id);

  const clients = await db.select({
    ws: workspaces,
    pending: sql<number>`(select count(*) from ${posts} where ${posts.workspaceId} = ${workspaces.id} and ${posts.swipe} = 'pending')::int`,
    approved: sql<number>`(select count(*) from ${posts} where ${posts.workspaceId} = ${workspaces.id} and ${posts.swipe} = 'saved')::int`
  }).from(workspaces).where(eq(workspaces.orgId, org.id)).orderBy(desc(workspaces.createdAt));

  return (
    <div className="space-y-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-bold tracking-tight text-[var(--chalk)]">Clients</h1>
          <p className="mt-1.5 text-[14px] text-[var(--chalk-dim)]">
            {org.credits} credits left on {org.plan}
          </p>
        </div>
      </header>

      <NewClient />

      {clients.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-[15px] text-[var(--chalk)]">No clients yet.</p>
          <p className="mt-2 text-[14px] text-[var(--chalk-dim)]">
            Add the restaurant you&rsquo;re working with. A website helps, but it isn&rsquo;t required.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map(({ ws, pending, approved }) => (
            <Link key={ws.id} href={`/dashboard/${ws.id}`}
              className="surface p-5 hover:border-[var(--lamp-dim)] transition-colors">
              <div className="text-[16px] font-semibold text-[var(--chalk)]">{ws.brandName}</div>
              <div className="mt-1 text-[13px] text-[var(--chalk-dim)] truncate">
                {ws.websiteUrl || 'Owner interview'}
              </div>
              <div className="mt-4 flex gap-5 text-[13px]">
                <span className={pending > 0 ? 'text-[var(--lamp)]' : 'text-[var(--chalk-dim)]'}>
                  {pending} on the pass
                </span>
                <span className="text-[var(--chalk-dim)]">{approved} approved</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
