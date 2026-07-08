import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://educore_app:educore_app_dev_password@localhost:5432/educore';

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Executes a callback inside a transaction wrapped with the current tenant context.
 * This sets the PostgreSQL session variable app.current_tenant_id, which is
 * used by Row-Level Security (RLS) policies to restrict database row access.
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL app.current_tenant_id = $1', [tenantId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
