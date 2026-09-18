import Anthropic from '@anthropic-ai/sdk';
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';

export const BrandProfileSchema = z.object({
  product: z.string(),
  icp: z.string(),
  tone: z.string(),
  differentiators: z.array(z.string()),
  competitors: z.array(z.string()),
  contentPillars: z.array(z.string())
});
export type BrandProfile = z.infer<typeof BrandProfileSchema>;

export const PostSchema = z.object({
  pillar: z.string(),
  hook: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  visualNote: z.string()
});
export type Post = z.infer<typeof PostSchema>;

const THIN_SITE_CHARS = 2000;

function client() {
  return new Anthropic({
    baseURL: process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1',
    apiKey: process.env.OMNIROUTE_API_KEY || 'dummy-key'
  });
}

function model() {
  return process.env.OMNIROUTE_MODEL || 'openrouter/poolside/laguna-s-2.1:free';
}

/** Reasoning models emit a thinking block first — find the real answer. */
function textOf(response: any): string {
  const block = (response.content as any[]).find(b => b.type === 'text');
  if (!block) throw new Error('No text block in model response');
  let raw = String(block.text).trim();
  if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return raw;
}

export async function scrapeSite(url: string) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error('FIRECRAWL_API_KEY is not set');
  const fc = new FirecrawlApp({ apiKey: key });
  const result: any = await fc.scrapeUrl(url, { formats: ['markdown'] });
  const markdown = result?.markdown ?? '';
  return { markdown, thin: markdown.trim().length < THIN_SITE_CHARS, chars: markdown.trim().length };
}

export async function profileFromText(text: string, kind: 'website' | 'owner_intake') {
  const instruction = kind === 'website'
    ? 'Analyze this business website and extract a brand profile.'
    : "These are the owner's own answers about their business. Build a profile from ONLY what they said.";

  const response = await client().messages.create({
    model: model(),
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `${instruction}

CONTENT:
${text.slice(0, 12000)}

Use ONLY facts present above. Never invent a dish, price, date, award or claim.
If something is unknown, say "UNKNOWN" rather than guessing.

Return ONLY valid JSON, no code fences:
{"product":"","icp":"","tone":"","differentiators":[],"competitors":[],"contentPillars":[]}`
    }]
  });

  return BrandProfileSchema.parse(JSON.parse(textOf(response)));
}

export async function postsFromProfile(profile: BrandProfile, count = 3) {
  const response = await client().messages.create({
    model: model(),
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You write Instagram captions for local businesses. Write ${count} posts.

BRAND PROFILE:
${JSON.stringify(profile, null, 2)}

RULES:
- CRITICAL: use ONLY facts written in the profile. Do not add any dish, ingredient,
  menu item, price, date, award, staff detail or claim that is not in the profile.
  Inventing a detail is a failure even if it sounds plausible.
- Each post uses a different content pillar.
- Match the tone in the profile.
- Hook: first line, under 12 words.
- Caption: 2-4 short sentences, owner's voice not agency voice.
- At most one emoji. 5-8 hashtags without the # symbol.
- visualNote: one sentence telling the owner what photo to take.

Before writing, check every concrete noun against the profile.
Return ONLY valid JSON, no code fences:
{"posts":[{"pillar":"","hook":"","caption":"","hashtags":[],"visualNote":""}]}`
    }]
  });

  return z.object({ posts: z.array(PostSchema) }).parse(JSON.parse(textOf(response))).posts;
}
