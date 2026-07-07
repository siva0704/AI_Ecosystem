import Fastify from 'fastify';
import crypto from 'crypto';

const fastify = Fastify({
  logger: true,
  genReqId: function (req) {
    return (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  }
});

fastify.get('/api/transport/health', async (request, reply) => {
  return { status: 'ok', service: 'transport-service', domain: 'transport' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 4005, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address()}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
