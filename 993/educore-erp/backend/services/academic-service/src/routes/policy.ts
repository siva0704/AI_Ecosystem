import { FastifyInstance } from 'fastify';

export async function policyRoutes(fastify: FastifyInstance) {
  
  fastify.get('/policies', async (request, reply) => {
    // @ts-ignore
    const driver = fastify.neo4j;
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (p:Policy)-[:HAS_STAGE]->(s:Stage)
        WITH p, s ORDER BY s.index
        RETURN p.id AS id, p.name AS name, p.type AS type, collect({id: s.id, name: s.name, years: s.duration_years}) AS stages
      `);
      
      const policies = result.records.map((record: any) => ({
        id: record.get('id'),
        name: record.get('name'),
        type: record.get('type'),
        stages: record.get('stages')
      }));
      
      return { success: true, data: policies };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    } finally {
      await session.close();
    }
  });

  fastify.post('/institution/policy', async (request, reply) => {
    const { tenant_id, policy_id } = request.body as { tenant_id: string, policy_id: string };
    if (!tenant_id || !policy_id) return reply.status(400).send({ success: false, error: 'Missing tenant_id or policy_id' });

    // @ts-ignore
    const driver = fastify.neo4j;
    const session = driver.session();
    try {
      // 1. Ensure Policy exists
      // 2. Merge Institution node
      // 3. Delete any old ADOPTS edge for this tenant
      // 4. Create new ADOPTS edge
      const query = `
        MATCH (p:Policy {id: $policy_id})
        MERGE (i:Institution {tenant_id: $tenant_id})
        WITH i, p
        OPTIONAL MATCH (i)-[old:ADOPTS]->(:Policy)
        DELETE old
        CREATE (i)-[:ADOPTS]->(p)
        RETURN p.name AS policy_name
      `;
      const result = await session.run(query, { tenant_id, policy_id });
      
      if (result.records.length === 0) {
        return reply.status(404).send({ success: false, error: `Policy ${policy_id} not found.` });
      }

      return { success: true, assigned_policy: result.records[0].get('policy_name') };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    } finally {
      await session.close();
    }
  });
}
