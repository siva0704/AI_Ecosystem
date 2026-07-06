import { FastifyRequest, FastifyReply } from 'fastify';

// Augment Fastify to include our custom 'authenticate' decorator
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
