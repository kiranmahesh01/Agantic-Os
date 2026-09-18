#!/usr/bin/env node
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { basename } from 'path';

const BrandProfileSchema = z.object({
  product: z.string(),
  icp: z.string(),
  tone: z.string(),
  differentiators: z.array(z.string()),
  competitors: z.array(z.string()),
  contentPillars: z.array(z.string())
});

async function main() {
  const notesPath = process.argv[2];
  if (!notesPath) {
    console.error('Usage: npx tsx scripts/profile-from-notes.ts intake/<name>.md');
    console.error('Copy intake/TEMPLATE.md, fill it in with the owner, then run this.');
    process.exit(1);
  }

  const notes = readFileSync(notesPath, 'utf8');
  const name = basename(notesPath, '.md');

  const answered = notes
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('(') && !l.startsWith('Ask these'))
    .join('\n')
    .trim();

  if (answered.length < 200) {
    console.error(`\n⚠️  The intake form looks empty (${answered.length} chars of answers).`);
    console.error('Fill in the owner\'s answers before running this.');
    process.exit(2);
  }

  console.log(`\n📝 Building profile for ${name} from owner answers...`);

  const client = new Anthropic({ baseURL: 'http://localhost:20128/v1', apiKey: 'dummy-key' });

  const response = await client.messages.create({
    model: process.env.OMNIROUTE_MODEL || 'openrouter/poolside/laguna-s-2.1:free',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `These are a restaurant owner's own answers about their business.

${notes}

Build a brand profile from ONLY what they said. Do not add dishes, claims or
details they did not mention. Where they gave exact dish names, keep those
names exactly as written. Keep their phrasing where it is distinctive.

Return ONLY valid JSON, no code fences:
{
  "product": "what they sell, in plain terms",
  "icp": "who actually comes in, from their answer",
  "tone": "how they talk about their own place",
  "differentiators": ["what they said makes them different"],
  "competitors": ["who they named"],
  "contentPillars": ["post themes grounded in what they told you"]
}`
    }]
  });

  const textBlock: any = (response.content as any[]).find(b => b.type === 'text');
  if (!textBlock) throw new Error('No text block in model response');

  let raw = String(textBlock.text).trim();
  if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  const profile = BrandProfileSchema.parse(JSON.parse(raw));
  mkdirSync('out', { recursive: true });
  writeFileSync(`out/${name}.json`, JSON.stringify(profile, null, 2));

  console.log(`✓ Validated\n\n✅ Saved to out/${name}.json\n`);
  console.log(`  Product: ${profile.product}`);
  console.log(`  ICP: ${profile.icp}`);
  console.log(`\nNext:  ./posts.sh out/${name}.json 3\n`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
