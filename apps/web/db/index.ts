import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgres://agency:agency_local_dev@localhost:5433/agency_os';

const client = postgres(connectionString, { max: 5 });
export const db = drizzle(client, { schema });
export * from './schema';
