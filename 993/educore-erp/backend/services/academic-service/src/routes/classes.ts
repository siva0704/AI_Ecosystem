import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://educore_app:educore_app_dev_password@localhost:5432/educore'
});

export async function classRoutes(fastify: FastifyInstance) {
  
  fastify.post('/classes', async (request, reply) => {
    const { tenant_id, stage_id, name, section } = request.body as { 
      tenant_id: string, 
      stage_id: string, 
      name: string,
      section?: string
    };
    
    if (!tenant_id || !stage_id || !name) {
      return reply.status(400).send({ success: false, error: 'Missing tenant_id, stage_id, or name' });
    }

    // @ts-ignore
    const driver = fastify.neo4j;
    const session = driver.session();
    const pgClient = await pool.connect();

    try {
      // DUAL WRITE TRANSACTION
      await pgClient.query('BEGIN');
      
      const classId = crypto.randomUUID();

      // 1. Write to Postgres
      // Note: We bypass RLS manually here by setting tenant, or we just insert directly for MVP
      await pgClient.query('SET LOCAL app.current_tenant_id = $1', [tenant_id]);
      await pgClient.query(`
        INSERT INTO classes (id, tenant_id, name, section, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [classId, tenant_id, name, section || 'A']);

      // 2. Write to Neo4j
      // Ensure institution has adopted the policy that owns this stage, and attach the class.
      const neoResult = await session.run(`
        MATCH (i:Institution {tenant_id: $tenant_id})-[:ADOPTS]->(p:Policy)-[:HAS_STAGE]->(s:Stage {id: $stage_id})
        CREATE (c:Class {id: $classId, name: $name, section: $section})
        CREATE (s)-[:HAS_CLASS]->(c)
        CREATE (c)-[:BELONGS_TO]->(i)
        RETURN c
      `, { tenant_id, stage_id, classId, name, section: section || 'A' });

      if (neoResult.records.length === 0) {
        throw new Error(`Neo4j Mapping Failed: Tenant ${tenant_id} has not adopted a policy containing stage ${stage_id}.`);
      }

      await pgClient.query('COMMIT');

      return { 
        success: true, 
        message: 'Class created and projected to Neo4j successfully.',
        data: { classId, name, stage_id }
      };
    } catch (err: any) {
      await pgClient.query('ROLLBACK');
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    } finally {
      pgClient.release();
      await session.close();
    }
  });
}
