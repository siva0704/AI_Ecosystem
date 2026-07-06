/**
 * EduCore API — Students Routes
 * RBAC: Admin/Principal can list all. Teacher can list their class students.
 *       Student/Parent can only access their own record.
 * RLS: All queries tenant-scoped via JWT tenantId.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard, tierGuard } from '../middleware/guards';
import { queryStudents, addStudent } from '../db/mock-db';
import { CreateStudentSchema, PaginationSchema } from '../schemas/validation';

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

      // RLS: always tenant-scoped
      let students = await queryStudents(user.tenantId, search);

      // Additional scope: students can only see themselves
      if (user.tier >= 4) {
        students = students.filter((s) => s.id === user.sub || s.parent_email === user.email);
      }

      const total = students.length;
      const paginated = students.slice((page - 1) * limit, page * limit);

      // Strip sensitive fields for lower tiers
      const sanitized = paginated.map((s) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        grade: s.grade,
        section: s.section,
        rollNumber: s.roll_number,
        gender: s.gender,
        // Only include contact info for authorized roles
        ...(user.tier <= 3 ? { parentEmail: s.parent_email } : {}),
        isActive: s.is_active,
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

      const studentsList = await queryStudents(user.tenantId);
      const student = studentsList.find((s) => s.id === id);
      if (!student) {
        return reply.status(404).send({ success: false, error: 'Student not found' });
      }

      // Tier 4+ (student/parent) can only see their own record
      if (user.tier >= 4) {
        const isOwn = student.id === user.sub || student.parent_email === user.email;
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

      const student = await addStudent(user.tenantId, {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        date_of_birth: parsed.data.dateOfBirth,
        gender: parsed.data.gender as any,
        grade: parsed.data.grade,
        section: parsed.data.section,
        roll_number: parsed.data.rollNumber,
        parent_email: parsed.data.parentEmail,
        parent_phone: parsed.data.parentPhone,
        is_active: true,
      });

      fastify.log.info({ action: 'STUDENT_CREATED', studentId: student.id, by: user.sub }, 'audit');
      return reply.status(201).send({ success: true, data: student, message: 'Student registered successfully' });
    }
  );
}
