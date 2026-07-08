import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { dpdpConsentLog, grievances, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { rbacGuard } from '../middleware/guards';

const GrievanceSchema = z.object({
  subject: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(['ACADEMIC', 'ADMINISTRATIVE', 'HOSTEL', 'TRANSPORT', 'OTHER']),
});

const ResolutionSchema = z.object({
  resolution: z.string().min(5),
});

const ConsentSchema = z.object({
  consentType: z.string().min(2),
  isGranted: z.boolean(),
  ipAddress: z.string().optional(),
});

export async function complianceRoutes(fastify: FastifyInstance) {
  
  // ── GRIEVANCES ─────────────────────────────────────────────────────────────
  
  fastify.get('/grievances', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    
    const data = await withTenantContext(user.tenantId, async (tx) => {
      let condition = eq(grievances.tenantId, user.tenantId);
      // Non-admins only see their own grievances
      if (user.tier > 2) {
        condition = and(condition, eq(grievances.submittedBy, user.sub)) as any;
      }
      
      return await tx.select({
        id: grievances.id,
        subject: grievances.subject,
        description: grievances.description,
        category: grievances.category,
        status: grievances.status,
        resolution: grievances.resolution,
        createdAt: grievances.createdAt,
        submittedBy: grievances.submittedBy,
        submitterEmail: users.email,
        submitterRole: users.role,
      }).from(grievances)
        .innerJoin(users, eq(grievances.submittedBy, users.id))
        .where(condition)
        .orderBy(desc(grievances.createdAt));
    });
    
    return reply.send({ success: true, data });
  });

  fastify.post('/grievances', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const parsed = GrievanceSchema.safeParse(request.body);
    
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }
    
    try {
      const data = await withTenantContext(user.tenantId, async (tx) => {
        const [g] = await tx.insert(grievances).values({
          tenantId: user.tenantId,
          submittedBy: user.sub,
          ...parsed.data,
        }).returning();
        return g;
      });
      return reply.code(201).send({ success: true, data });
    } catch (err: any) {
      return reply.code(500).send({ success: false, error: 'Internal error' });
    }
  });

  fastify.patch('/grievances/:id/resolve', {
    onRequest: [fastify.authenticate, rbacGuard(['INSTITUTION_ADMIN', 'SUPER_ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const parsed = ResolutionSchema.safeParse(request.body);
    
    if (!parsed.success) return reply.code(400).send({ success: false });
    
    try {
      const data = await withTenantContext(user.tenantId, async (tx) => {
        const [updated] = await tx.update(grievances)
          .set({ status: 'RESOLVED', resolution: parsed.data.resolution, updatedAt: new Date() })
          .where(and(eq(grievances.id, id), eq(grievances.tenantId, user.tenantId)))
          .returning();
        return updated;
      });
      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.code(500).send({ success: false, error: 'Internal error' });
    }
  });

  // ── DPDP CONSENT ───────────────────────────────────────────────────────────
  
  fastify.post('/dpdp-consent', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const parsed = ConsentSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false });
    
    try {
      const data = await withTenantContext(user.tenantId, async (tx) => {
        const [log] = await tx.insert(dpdpConsentLog).values({
          tenantId: user.tenantId,
          userId: user.sub,
          consentType: parsed.data.consentType,
          isGranted: parsed.data.isGranted,
          ipAddress: parsed.data.ipAddress || request.ip,
        }).returning();
        return log;
      });
      return reply.code(201).send({ success: true, data });
    } catch (err: any) {
      return reply.code(500).send({ success: false });
    }
  });
  
  fastify.get('/dpdp-consent', {
    onRequest: [fastify.authenticate, rbacGuard(['INSTITUTION_ADMIN', 'SUPER_ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const data = await withTenantContext(user.tenantId, async (tx) => {
      return await tx.select({
        id: dpdpConsentLog.id,
        consentType: dpdpConsentLog.consentType,
        isGranted: dpdpConsentLog.isGranted,
        createdAt: dpdpConsentLog.createdAt,
        userEmail: users.email,
        userRole: users.role,
      }).from(dpdpConsentLog)
        .innerJoin(users, eq(dpdpConsentLog.userId, users.id))
        .where(eq(dpdpConsentLog.tenantId, user.tenantId))
        .orderBy(desc(dpdpConsentLog.createdAt));
    });
    return reply.send({ success: true, data });
  });

}
