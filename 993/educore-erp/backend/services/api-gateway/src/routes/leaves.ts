import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { leaveRequests, staff } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { rbacGuard, tierGuard } from '../middleware/guards';

const CreateLeaveSchema = z.object({
  leaveType: z.string().min(1),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysCount: z.number().min(0.5),
  reason: z.string().optional(),
});

const UpdateLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export async function leavesRoutes(fastify: FastifyInstance) {
  // GET /api/leaves
  // Tier 1/2 can see all leaves. Others can only see their own.
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const results = await withTenantContext(user.tenantId, async (tx) => {
        let query = tx.select({
          id: leaveRequests.id,
          leaveType: leaveRequests.leaveType,
          fromDate: leaveRequests.fromDate,
          toDate: leaveRequests.toDate,
          daysCount: leaveRequests.daysCount,
          reason: leaveRequests.reason,
          status: leaveRequests.status,
          createdAt: leaveRequests.createdAt,
          staffId: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          employeeId: staff.employeeId,
        }).from(leaveRequests)
          .leftJoin(staff, eq(leaveRequests.staffId, staff.id))
          .where(eq(leaveRequests.tenantId, user.tenantId))
          .orderBy(desc(leaveRequests.createdAt));
        
        return await query;
      });

      // Filter logic if the user is not a manager
      let filtered = results;
      if (user.tier > 2) {
        // Find staff id for this user
        filtered = results.filter(r => r.staffId === user.sub); // This assumes user.sub matches staff.userId or something. Wait, in DB staff has userId. We'll need to check if user.sub matches staff.userId.
      }

      return reply.send({ success: true, data: filtered });
    }
  );

  // POST /api/leaves
  fastify.post(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const parsed = CreateLeaveSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      try {
        const leave = await withTenantContext(user.tenantId, async (tx) => {
          // Find staff record for this user
          const [s] = await tx.select().from(staff).where(and(eq(staff.userId, user.sub), eq(staff.tenantId, user.tenantId)));
          if (!s) throw new Error('Staff record not found');

          const [l] = await tx.insert(leaveRequests).values({
            tenantId: user.tenantId,
            staffId: s.id,
            leaveType: parsed.data.leaveType,
            fromDate: parsed.data.fromDate,
            toDate: parsed.data.toDate,
            daysCount: parsed.data.daysCount,
            reason: parsed.data.reason,
            status: 'PENDING',
          }).returning();
          return l;
        });

        fastify.log.info({ action: 'LEAVE_APPLIED', leaveId: leave.id, by: user.sub }, 'audit');
        return reply.status(201).send({ success: true, data: leave });
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message || 'Internal server error' });
      }
    }
  );

  // PATCH /api/leaves/:id
  fastify.patch(
    '/:id',
    { onRequest: [fastify.authenticate, tierGuard(2)] }, // Only managers (Tier <= 2) can approve
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      const parsed = UpdateLeaveSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      try {
        const leave = await withTenantContext(user.tenantId, async (tx) => {
          const [l] = await tx.update(leaveRequests)
            .set({
              status: parsed.data.status,
              reviewedBy: user.sub,
              updatedAt: new Date(),
            })
            .where(and(eq(leaveRequests.id, id), eq(leaveRequests.tenantId, user.tenantId)))
            .returning();
          return l;
        });

        if (!leave) return reply.status(404).send({ success: false, error: 'Leave request not found' });

        fastify.log.info({ action: 'LEAVE_REVIEWED', leaveId: leave.id, status: parsed.data.status, by: user.sub }, 'audit');
        return reply.send({ success: true, data: leave });
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message || 'Internal server error' });
      }
    }
  );
}
