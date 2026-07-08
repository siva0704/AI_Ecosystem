/**
 * EduCore API — Students Routes
 * RBAC: Admin/Principal can list all. Teacher can list their class students.
 *       Student/Parent can only access their own record.
 * RLS: All queries tenant-scoped via JWT tenantId.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard, tierGuard } from '../middleware/guards';
import { CreateStudentSchema, PaginationSchema } from '../schemas/validation';
import { db, withTenantContext } from '../db/connection';
import { students } from '../db/schema';
import { eq, and, desc, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

const UpdateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  classId: z.string().uuid().optional(),
  rollNumber: z.string().min(1).optional(),
  parentEmail: z.string().email().optional(),
  parentPhone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function studentsRoutes(fastify: FastifyInstance) {
  // GET /api/students — Tier ≤ 2 (Admin, Principal, HOD) can list all; Teacher can see class
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const query = request.query as any;

      // Validate pagination params
      const pagination = PaginationSchema.safeParse(query);
      if (!pagination.success) {
        return reply.status(400).send({ success: false, error: 'Invalid query params', details: pagination.error.flatten() });
      }

      const { page, limit, search } = pagination.data;
      const offset = (page - 1) * limit;

      const result = await withTenantContext(user.tenantId, async (tx) => {
        let condition = eq(students.tenantId, user.tenantId);

        if (search) {
          condition = and(
            condition,
            or(
              ilike(students.firstName, `%${search}%`),
              ilike(students.lastName, `%${search}%`),
              ilike(students.rollNumber, `%${search}%`)
            )
          ) as any;
        }

        // Additional scope: students can only see themselves
        if (user.tier >= 4) {
          condition = and(
            condition,
            or(
              eq(students.id, user.sub),
              eq(students.parentEmail, user.email)
            )
          ) as any;
        }

        const data = await tx.select().from(students).where(condition).limit(limit).offset(offset).orderBy(desc(students.createdAt));
        const allCount = await tx.select().from(students).where(condition);
        return { data, total: allCount.length };
      });

      const { data, total } = result;

      // Strip sensitive fields for lower tiers
      const sanitized = data.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        classId: s.classId,
        rollNumber: s.rollNumber,
        gender: s.gender,
        // Only include contact info for authorized roles
        ...(user.tier <= 3 ? { parentEmail: s.parentEmail, parentPhone: s.parentPhone } : {}),
        isActive: s.isActive,
      }));

      return reply.send({
        success: true,
        data: sanitized,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );

  // GET /api/students/:id
  fastify.get(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      const student = await withTenantContext(user.tenantId, async (tx) => {
        const [s] = await tx.select().from(students).where(and(eq(students.id, id), eq(students.tenantId, user.tenantId)));
        return s;
      });

      if (!student) {
        return reply.status(404).send({ success: false, error: 'Student not found' });
      }

      // Tier 4+ (student/parent) can only see their own record
      if (user.tier >= 4) {
        const isOwn = student.id === user.sub || student.parentEmail === user.email;
        if (!isOwn) {
          return reply.status(403).send({ success: false, error: 'Access denied — you can only view your own record' });
        }
      }

      return reply.send({ success: true, data: student });
    }
  );

  // POST /api/students — Admin (Tier ≤ 1) only
  fastify.post(
    '/',
    { onRequest: [fastify.authenticate, tierGuard(1)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const parsed = CreateStudentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      try {
        const student = await withTenantContext(user.tenantId, async (tx) => {
          const [s] = await tx.insert(students).values({
            tenantId: user.tenantId,
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            dateOfBirth: parsed.data.dateOfBirth,
            gender: parsed.data.gender,
            classId: parsed.data.classId,
            rollNumber: parsed.data.rollNumber,
            parentEmail: parsed.data.parentEmail,
            parentPhone: parsed.data.parentPhone,
            isActive: true,
          }).returning();
          return s;
        });

        fastify.log.info({ action: 'STUDENT_CREATED', studentId: student.id, by: user.sub }, 'audit');
        return reply.status(201).send({ success: true, data: student, message: 'Student registered successfully' });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ success: false, error: 'Internal server error' });
      }
    }
  );

  // PATCH /api/students/:id — Admin (Tier ≤ 1) only
  fastify.patch(
    '/:id',
    { onRequest: [fastify.authenticate, tierGuard(1)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      const parsed = UpdateStudentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      try {
        const student = await withTenantContext(user.tenantId, async (tx) => {
          const [s] = await tx.update(students)
            .set({
              ...parsed.data,
              updatedAt: new Date(),
            })
            .where(and(eq(students.id, id), eq(students.tenantId, user.tenantId)))
            .returning();
          return s;
        });

        if (!student) {
          return reply.status(404).send({ success: false, error: 'Student not found' });
        }

        fastify.log.info({ action: 'STUDENT_UPDATED', studentId: student.id, by: user.sub }, 'audit');
        return reply.send({ success: true, data: student, message: 'Student updated successfully' });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ success: false, error: 'Internal server error' });
      }
    }
  );

  // DELETE /api/students/:id — Admin (Tier ≤ 1) only (Soft Delete)
  fastify.delete(
    '/:id',
    { onRequest: [fastify.authenticate, tierGuard(1)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      try {
        const student = await withTenantContext(user.tenantId, async (tx) => {
          const [s] = await tx.update(students)
            .set({
              isActive: false,
              updatedAt: new Date(),
            })
            .where(and(eq(students.id, id), eq(students.tenantId, user.tenantId)))
            .returning();
          return s;
        });

        if (!student) {
          return reply.status(404).send({ success: false, error: 'Student not found' });
        }

        fastify.log.info({ action: 'STUDENT_DEACTIVATED', studentId: student.id, by: user.sub }, 'audit');
        return reply.send({ success: true, message: 'Student deactivated successfully' });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ success: false, error: 'Internal server error' });
      }
    }
  );
}
