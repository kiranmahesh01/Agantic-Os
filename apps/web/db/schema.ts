import {
  pgTable, text, timestamp, integer, real, boolean, jsonb, uuid, index, uniqueIndex
} from 'drizzle-orm/pg-core';

/* ---------- auth (Better Auth core tables) ---------- */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/* ---------- tenancy ---------- */

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: text('plan', { enum: ['free', 'starter', 'growth', 'pro'] }).notNull().default('free'),
  credits: integer('credits').notNull().default(10),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  whiteLabelDomain: text('white_label_domain'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'editor', 'approver'] }).notNull().default('owner'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => ({
  byOrg: index('members_org_idx').on(t.orgId),
  uniqueMember: uniqueIndex('members_org_user_idx').on(t.orgId, t.userId)
}));

/** One client business. An agency has many. */
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  brandName: text('brand_name').notNull(),
  websiteUrl: text('website_url'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => ({ byOrg: index('workspaces_org_idx').on(t.orgId) }));

/* ---------- product ---------- */

export const brandProfiles = pgTable('brand_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  product: text('product').notNull(),
  icp: text('icp').notNull(),
  tone: text('tone').notNull(),
  differentiators: jsonb('differentiators').$type<string[]>().notNull(),
  competitors: jsonb('competitors').$type<string[]>().notNull(),
  contentPillars: jsonb('content_pillars').$type<string[]>().notNull(),
  source: text('source', { enum: ['website', 'owner_intake'] }).notNull(),
  sourceChars: integer('source_chars'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => ({ byWorkspace: index('profiles_workspace_idx').on(t.workspaceId) }));

export const generationJobs = pgTable('generation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['profile', 'posts'] }).notNull(),
  status: text('status', { enum: ['queued', 'running', 'done', 'error'] }).notNull().default('queued'),
  model: text('model'),
  creditsReserved: integer('credits_reserved').notNull().default(0),
  costUsd: real('cost_usd'),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  finishedAt: timestamp('finished_at')
}, t => ({
  byWorkspace: index('jobs_workspace_idx').on(t.workspaceId),
  byStatus: index('jobs_status_idx').on(t.status)
}));

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => generationJobs.id, { onDelete: 'set null' }),
  pillar: text('pillar').notNull(),
  hook: text('hook').notNull(),
  caption: text('caption').notNull(),
  hashtags: jsonb('hashtags').$type<string[]>().notNull(),
  visualNote: text('visual_note').notNull(),
  swipe: text('swipe', { enum: ['pending', 'saved', 'skipped'] }).notNull().default('pending'),
  status: text('status', { enum: ['draft', 'approved', 'scheduled', 'posted'] }).notNull().default('draft'),
  platform: text('platform'),
  scheduledAt: timestamp('scheduled_at'),
  postedAt: timestamp('posted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => ({
  byWorkspace: index('posts_workspace_idx').on(t.workspaceId),
  bySwipe: index('posts_swipe_idx').on(t.workspaceId, t.swipe)
}));

export const creditLedger = pgTable('credit_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  delta: integer('delta').notNull(),
  reason: text('reason').notNull(),
  jobId: uuid('job_id').references(() => generationJobs.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => ({ byOrg: index('ledger_org_idx').on(t.orgId) }));

/** Connected social accounts. Tokens encrypted at rest — see lib/crypto.ts */
export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  platform: text('platform', { enum: ['instagram', 'tiktok', 'youtube', 'linkedin'] }).notNull(),
  externalAccountId: text('external_account_id').notNull(),
  handle: text('handle'),
  accessTokenEnc: text('access_token_enc').notNull(),
  refreshTokenEnc: text('refresh_token_enc'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => ({ byWorkspace: index('social_workspace_idx').on(t.workspaceId) }));
