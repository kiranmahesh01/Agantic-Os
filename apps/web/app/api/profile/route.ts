import { NextResponse } from 'next/server';
import { scrapeSite, profileFromText } from '@/lib/pipeline';

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { url, notes } = await req.json();

    if (notes) {
      const profile = await profileFromText(notes, 'owner_intake');
      return NextResponse.json({ profile, source: 'owner_intake', confidence: 'high' });
    }

    if (!url) return NextResponse.json({ error: 'Provide a url or notes' }, { status: 400 });

    const { markdown, thin, chars } = await scrapeSite(url);
    if (thin) {
      return NextResponse.json({
        thin: true,
        chars,
        message: `Only ${chars} characters on that site. Too thin for a reliable profile — use the owner questions instead.`
      }, { status: 422 });
    }

    const profile = await profileFromText(markdown, 'website');
    return NextResponse.json({ profile, source: 'website', confidence: 'high', chars });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
