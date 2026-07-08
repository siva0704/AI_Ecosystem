import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withTenantContext, pool } from '../db/connection';
import { z } from 'zod';

const AttendanceRecordSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    note: z.string().max(200).optional().nullable(),
  })).min(1, 'At least one attendance record required').max(200)
});

// Helper to extract context from Gateway headers
function getContext(request: FastifyRequest) {
  const tenantId = request.headers['x-tenant-id'] as string;
  const userId = request.headers['x-user-id'] as string;
  const userRole = request.headers['x-user-role'] as string;
  const userTier = parseInt((request.headers['x-user-tier'] as string) || '99', 10);
  
  if (!tenantId || !userId) {
    throw new Error('Missing Tenant or User context from API Gateway');
  }
  return { tenantId, userId, userRole, userTier };
}

export async function attendanceRoutes(fastify: FastifyInstance) {
  
  // GET /api/academic/attendance
  fastify.get('/attendance', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tenantId, userId, userTier } = getContext(request);
      const { date, studentId, classId } = request.query as { date?: string; studentId?: string, classId?: string };

      let resolvedStudentId = studentId;

      const records = await withTenantContext(tenantId, async (client) => {
        // If student (Tier 4+), they can only see their own attendance.
        // We look up the student ID associated with this user.
        if (userTier >= 4) {
          const studentRes = await client.query('SELECT student_id FROM students WHERE user_id = $1', [userId]);
          if (studentRes.rows.length > 0) {
            resolvedStudentId = studentRes.rows[0].student_id;
          } else {
            return []; // No student profile linked
          }
        }

        let query = `
          SELECT a.*, s.first_name, s.last_name, s.roll_number 
          FROM attendance_records a
          JOIN students s ON a.student_id = s.student_id
          WHERE a.tenant_id = $1
        `;
        const params: any[] = [tenantId];
        let paramIdx = 2;

        if (resolvedStudentId) {
          query += ` AND a.student_id = $${paramIdx++}`;
          params.push(resolvedStudentId);
        }
        if (date) {
          query += ` AND a.date = $${paramIdx++}`;
          params.push(date);
        }
        if (classId) {
          query += ` AND a.class_id = $${paramIdx++}`;
          params.push(classId);
        }

        query += ` ORDER BY a.date DESC`;
        const res = await client.query(query, params);
        return res.rows;
      });

      return reply.send({ success: true, data: records, count: records.length });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // POST /api/academic/attendance
  fastify.post('/attendance', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tenantId, userId } = getContext(request);
      
      const parsed = AttendanceRecordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      const { classId, date, records } = parsed.data;

      const result = await withTenantContext(tenantId, async (client) => {
        // Check if attendance is already marked for this class on this date
        const existing = await client.query(
          `SELECT 1 FROM attendance_records WHERE class_id = $1 AND date = $2 LIMIT 1`,
          [classId, date]
        );
        
        if (existing.rows.length > 0) {
          return { conflict: true };
        }

        // Insert all records
        // We use parameterized unnesting or a loop. Loop is fine for small batches.
        const inserted = [];
        for (const r of records) {
          const res = await client.query(`
            INSERT INTO attendance_records (tenant_id, class_id, student_id, date, status, marked_by, note)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING attendance_id, student_id, status
          `, [tenantId, classId, r.studentId, date, r.status, userId, r.note || null]);
          inserted.push(res.rows[0]);
        }
        return { conflict: false, data: inserted };
      });

      if (result.conflict) {
        return reply.status(409).send({
          success: false,
          error: `Attendance for class ${classId} on ${date} has already been marked`,
          code: 'DUPLICATE_ATTENDANCE'
        });
      }

      return reply.status(201).send({
        success: true,
        data: result.data,
        message: `Attendance marked for ${result.data?.length} students`
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // GET /api/academic/attendance/summary
  fastify.get('/attendance/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tenantId } = getContext(request);
      
      const summary = await withTenantContext(tenantId, async (client) => {
        const res = await client.query(`
          SELECT 
            status, 
            COUNT(*) as count
          FROM attendance_records
          WHERE tenant_id = $1
          GROUP BY status
        `, [tenantId]);

        const data = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
        res.rows.forEach((r: any) => {
          data[r.status as keyof typeof data] = parseInt(r.count, 10);
        });
        
        return data;
      });

      return reply.send({ success: true, data: summary });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
