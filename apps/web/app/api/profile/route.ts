import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { scrapeSite, profileFromText } from '@/lib/pipeline';
import { db, brandProfiles, generationJobs, organizations, creditLedger } from '@/db';
import { currentUser, currentOrg, assertWorkspace } from '@/lib/session';

export const maxDuration = 120;

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { workspaceId, url, notes } = await req.json();
  let job: any = null;

  try {
    const ws = await assertWorkspace(u.id, workspaceId);
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 403 });
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 403 });
    const { org } = await currentOrg(u.id);
    if (org.credits <= 0) {
      return NextResponse.json({ error: 'Out of credits' }, { status: 402 });
    }

    [job] = await db.insert(generationJobs)
      .values({ workspaceId: ws.id, type: 'profile', status: 'running', creditsReserved: 1 })
      .returning();

    let text: string;
    let source: 'website' | 'owner_intake';
    let chars: number | null = null;

    if (notes) {
      text = notes; source = 'owner_intake';
    } else {
      const scraped = await scrapeSite(url);
      chars = scraped.chars;
      if (scraped.thin) {
        await db.update(generationJobs)
          .set({ status: 'error', error: `thin site: ${scraped.chars} chars`, finishedAt: new Date() })
          .where(eq(generationJobs.id, job.id));
        return NextResponse.json({
          thin: true, chars: scraped.chars,
          message: `Only ${scraped.chars} characters on that site. Use the owner questions instead.`
        }, { status: 422 });
      }
      text = scraped.markdown; source = 'website';
    }

    const profile = await profileFromText(text, source);

    const [saved] = await db.insert(brandProfiles)
      .values({ workspaceId: ws.id, ...profile, source, sourceChars: chars }).returning();

    await db.update(organizations)
      .set({ credits: org.credits - 1 }).where(eq(organizations.id, org.id));
    await db.insert(creditLedger)
      .values({ orgId: org.id, delta: -1, reason: 'brand profile', jobId: job.id });
    await db.update(generationJobs)
      .set({ status: 'done', finishedAt: new Date() }).where(eq(generationJobs.id, job.id));

    return NextResponse.json({ profile: saved, creditsLeft: org.credits - 1 });
  } catch (e: any) {
    if (job) {
      await db.update(generationJobs)
        .set({ status: 'error', error: e.message, finishedAt: new Date() })
        .where(eq(generationJobs.id, job.id));
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
