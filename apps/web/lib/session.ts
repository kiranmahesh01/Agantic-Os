import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, organizations, members, workspaces } from '@/db';

export async function currentUser() {
  const s = await auth.api.getSession({ headers: await headers() });
  return s?.user ?? null;
}

/** The org this user belongs to, creating one on first login. */
export async function currentOrg(userId: string) {
  const rows = await db.select({ org: organizations, role: members.role })
    .from(members)
    .innerJoin(organizations, eq(members.orgId, organizations.id))
    .where(eq(members.userId, userId))
    .limit(1);

  if (rows.length) return rows[0];

  const [org] = await db.insert(organizations)
    .values({ name: 'My agency', plan: 'free', credits: 10 })
    .returning();
  await db.insert(members).values({ orgId: org.id, userId, role: 'owner' });
  return { org, role: 'owner' as const };
}

/** Tenant isolation: never trust a workspaceId from the client without this.
 *  Returns null when the user has no claim to it — callers reply 403. */
export async function assertWorkspace(userId: string, workspaceId: string) {
  if (!workspaceId) return null;
  const rows = await db.select({ ws: workspaces })
    .from(workspaces)
    .innerJoin(members, eq(members.orgId, workspaces.orgId))
    .where(and(eq(workspaces.id, workspaceId), eq(members.userId, userId)))
    .limit(1);
  return rows.length ? rows[0].ws : null;
}
