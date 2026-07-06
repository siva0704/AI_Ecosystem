/**
 * EduCore API — Staff Routes
 * RBAC: HR Manager — full CRUD. Admin/Principal — read all. Others — no access.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard, tierGuard } from '../middleware/guards';
import { queryStaff, addStaff } from '../db/mock-db';
import { CreateStaffSchema, PaginationSchema } from '../schemas/validation';
import { Role } from '../db/demo-users';

export async function staffRoutes(fastify: FastifyInstance) {
  // GET /api/staff — Admin, Principal, HR can see all
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate, tierGuard(3)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const query = request.query as any;
      const pagination = PaginationSchema.safeParse(query);
      if (!pagination.success) {
        return reply.status(400).send({ success: false, error: 'Invalid query params' });
      }

      const { page, limit, search } = pagination.data;
      const staff = queryStaff(user.tenantId, search);
      const paginated = staff.slice((page - 1) * limit, page * limit);

      // DPDP: only HR can see phone/sensitive fields
      const isHR = user.role === 'HR_MANAGER' || user.tier <= 1;
      const sanitized = paginated.map((s) => ({
        id: s.id,
        employeeId: s.employee_id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        role: s.role,
        department: s.department,
        dateOfJoining: s.date_of_joining,
        dpdpConsentGiven: s.dpdp_consent_given,
        isActive: s.is_active,
        ...(isHR ? { phone: s.phone } : {}),
      }));

      return reply.send({
        success: true,
        data: sanitized,
        meta: { page, limit, total: staff.length },
      });
    }
  );

  // POST /api/staff — HR Manager only
  fastify.post(
    '/',
    { onRequest: [fastify.authenticate, rbacGuard(['HR_MANAGER', 'INSTITUTION_ADMIN'] as Role[])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const parsed = CreateStaffSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      const staff = addStaff({
        tenant_id: user.tenantId,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        role: parsed.data.role,
        department: parsed.data.department,
        date_of_joining: parsed.data.dateOfJoining,
        employee_id: parsed.data.employeeId,
        dpdp_consent_given: parsed.data.dpdpConsentGiven,
        is_active: true,
      });

      fastify.log.info({ action: 'STAFF_CREATED', staffId: staff.id, by: user.sub }, 'audit');
      return reply.status(201).send({ success: true, data: staff, message: 'Staff member added successfully' });
    }
  );
}
