/**
 * EduCore API — Attendance Routes
 * RBAC: Teacher (POST — mark attendance for their class)
 *       Principal/HOD (GET all) 
 *       Student (GET own only)
 * RLS: tenant-scoped, date-range filtered
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard } from '../middleware/guards';
import { queryAttendance, appendAttendanceRecords, STUDENTS } from '../db/mock-db';
import { AttendanceRecordSchema } from '../schemas/validation';
import { Role } from '../db/demo-users';

export async function attendanceRoutes(fastify: FastifyInstance) {
  // GET /api/attendance — returns attendance records
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { date, studentId } = request.query as { date?: string; studentId?: string };

      // Students can only see their own attendance
      const resolvedStudentId = user.tier >= 4
        ? (STUDENTS.find((s) => s.parent_email === user.email || s.id === user.sub)?.id)
        : studentId;

      const records = queryAttendance(user.tenantId, resolvedStudentId, date);
      return reply.send({ success: true, data: records, count: records.length });
    }
  );

  // POST /api/attendance — Teacher only
  fastify.post(
    '/',
    { onRequest: [fastify.authenticate, rbacGuard(['TEACHER', 'PRINCIPAL', 'HOD'] as Role[])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const parsed = AttendanceRecordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      // Check duplicate — can't mark the same student twice on the same date
      const { classId, date, records } = parsed.data;
      const existing = queryAttendance(user.tenantId, undefined, date)
        .filter((a) => a.class_id === classId);

      if (existing.length > 0) {
        return reply.status(409).send({
          success: false,
          error: `Attendance for class ${classId} on ${date} has already been marked`,
          code: 'DUPLICATE_ATTENDANCE',
        });
      }

      const added = appendAttendanceRecords(
        records.map((r) => ({
          tenant_id: user.tenantId,
          class_id: classId,
          student_id: r.studentId,
          date,
          status: r.status as any,
          marked_by: user.sub,
          note: r.note,
        }))
      );

      fastify.log.info({
        action: 'ATTENDANCE_MARKED',
        classId,
        date,
        count: added.length,
        by: user.sub,
      }, 'audit');

      return reply.status(201).send({
        success: true,
        data: added,
        message: `Attendance marked for ${added.length} students`,
      });
    }
  );

  // GET /api/attendance/summary — aggregated attendance per student
  fastify.get(
    '/summary',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const records = queryAttendance(user.tenantId);

      // Group by student
      const summary: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
      for (const r of records) {
        if (!summary[r.student_id]) summary[r.student_id] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        summary[r.student_id][r.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused']++;
        summary[r.student_id].total++;
      }

      return reply.send({ success: true, data: summary });
    }
  );
}
