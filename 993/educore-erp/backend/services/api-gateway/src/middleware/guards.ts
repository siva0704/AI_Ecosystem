/**
 * EduCore API Gateway — RBAC Guard Middleware
 * Verifies JWT token tier against allowed tiers for each route.
 * A role must have BOTH a valid JWT AND sufficient tier to access a route.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '../db/demo-users';
import { canAccess } from './rbac';

/** Minimum tier required per route prefix */
export const ROUTE_TIER_REQUIREMENTS: Record<string, number> = {
  '/api/platform': 0,        // Super admin only
  '/api/admin': 1,           // Institution admin+
  '/api/principal': 2,       // Principal+
  '/api/hod': 2,             // HOD+
  '/api/teacher': 3,         // Teacher (role-restricted, not tier-only)
  '/api/finance': 3,         // Accountant (role-restricted)
  '/api/hr': 3,              // HR Manager (role-restricted)
  '/api/transport': 3,       // Transport Officer (role-restricted)
  '/api/hostel': 3,          // Hostel Warden (role-restricted)
  '/api/library': 3,         // Librarian (role-restricted)
  '/api/students': 1,        // Admin+ can manage, but students can read own
  '/api/attendance': 3,      // Teacher+ can write, students read own
  '/api/assignments': 3,     // Teacher+ can write
  '/api/staff': 1,           // Admin+ can see all
  '/api/audit': 6,           // Auditor restricted view
  '/api/dashboard': 0,       // Any authenticated user
  '/api/auth': 0,            // Public (login/demo-users)
};

/**
 * Creates a Fastify preHandler hook that enforces RBAC.
 * Usage: fastify.get('/route', { preHandler: [rbacGuard(['TEACHER', 'HOD'])] }, handler)
 */
export function rbacGuard(allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(user.role as Role)) {
      return reply.status(403).send({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${user.role}`,
        code: 'RBAC_INSUFFICIENT_ROLE',
      });
    }
  };
}

/**
 * Tier-based guard — requires minimum tier level.
 * Useful for bulk read operations that span multiple sub-roles.
 */
export function tierGuard(minTier: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
    if (user.tier > minTier) {
      // Higher tier number = lower access. Super admin is tier 0 (lowest number = highest access)
      return reply.status(403).send({
        success: false,
        error: `Insufficient access tier. Required: Tier ≤ ${minTier}. Your tier: ${user.tier}`,
        code: 'RBAC_INSUFFICIENT_TIER',
      });
    }
  };
}

/**
 * Own-data guard — ensures a user can only access their own resources
 * unless they have elevated tier.
 */
export function ownDataOrTierGuard(paramName: string, maxTierForAny: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
    const paramId = (request.params as any)[paramName];
    // If the user has sufficient tier (low tier number), they can see any record
    if (user.tier <= maxTierForAny) return;
    // Otherwise, they can only access their own resource
    if (paramId && paramId !== user.sub) {
      return reply.status(403).send({
        success: false,
        error: 'You can only access your own data',
        code: 'RBAC_OWN_DATA_VIOLATION',
      });
    }
  };
}
