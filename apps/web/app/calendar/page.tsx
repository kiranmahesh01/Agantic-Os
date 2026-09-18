import { redirect } from 'next/navigation';
import { eq, and, inArray, isNotNull, asc } from 'drizzle-orm';
import { db, posts, workspaces, members } from '@/db';
import { currentUser, currentOrg } from '@/lib/session';

export default async function Calendar() {
  const u = await currentUser();
  if (!u) redirect('/login');
  const { org } = await currentOrg(u.id);

  const mine = await db.select({ id: workspaces.id, name: workspaces.brandName })
    .from(workspaces).where(eq(workspaces.orgId, org.id));
  const ids = mine.map(m => m.id);

  const scheduled = ids.length
    ? await db.select().from(posts)
        .where(and(inArray(posts.workspaceId, ids), isNotNull(posts.scheduledAt)))
        .orderBy(asc(posts.scheduledAt))
    : [];

  const nameOf = (id: string) => mine.find(m => m.id === id)?.name ?? '';

  // group by day
  const days = new Map<string, typeof scheduled>();
  for (const p of scheduled) {
    const k = new Date(p.scheduledAt!).toISOString().slice(0, 10);
    days.set(k, [...(days.get(k) ?? []), p]);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[27px] font-bold tracking-tight text-[var(--chalk)]">Calendar</h1>
        <p className="mt-1.5 text-[14px] text-[var(--chalk-dim)]">
          {scheduled.length === 0
            ? 'Nothing scheduled. Approve a post, then give it a date.'
            : `${scheduled.length} post${scheduled.length === 1 ? '' : 's'} lined up.`}
        </p>
      </header>

      {days.size === 0 ? (
        <div className="surface p-8 max-w-[60ch]">
          <p className="text-[15px] text-[var(--chalk)]">The week is empty.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--chalk-dim)]">
            Open a client, clear their tickets, and schedule the ones you approved.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {[...days.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="text-[14px] font-semibold text-[var(--chalk)] pb-2 border-b border-[var(--line)]">
                {new Date(day + 'T12:00:00').toLocaleDateString(undefined,
                  { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <ul className="mt-3 space-y-2">
                {items.map(p => (
                  <li key={p.id} className="flex items-baseline gap-4 py-2">
                    <span className="text-[13px] text-[var(--lamp)] w-[62px] shrink-0"
                      style={{ fontFamily: 'var(--font-mono)' }}>
                      {new Date(p.scheduledAt!).toLocaleTimeString(undefined,
                        { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[13px] text-[var(--chalk-dim)] w-[140px] shrink-0 truncate">
                      {nameOf(p.workspaceId)}
                    </span>
                    <span className="text-[14px] text-[var(--chalk)] flex-1">{p.hook}</span>
                    <span className="text-[12px] text-[var(--chalk-dim)]">{p.platform ?? 'not set'}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
