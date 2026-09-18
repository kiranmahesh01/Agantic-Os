import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, posts } from '@/db';
import { currentUser, assertWorkspace } from '@/lib/session';

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { workspaceId, postId, swipe } = await req.json();
  if (!['saved', 'skipped', 'pending'].includes(swipe)) {
    return NextResponse.json({ error: 'bad swipe value' }, { status: 400 });
  }
  const ws = await assertWorkspace(u.id, workspaceId);
  const [row] = await db.update(posts)
    .set({ swipe, status: swipe === 'saved' ? 'approved' : 'draft' })
    .where(and(eq(posts.id, postId), eq(posts.workspaceId, ws.id)))
    .returning();
  if (!row) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  return NextResponse.json({ post: row });
}
