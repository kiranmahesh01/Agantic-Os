#!/usr/bin/env node
import Anthropic from '@anthropic-ai/sdk';
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import { writeFileSync } from 'fs';
import { URL } from 'url';

const BrandProfileSchema = z.object({
  product: z.string().describe("What the business sells/offers"),
  icp: z.string().describe("Ideal customer profile"),
  tone: z.string().describe("Brand voice and tone"),
  differentiators: z.array(z.string()).describe("What makes them unique"),
  competitors: z.array(z.string()).describe("Direct competitors"),
  contentPillars: z.array(z.string()).describe("Main content themes")
});

type BrandProfile = z.infer<typeof BrandProfileSchema>;

async function main() {
  const url = process.argv[2];
  
  if (!url) {
    console.error('Usage: npm run brand-profile <website-url>');
    process.exit(1);
  }

  console.log(`\n🔍 Scraping ${url}...`);
  
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error('❌ FIRECRAWL_API_KEY environment variable is required.');
    console.error('Get a free API key at https://firecrawl.dev');
    process.exit(1);
  }
  
  const firecrawl = new FirecrawlApp({ apiKey });
  
  let markdown: string;
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown']
    });
    
    if (!result.markdown) {
      throw new Error('No markdown content returned');
    }
    
    markdown = result.markdown;
    console.log(`✓ Scraped ${markdown.length} characters`);

    if (markdown.trim().length < 2000) {
      console.error(`\n⚠️  THIN SITE: only ${markdown.trim().length} characters of text.`);
      console.error('This is the common case for small independent restaurants.');
      console.error('A profile from this little text will be generic and low-confidence.');
      console.error('Action: ask the owner 3 questions instead of relying on the website.');
      process.exit(2);
    }
  } catch (error: any) {
    console.error('❌ Firecrawl error:', error.message);
    process.exit(1);
  }

  console.log('\n🤖 Analyzing with Claude via OmniRoute...');
  
  const client = new Anthropic({
    baseURL: 'http://localhost:20128/v1',
    apiKey: 'dummy-key'
  });

  try {
    const response = await client.messages.create({
      model: process.env.OMNIROUTE_MODEL || 'openrouter/poolside/laguna-s-2.1:free',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this restaurant website and extract a brand profile.

Website content:
${markdown.slice(0, 10000)}${markdown.length > 10000 ? '\n\n...(truncated)' : ''}

Return ONLY valid JSON matching this exact schema:
{
  "product": "What the restaurant sells/offers (cuisine type, dining style)",
  "icp": "Ideal customer profile (who typically dines here)",
  "tone": "Brand voice and tone (formal, casual, upscale, etc)",
  "differentiators": ["What makes them unique - array of strings"],
  "competitors": ["Direct competitors - array of strings"],
  "contentPillars": ["Main content themes for social media - array of strings"]
}

NO markdown code fences. NO extra text. ONLY the JSON object.`
      }]
    });

    // Reasoning models return a 'thinking' block before the answer.
    // Find the first text block rather than assuming index 0.
    const textBlock: any = (response.content as any[]).find(b => b.type === 'text');
    if (!textBlock) {
      console.error('Response blocks:', (response.content as any[]).map(b => b.type).join(', '));
      throw new Error('No text block in model response');
    }

    const rawText = String(textBlock.text).trim();
    
    let jsonText = rawText;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    console.log('✓ Received response');
    
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error('\n❌ Failed to parse JSON response:');
      console.error(rawText);
      throw e;
    }
    
    const profile = BrandProfileSchema.parse(parsed);
    console.log('✓ Validated against schema');
    
    const domain = new URL(url).hostname.replace('www.', '');
    const outputPath = `out/${domain}.json`;
    
    writeFileSync(outputPath, JSON.stringify(profile, null, 2));
    console.log(`\n✅ Saved to ${outputPath}`);
    
    console.log('\nPreview:');
    console.log(`  Product: ${profile.product}`);
    console.log(`  ICP: ${profile.icp}`);
    console.log(`  Tone: ${profile.tone}`);
    console.log(`  Differentiators: ${profile.differentiators.length} items`);
    console.log(`  Competitors: ${profile.competitors.length} items`);
    console.log(`  Content Pillars: ${profile.contentPillars.length} items`);
    
  } catch (error: any) {
    console.error('\n❌ LLM error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
