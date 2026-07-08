import { FastifyInstance, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { hostelRooms, hostelAllocations, students } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { rbacGuard } from '../middleware/guards';

const AllocationSchema = z.object({
  roomId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYear: z.string().default('2026-27'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function hostelRoutesPlugin(fastify: FastifyInstance) {

  // ── GET /api/hostel/rooms ─────────────────────────────────────────────────
  fastify.get('/rooms', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'HOSTEL_WARDEN'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;

    const data = await withTenantContext(tenantId, async (tx) => {
      return await tx.select().from(hostelRooms);
    });

    return reply.send({ success: true, data });
  });

  // ── POST /api/hostel/allocate ─────────────────────────────────────────────
  fastify.post('/allocate', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'HOSTEL_WARDEN'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const parsed = AllocationSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: 'Invalid allocation data', details: parsed.error.flatten() });
    }

    try {
      const data = await withTenantContext(tenantId, async (tx) => {
        const [allocation] = await tx.insert(hostelAllocations).values({
          tenantId,
          ...parsed.data,
          allocatedBy: request.user.userId,
        }).returning();
        
        // Update occupancy (simple increment for MVP, a real system would be more robust)
        await tx.execute(
          sql`UPDATE ${hostelRooms} SET occupied = occupied + 1 WHERE id = ${parsed.data.roomId} AND tenant_id = ${tenantId}`
        );

        return allocation;
      });

      return reply.code(201).send({ success: true, data });
    } catch (err: any) {
      if (err.code === '23505') {
        return reply.code(409).send({ success: false, error: 'Student already allocated for this academic year' });
      }
      fastify.log.error(err);
      return reply.code(500).send({ success: false, error: 'Internal server error' });
    }
  });

  // ── GET /api/hostel/allocations ───────────────────────────────────────────
  fastify.get('/allocations', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'HOSTEL_WARDEN'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const data = await withTenantContext(tenantId, async (tx) => {
      return await tx.select({
        id: hostelAllocations.id,
        roomId: hostelAllocations.roomId,
        studentId: hostelAllocations.studentId,
        academicYear: hostelAllocations.academicYear,
        checkInDate: hostelAllocations.checkInDate,
        checkOutDate: hostelAllocations.checkOutDate,
        status: hostelAllocations.status,
        roomNumber: hostelRooms.roomNumber,
        block: hostelRooms.block,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        rollNumber: students.rollNumber,
      }).from(hostelAllocations)
        .innerJoin(hostelRooms, eq(hostelAllocations.roomId, hostelRooms.id))
        .innerJoin(students, eq(hostelAllocations.studentId, students.id))
        .where(eq(hostelAllocations.tenantId, tenantId))
        .orderBy(desc(hostelAllocations.createdAt));
    });
    return reply.send({ success: true, data });
  });

  // ── PATCH /api/hostel/allocate/:id/checkout ───────────────────────────────
  fastify.patch('/allocate/:id/checkout', {
    onRequest: [fastify.authenticate, rbacGuard(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'HOSTEL_WARDEN'])],
  }, async (request: any, reply: FastifyReply) => {
    const tenantId = request.user.tenantId;
    const { id } = request.params as { id: string };

    try {
      const data = await withTenantContext(tenantId, async (tx) => {
        const [allocation] = await tx.select().from(hostelAllocations)
          .where(and(eq(hostelAllocations.id, id), eq(hostelAllocations.tenantId, tenantId)));
        
        if (!allocation) throw new Error('Allocation not found');
        if (allocation.status !== 'ACTIVE') throw new Error('Allocation is not active');

        const [updated] = await tx.update(hostelAllocations)
          .set({ status: 'CHECKED_OUT', checkOutDate: new Date().toISOString().split('T')[0] })
          .where(eq(hostelAllocations.id, id))
          .returning();
          
        await tx.execute(
          sql`UPDATE ${hostelRooms} SET occupied = occupied - 1 WHERE id = ${allocation.roomId} AND tenant_id = ${tenantId}`
        );

        return updated;
      });

      return reply.send({ success: true, data });
    } catch (err: any) {
      if (err.message) return reply.code(400).send({ success: false, error: err.message });
      return reply.code(500).send({ success: false, error: 'Internal server error' });
    }
  });
}
