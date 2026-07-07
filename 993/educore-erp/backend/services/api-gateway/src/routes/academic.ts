import { FastifyInstance, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { classes, subjects, classSubjects, staff } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { rbacGuard } from '../middleware/guards';

const ClassSchema = z.object({
  grade: z.string().min(1),
  section: z.string().min(1),
  classTeacherId: z.string().uuid().optional(),
});

const SubjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
});

export async function academicRoutes(fastify: FastifyInstance) {
  // ─── GET /api/academic/classes ──────────────────────────────────────────────
  fastify.get('/classes', { onRequest: [fastify.authenticate] }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;

    const data = await withTenantContext(tenantId, async (tx) => {
      return await tx.select({
        id: classes.id,
        grade: classes.grade,
        section: classes.section,
        isActive: classes.isActive,
        classTeacherId: classes.classTeacherId,
        teacherFirstName: staff.firstName,
        teacherLastName: staff.lastName,
      })
      .from(classes)
      .leftJoin(staff, eq(classes.classTeacherId, staff.id));
    });

    return reply.send({ success: true, data });
  });

  // ─── POST /api/academic/classes ─────────────────────────────────────────────
  fastify.post('/classes', { onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'PRINCIPAL'])] }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const parsed = ClassSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Invalid class data', details: parsed.error });
    }

    try {
      const data = await withTenantContext(tenantId, async (tx) => {
        return await tx.insert(classes).values({
          tenantId,
          grade: parsed.data.grade,
          section: parsed.data.section,
          classTeacherId: parsed.data.classTeacherId || null,
        }).returning();
      });

      return reply.send({ success: true, data: data[0] });
    } catch (err: any) {
      if (err.code === '23505') {
        return reply.code(409).send({ success: false, error: 'Class and Section already exists' });
      }
      fastify.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal server error' });
    }
  });

  // ─── GET /api/academic/subjects ─────────────────────────────────────────────
  fastify.get('/subjects', { onRequest: [fastify.authenticate] }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;

    const data = await withTenantContext(tenantId, async (tx) => {
      return await tx.select().from(subjects);
    });

    return reply.send({ success: true, data });
  });

  // ─── POST /api/academic/subjects ────────────────────────────────────────────
  fastify.post('/subjects', { onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'PRINCIPAL'])] }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const parsed = SubjectSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Invalid subject data', details: parsed.error });
    }

    try {
      const data = await withTenantContext(tenantId, async (tx) => {
        return await tx.insert(subjects).values({
          tenantId,
          name: parsed.data.name,
          code: parsed.data.code,
        }).returning();
      });

      return reply.send({ success: true, data: data[0] });
    } catch (err: any) {
      if (err.code === '23505') {
        return reply.code(409).send({ success: false, error: 'Subject code already exists' });
      }
      fastify.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal server error' });
    }
  });
}
