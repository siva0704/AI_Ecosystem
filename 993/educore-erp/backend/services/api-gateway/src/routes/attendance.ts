import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard } from '../middleware/guards';
import { Role } from '../db/demo-users';

const ACADEMIC_SERVICE_URL = process.env.ACADEMIC_SERVICE_URL || 'http://academic-service:4003';

export async function attendanceRoutes(fastify: FastifyInstance) {
  // Utility to forward requests to the academic-service microservice
  const forwardToMicroservice = async (request: FastifyRequest, reply: FastifyReply, path: string, method: string) => {
    const user = (request as any).user;
    
    // Construct internal headers
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Id': user.sub,
      'X-Tenant-Id': user.tenantId,
      'X-User-Role': user.role,
      'X-User-Tier': String(user.tier)
    };

    try {
      const url = new URL(`${ACADEMIC_SERVICE_URL}${path}`);
      // Forward query params
      Object.keys(request.query || {}).forEach(key => url.searchParams.append(key, (request.query as any)[key]));

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(request.body) : undefined
      });

      const data = await response.json();
      return reply.status(response.status).send(data);
    } catch (err: any) {
      fastify.log.error(`Failed to reach academic-service: ${err.message}`);
      return reply.status(502).send({ success: false, error: 'Bad Gateway: Academic service is unreachable' });
    }
  };

  // GET /api/attendance
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    (request, reply) => forwardToMicroservice(request, reply, '/api/academic/attendance', 'GET')
  );

  // POST /api/attendance
  fastify.post(
    '/',
    { onRequest: [fastify.authenticate, rbacGuard(['TEACHER', 'PRINCIPAL', 'HOD'] as Role[])] },
    (request, reply) => forwardToMicroservice(request, reply, '/api/academic/attendance', 'POST')
  );

  // GET /api/attendance/summary
  fastify.get(
    '/summary',
    { onRequest: [fastify.authenticate] },
    (request, reply) => forwardToMicroservice(request, reply, '/api/academic/attendance/summary', 'GET')
  );
}
