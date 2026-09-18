import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true, requireEmailVerification: false },
  session: { expiresIn: 60 * 60 * 24 * 30 },
  secret: process.env.BETTER_AUTH_SECRET || 'dev-only-secret-change-me',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000'
});

export type Session = typeof auth.$Infer.Session;
