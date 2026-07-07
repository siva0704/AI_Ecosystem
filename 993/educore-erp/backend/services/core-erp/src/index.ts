import Fastify from 'fastify';
import crypto from 'crypto';
import { EventStoreDBClient } from '@eventstore/db-client';
import { sagaRoutes } from './routes/sagas';
import { runWorker } from './temporal/worker';

const fastify = Fastify({
  logger: true,
  genReqId: function (req) {
    return (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  }
});

// EventStoreDB Connection
const esdb = EventStoreDBClient.connectionString(
  process.env.EVENTSTORE_URI || 'esdb://eventstore:2113?tls=false'
);

fastify.get('/api/finance/health', async (request, reply) => {
  return { status: 'ok', service: 'core-erp', domain: 'finance' };
});

// Register Finance Saga Routes
fastify.register(sagaRoutes, { prefix: '/api/finance' });

const start = async () => {
  try {
    await fastify.listen({ port: 4001, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address()}`);
    
    // Boot Temporal Worker in background
    runWorker().catch(err => {
      fastify.log.error('Temporal Worker failed to start', err);
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
