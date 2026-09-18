import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db, workspaces } from '@/db';
import { currentUser, currentOrg } from '@/lib/session';

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { org } = await currentOrg(u.id);
  const rows = await db.select().from(workspaces)
    .where(eq(workspaces.orgId, org.id)).orderBy(desc(workspaces.createdAt));
  return NextResponse.json({ workspaces: rows, org });
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { org } = await currentOrg(u.id);
  const { brandName, websiteUrl } = await req.json();
  if (!brandName) return NextResponse.json({ error: 'brandName required' }, { status: 400 });
  const [ws] = await db.insert(workspaces)
    .values({ orgId: org.id, brandName, websiteUrl: websiteUrl || null }).returning();
  return NextResponse.json({ workspace: ws });
}
