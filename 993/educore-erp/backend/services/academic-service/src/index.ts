import Fastify from 'fastify';
import crypto from 'crypto';
import neo4j from 'neo4j-driver';
import { policyRoutes } from './routes/policy';
import { classRoutes } from './routes/classes';

const fastify = Fastify({
  logger: true,
  genReqId: function (req) {
    return (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  }
});

// Setup Neo4j Driver
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://neo4j:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'educore_neo4j_password'
  )
);

// Inject driver into fastify instance for routes to use
fastify.decorate('neo4j', driver);

// Register Routes
fastify.register(policyRoutes, { prefix: '/api/academic' });
fastify.register(classRoutes, { prefix: '/api/academic' });

fastify.get('/api/academic/health', async (request, reply) => {
  const session = driver.session();
  try {
    const result = await session.run('RETURN "Neo4j Connected" AS message');
    return { 
      status: 'ok', 
      service: 'academic-service', 
      domain: 'academic',
      neo4j: result.records[0].get('message')
    };
  } catch (error: any) {
    return { status: 'error', service: 'academic-service', error: error.message };
  } finally {
    await session.close();
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 4003, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address()}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
