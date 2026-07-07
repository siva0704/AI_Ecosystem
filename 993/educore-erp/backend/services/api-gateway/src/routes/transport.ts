import { FastifyInstance, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { transportRoutes, transportBuses, busAssignments, students } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { rbacGuard } from '../middleware/guards';

const BusSchema = z.object({
  busNumber: z.string().min(2),
  routeName: z.string().min(2),
  driverName: z.string().min(2),
  capacity: z.number().int().positive(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
});

const RouteSchema = z.object({
  routeName: z.string().min(2),
  origin: z.string().min(2),
  stops: z.array(z.string()).default([]),
  estimatedMins: z.number().int().positive().optional(),
});

export async function transportRoutesPlugin(fastify: FastifyInstance) {

  // ── GET /api/transport/buses ──────────────────────────────────────────────
  fastify.get('/buses', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'TRANSPORT_OFFICER'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;

    const data = await withTenantContext(tenantId, async (tx) => {
      return await tx.select().from(transportBuses).orderBy(desc(transportBuses.lastUpdated));
    });

    return reply.send({ success: true, data });
  });

  // ── GET /api/transport/routes ─────────────────────────────────────────────
  fastify.get('/routes', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'TRANSPORT_OFFICER'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;

    const data = await withTenantContext(tenantId, async (tx) => {
      return await tx.select().from(transportRoutes).orderBy(desc(transportRoutes.createdAt));
    });

    return reply.send({ success: true, data });
  });

  // ── POST /api/transport/buses ─────────────────────────────────────────────
  fastify.post('/buses', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'TRANSPORT_OFFICER'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const parsed = BusSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Invalid bus data', details: parsed.error.flatten() });
    }

    try {
      const data = await withTenantContext(tenantId, async (tx) => {
        return await tx.insert(transportBuses).values({
          tenantId,
          ...parsed.data,
        }).returning();
      });

      return reply.code(201).send({ success: true, data: data[0] });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal server error' });
    }
  });

}
