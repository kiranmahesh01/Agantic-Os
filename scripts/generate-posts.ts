#!/usr/bin/env node
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { basename } from 'path';

const PostSchema = z.object({
  pillar: z.string(),
  hook: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  visualNote: z.string()
});
const PostsSchema = z.object({ posts: z.array(PostSchema) });

async function main() {
  const profilePath = process.argv[2];
  const count = Number(process.argv[3] || 5);

  if (!profilePath) {
    console.error('Usage: npx tsx scripts/generate-posts.ts out/<name>.json [count]');
    process.exit(1);
  }

  const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
  const name = basename(profilePath, '.json');
  console.log(`\n✍️  Writing ${count} posts for ${name}...`);

  const client = new Anthropic({
    baseURL: 'http://localhost:20128/v1',
    apiKey: 'dummy-key'
  });

  const response = await client.messages.create({
    model: process.env.OMNIROUTE_MODEL || 'openrouter/poolside/laguna-s-2.1:free',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You write Instagram captions for restaurants. Write ${count} posts for this business.

BRAND PROFILE:
${JSON.stringify(profile, null, 2)}

RULES:
- CRITICAL: use ONLY facts written in the profile above. Do not add any dish,
  ingredient, menu item, price, date, award, staff detail or claim that does not
  appear in the profile text. If the profile does not name a specific food, write
  about the experience instead of naming food. Inventing a detail is a failure,
  even if it sounds plausible for this kind of restaurant.
- Each post uses a different content pillar from the profile.
- Match the tone described in the profile.
- Hook: first line, under 12 words, makes someone stop scrolling.
- Caption: 2-4 short sentences. Sound like the owner, not a marketing agency.
- No emoji spam. At most one emoji, and only if the tone fits.
- 5-8 hashtags, mixing local and category tags.
- visualNote: one plain sentence telling the owner what photo or video to take.

Before writing each caption, check every concrete noun against the profile. Return ONLY valid JSON, no code fences, no extra text:
{"posts":[{"pillar":"...","hook":"...","caption":"...","hashtags":["..."],"visualNote":"..."}]}`
    }]
  });

  const textBlock: any = (response.content as any[]).find(b => b.type === 'text');
  if (!textBlock) throw new Error('No text block in model response');

  let raw = String(textBlock.text).trim();
  if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('\n❌ Model did not return valid JSON:\n');
    console.error(raw.slice(0, 1500));
    process.exit(1);
  }

  const { posts } = PostsSchema.parse(parsed);
  console.log(`✓ Validated ${posts.length} posts`);

  mkdirSync('posts', { recursive: true });

  const md = [`# Instagram posts — ${name}`, '', ...posts.flatMap((p, i) => [
    `## Post ${i + 1} — ${p.pillar}`,
    '',
    `**${p.hook}**`,
    '',
    p.caption,
    '',
    p.hashtags.map(h => '#' + h.replace(/[#\s]/g, '')).filter(h => h.length > 1).join(' '),
    '',
    `> Photo to take: ${p.visualNote}`,
    '',
    '---',
    ''
  ])].join('\n');

  writeFileSync(`posts/${name}.md`, md);
  writeFileSync(`posts/${name}.json`, JSON.stringify({ posts }, null, 2));

  console.log(`\n✅ Saved to posts/${name}.md\n`);
  posts.forEach((p, i) => console.log(`  ${i + 1}. ${p.hook}`));
  console.log('');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
