import Fastify from 'fastify';
import crypto from 'crypto';

import { onboardingRoutes } from './routes/onboarding';
import { runWorker } from './temporal/worker';

const fastify = Fastify({
  logger: true,
  genReqId: function (req) {
    return (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  }
});

fastify.get('/api/platform/health', async (request, reply) => {
  return { status: 'ok', service: 'platform-admin', tier: 0 };
});

fastify.register(onboardingRoutes, { prefix: '/api/platform' });

const start = async () => {
  try {
    await fastify.listen({ port: 4002, host: '0.0.0.0' });
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
