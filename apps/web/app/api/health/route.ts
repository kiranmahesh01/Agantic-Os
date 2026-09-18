import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';

export async function GET() {
  const out: any = { app: 'ok', database: 'unknown', tables: 'unknown', hint: null };
  try {
    await db.execute(sql`select 1`);
    out.database = 'ok';
  } catch (e: any) {
    out.database = 'unreachable';
    out.hint = 'Postgres is not running. Start Docker Desktop, then: cd ~/agency-os && docker compose up -d';
    out.detail = e.message;
    return NextResponse.json(out, { status: 503 });
  }
  try {
    const r: any = await db.execute(
      sql`select count(*)::int as n from information_schema.tables where table_schema='public'`
    );
    const n = r?.[0]?.n ?? r?.rows?.[0]?.n ?? 0;
    out.tables = n;
    if (!n) {
      out.hint = 'Database is up but empty. Run: cd ~/agency-os/apps/web && npx drizzle-kit push --force';
      return NextResponse.json(out, { status: 503 });
    }
  } catch (e: any) {
    out.tables = 'error'; out.detail = e.message;
    return NextResponse.json(out, { status: 503 });
  }
  return NextResponse.json(out);
}
