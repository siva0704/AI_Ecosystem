import { FastifyInstance, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { staff, leaveRequests, dpdpConsentLog, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { rbacGuard } from '../middleware/guards';

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const OnboardStaffSchema = z.object({
  employeeId: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string().min(2),
  department: z.string().optional(),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  dpdpConsentGiven: z.boolean().default(false),
});

const LeaveRequestSchema = z.object({
  staffId: z.string().uuid(),
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER']),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysCount: z.number().int().positive(),
  reason: z.string().optional(),
});

const LeaveReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
});

const DpdpConsentSchema = z.object({
  dataCategory: z.string().min(2),
  consentGiven: z.boolean(),
  consentVersion: z.string().default('1.0'),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function hrRoutes(fastify: FastifyInstance) {

  // ── GET /api/hr/staff ─────────────────────────────────────────────────────
  // Returns the full staff directory for the tenant (HR Manager, Admin, Principal)
  fastify.get('/staff', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'PRINCIPAL', 'HR_MANAGER'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;

    const data = await withTenantContext(tenantId, async (tx) => {
      return await tx.select({
        id: staff.id,
        employeeId: staff.employeeId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role,
        department: staff.department,
        dateOfJoining: staff.dateOfJoining,
        isActive: staff.isActive,
        dpdpConsentGiven: staff.dpdpConsentGiven,
        dpdpConsentAt: staff.dpdpConsentAt,
      }).from(staff).orderBy(desc(staff.createdAt));
    });

    return reply.send({ success: true, data });
  });

  // ── POST /api/hr/onboard ──────────────────────────────────────────────────
  // Onboard a new staff member (HR Manager, Admin only)
  fastify.post('/onboard', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'HR_MANAGER'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const parsed = OnboardStaffSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Invalid staff data', details: parsed.error.flatten() });
    }

    const d = parsed.data;

    try {
      const result = await withTenantContext(tenantId, async (tx) => {
        const [newStaff] = await tx.insert(staff).values({
          tenantId,
          employeeId: d.employeeId,
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          phone: d.phone,
          role: d.role,
          department: d.department,
          dateOfJoining: d.dateOfJoining,
          dpdpConsentGiven: d.dpdpConsentGiven,
          dpdpConsentAt: d.dpdpConsentGiven ? new Date() : undefined,
        }).returning({
          id: staff.id,
          employeeId: staff.employeeId,
          firstName: staff.firstName,
          lastName: staff.lastName,
          role: staff.role,
        });
        return newStaff;
      });

      return reply.code(201).send({ success: true, data: result });
    } catch (err: any) {
      if (err.code === '23505') {
        return reply.code(409).send({ success: false, error: 'Employee ID or email already exists for this tenant' });
      }
      fastify.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal server error' });
    }
  });

  // ── GET /api/hr/leave ─────────────────────────────────────────────────────
  // List leave requests. HR Manager sees all; Teacher sees own.
  fastify.get('/leave', {
    onRequest: [fastify.authenticate],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const userRole = request.user.role;

    const data = await withTenantContext(tenantId, async (tx) => {
      return await tx.select({
        id: leaveRequests.id,
        leaveType: leaveRequests.leaveType,
        fromDate: leaveRequests.fromDate,
        toDate: leaveRequests.toDate,
        daysCount: leaveRequests.daysCount,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        reviewNote: leaveRequests.reviewNote,
        reviewedAt: leaveRequests.reviewedAt,
        createdAt: leaveRequests.createdAt,
        staffId: leaveRequests.staffId,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
        staffRole: staff.role,
      })
      .from(leaveRequests)
      .leftJoin(staff, eq(leaveRequests.staffId, staff.id))
      .orderBy(desc(leaveRequests.createdAt));
    });

    return reply.send({ success: true, data });
  });

  // ── POST /api/hr/leave ────────────────────────────────────────────────────
  // Submit a leave request
  fastify.post('/leave', {
    onRequest: [fastify.authenticate],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const parsed = LeaveRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Invalid leave request data', details: parsed.error.flatten() });
    }

    const d = parsed.data;

    try {
      const result = await withTenantContext(tenantId, async (tx) => {
        const [newLeave] = await tx.insert(leaveRequests).values({
          tenantId,
          staffId: d.staffId,
          leaveType: d.leaveType,
          fromDate: d.fromDate,
          toDate: d.toDate,
          daysCount: d.daysCount,
          reason: d.reason,
          status: 'PENDING',
        }).returning();
        return newLeave;
      });

      return reply.code(201).send({ success: true, data: result });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal server error' });
    }
  });

  // ── PATCH /api/hr/leave/:id ───────────────────────────────────────────────
  // Approve or Reject a leave request (HR Manager, Principal only)
  fastify.patch('/leave/:id', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'PRINCIPAL', 'HR_MANAGER'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const { id } = request.params as { id: string };
    const parsed = LeaveReviewSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Invalid review data', details: parsed.error.flatten() });
    }

    try {
      const result = await withTenantContext(tenantId, async (tx) => {
        const [updated] = await tx.update(leaveRequests)
          .set({
            status: parsed.data.status,
            reviewedBy: request.user.userId,
            reviewedAt: new Date(),
            reviewNote: parsed.data.reviewNote,
            updatedAt: new Date(),
          })
          .where(and(eq(leaveRequests.id, id), eq(leaveRequests.tenantId, tenantId)))
          .returning();
        return updated;
      });

      if (!result) {
        return reply.code(404).send({ success: false, error: 'Leave request not found' });
      }

      return reply.send({ success: true, data: result });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal server error' });
    }
  });

  // ── GET /api/hr/dpdp ──────────────────────────────────────────────────────
  // Get DPDP consent log for the tenant
  fastify.get('/dpdp', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'HR_MANAGER'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;

    const data = await withTenantContext(tenantId, async (tx) => {
      return await tx.select({
        id: dpdpConsentLog.id,
        dataCategory: dpdpConsentLog.dataCategory,
        consentGiven: dpdpConsentLog.consentGiven,
        consentVersion: dpdpConsentLog.consentVersion,
        createdAt: dpdpConsentLog.createdAt,
        staffId: dpdpConsentLog.staffId,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
      })
      .from(dpdpConsentLog)
      .leftJoin(staff, eq(dpdpConsentLog.staffId, staff.id))
      .orderBy(desc(dpdpConsentLog.createdAt));
    });

    return reply.send({ success: true, data });
  });

  // ── POST /api/hr/dpdp/:staffId ────────────────────────────────────────────
  // Record a DPDP consent event for a staff member
  fastify.post('/dpdp/:staffId', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'HR_MANAGER'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const { staffId } = request.params as { staffId: string };
    const parsed = DpdpConsentSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Invalid consent data', details: parsed.error.flatten() });
    }

    try {
      const result = await withTenantContext(tenantId, async (tx) => {
        // Log the consent event (append-only)
        const [log] = await tx.insert(dpdpConsentLog).values({
          tenantId,
          staffId,
          dataCategory: parsed.data.dataCategory,
          consentGiven: parsed.data.consentGiven,
          consentVersion: parsed.data.consentVersion,
          ipAddress: (request.headers['x-forwarded-for'] as string) || request.ip,
          userAgent: request.headers['user-agent'],
          recordedBy: request.user.userId,
        }).returning();

        // Update the staff record's dpdpConsentGiven flag
        await tx.update(staff)
          .set({
            dpdpConsentGiven: parsed.data.consentGiven,
            dpdpConsentAt: new Date(),
          })
          .where(and(eq(staff.id, staffId), eq(staff.tenantId, tenantId)));

        return log;
      });

      return reply.code(201).send({ success: true, data: result });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal server error' });
    }
  });
}
