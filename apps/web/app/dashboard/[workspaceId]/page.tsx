import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { db, brandProfiles, posts } from '@/db';
import { currentUser, assertWorkspace } from '@/lib/session';
import ClientWorkspace from '@/components/ClientWorkspace';

export default async function WorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const u = await currentUser();
  if (!u) redirect('/login');

  const ws = await assertWorkspace(u.id, workspaceId);
  if (!ws) redirect('/dashboard');

  const [profile] = await db.select().from(brandProfiles)
    .where(eq(brandProfiles.workspaceId, ws.id))
    .orderBy(desc(brandProfiles.createdAt)).limit(1);

  const allPosts = await db.select().from(posts)
    .where(eq(posts.workspaceId, ws.id)).orderBy(desc(posts.createdAt));

  return <ClientWorkspace workspace={ws} profile={profile ?? null} posts={allPosts} />;
}
