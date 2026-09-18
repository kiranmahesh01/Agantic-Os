import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Data model from the Agency OS build plan (PDF p.14-15).
export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    plan: v.union(v.literal('free'), v.literal('starter'), v.literal('growth'), v.literal('pro')),
    stripeCustomerId: v.optional(v.string()),
    whiteLabelDomain: v.optional(v.string())
  }),

  users: defineTable({
    authId: v.string(),
    email: v.string(),
    role: v.union(v.literal('owner'), v.literal('editor'), v.literal('approver')),
    orgId: v.id('organizations')
  }).index('by_authId', ['authId']).index('by_org', ['orgId']),

  workspaces: defineTable({
    orgId: v.id('organizations'),
    brandName: v.string(),
    websiteUrl: v.optional(v.string())
  }).index('by_org', ['orgId']),

  brandProfiles: defineTable({
    workspaceId: v.id('workspaces'),
    product: v.string(),
    icp: v.string(),
    tone: v.string(),
    differentiators: v.array(v.string()),
    competitors: v.array(v.string()),
    contentPillars: v.array(v.string()),
    source: v.union(v.literal('website'), v.literal('owner_intake')),
    confidence: v.union(v.literal('high'), v.literal('low'))
  }).index('by_workspace', ['workspaceId']),

  generationJobs: defineTable({
    workspaceId: v.id('workspaces'),
    type: v.union(v.literal('profile'), v.literal('posts')),
    status: v.union(v.literal('queued'), v.literal('running'), v.literal('done'), v.literal('error')),
    model: v.optional(v.string()),
    creditsReserved: v.number(),
    costUsd: v.optional(v.number()),
    error: v.optional(v.string())
  }).index('by_workspace', ['workspaceId']).index('by_status', ['status']),

  posts: defineTable({
    workspaceId: v.id('workspaces'),
    jobId: v.optional(v.id('generationJobs')),
    pillar: v.string(),
    hook: v.string(),
    caption: v.string(),
    hashtags: v.array(v.string()),
    visualNote: v.string(),
    // Blitz swipe feed state
    swipe: v.union(v.literal('pending'), v.literal('saved'), v.literal('skipped')),
    scheduledAt: v.optional(v.number()),
    status: v.union(v.literal('draft'), v.literal('approved'), v.literal('scheduled'), v.literal('posted')),
    platform: v.optional(v.string())
  }).index('by_workspace', ['workspaceId']).index('by_swipe', ['workspaceId', 'swipe']),

  creditLedger: defineTable({
    orgId: v.id('organizations'),
    delta: v.number(),
    reason: v.string(),
    jobId: v.optional(v.id('generationJobs'))
  }).index('by_org', ['orgId'])
});
