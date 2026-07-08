import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { tcRequests, students, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { rbacGuard } from '../middleware/guards';

const TCRequestSchema = z.object({
  studentId: z.string().uuid(),
  reason: z.string().min(5),
});

export async function recordsRoutes(fastify: FastifyInstance) {
  
  fastify.get('/tc-requests', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    
    const data = await withTenantContext(user.tenantId, async (tx) => {
      let condition = eq(tcRequests.tenantId, user.tenantId);
      if (user.tier > 2) {
        // Find their own students
        const myStudents = await tx.select({ id: students.id }).from(students).where(and(eq(students.tenantId, user.tenantId), eq(students.id, user.sub)));
        if (myStudents.length === 0) return [];
        // Only return requests for own students
      }
      
      return await tx.select({
        id: tcRequests.id,
        reason: tcRequests.reason,
        status: tcRequests.status,
        createdAt: tcRequests.createdAt,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        rollNumber: students.rollNumber,
        requestedByEmail: users.email,
      }).from(tcRequests)
        .innerJoin(students, eq(tcRequests.studentId, students.id))
        .innerJoin(users, eq(tcRequests.requestedBy, users.id))
        .where(condition)
        .orderBy(desc(tcRequests.createdAt));
    });
    
    return reply.send({ success: true, data });
  });

  fastify.post('/tc-requests', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const parsed = TCRequestSchema.safeParse(request.body);
    
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }
    
    try {
      const data = await withTenantContext(user.tenantId, async (tx) => {
        const [s] = await tx.select().from(students).where(and(eq(students.id, parsed.data.studentId), eq(students.tenantId, user.tenantId)));
        if (!s) throw new Error('Student not found');
        
        const [req] = await tx.insert(tcRequests).values({
          tenantId: user.tenantId,
          studentId: parsed.data.studentId,
          reason: parsed.data.reason,
          requestedBy: user.sub,
        }).returning();
        return req;
      });
      return reply.code(201).send({ success: true, data });
    } catch (err: any) {
      return reply.code(400).send({ success: false, error: err.message });
    }
  });

  fastify.patch('/tc-requests/:id/approve', {
    onRequest: [fastify.authenticate, rbacGuard(['INSTITUTION_ADMIN', 'SUPER_ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    try {
      const data = await withTenantContext(user.tenantId, async (tx) => {
        const [req] = await tx.select().from(tcRequests).where(and(eq(tcRequests.id, id), eq(tcRequests.tenantId, user.tenantId)));
        if (!req) throw new Error('Request not found');
        
        const [updated] = await tx.update(tcRequests)
          .set({ status: 'APPROVED', approvedBy: user.sub, updatedAt: new Date() })
          .where(eq(tcRequests.id, id))
          .returning();
          
        // Deactivate student
        await tx.update(students)
          .set({ isActive: false, status: 'TRANSFERRED' })
          .where(eq(students.id, req.studentId));
          
        return updated;
      });
      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.code(400).send({ success: false, error: err.message });
    }
  });

}
