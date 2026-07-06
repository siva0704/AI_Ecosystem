import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

/**
 * Executes a callback inside a transaction wrapped with the current tenant context.
 * This sets the PostgreSQL session variable app.current_tenant_id, which is
 * used by Row-Level Security (RLS) policies to restrict database row access.
 *
 * Enforces Absolute Law #4 from CONTEXT.md
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // set_config(setting, value, is_local=true) is equivalent to SET LOCAL
    // and, unlike SET LOCAL, accepts parameterized bind values ($1).
    await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
    return await callback(tx as any);
  });
}
