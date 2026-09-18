import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, posts } from '@/db';
import { currentUser, assertWorkspace } from '@/lib/session';

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { workspaceId, postId, scheduledAt, platform } = await req.json();
  const ws = await assertWorkspace(u.id, workspaceId);
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 403 });

  const when = scheduledAt ? new Date(scheduledAt) : null;
  if (scheduledAt && isNaN(when!.getTime())) {
    return NextResponse.json({ error: 'That date could not be read' }, { status: 400 });
  }

  const [row] = await db.update(posts)
    .set({
      scheduledAt: when,
      platform: platform ?? null,
      status: when ? 'scheduled' : 'approved'
    })
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ws.id)))
    .returning();

  if (!row) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  return NextResponse.json({ post: row });
}
