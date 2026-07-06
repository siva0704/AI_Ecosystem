import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/connection';
import { users, tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { mapUuidToShortId } from '../db/mock-db';
import { getRoleConfig } from '../middleware/rbac';
import { DEMO_USERS } from '../db/demo-users';

// Augment Fastify to recognise our authenticate decorator
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

interface LoginBody {
  email: string;
  password: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/login
  fastify.post<{ Body: LoginBody }>(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const { email, password } = request.body;

      // 1. Query PostgreSQL for user + tenant details
      const [dbUser] = await db
        .select({
          user: users,
          tenant: tenants,
        })
        .from(users)
        .innerJoin(tenants, eq(users.tenantId, tenants.id))
        .where(eq(users.email, email))
        .limit(1);

      if (!dbUser || !dbUser.user.isActive) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // 2. Compare password hashes via bcrypt
      const isMatch = await bcrypt.compare(password, dbUser.user.passwordHash);
      if (!isMatch) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      const user = dbUser.user;
      const tenant = dbUser.tenant;
      const shortUserId = mapUuidToShortId(user.id)!;
      const roleConfig = getRoleConfig(user.role as any);

      const token = fastify.jwt.sign(
        {
          sub: shortUserId,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tier: user.tier,
          tenantId: tenant.id,
          tenantName: tenant.displayName,
          subdomain: user.subdomain,
        },
        { expiresIn: '8h' }
      );

      return reply.status(200).send({
        success: true,
        token,
        user: {
          id: shortUserId,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tier: user.tier,
          tenantId: tenant.id,
          tenantName: tenant.displayName,
          subdomain: user.subdomain,
          dashboardPath: roleConfig.dashboardPath,
          menus: roleConfig.menus,
          roleLabel: roleConfig.label,
          roleColor: roleConfig.color,
        },
      });
    }
  );

  // GET /api/auth/me — returns current user from token
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const email = request.user.email;
      const [dbUser] = await db
        .select({
          user: users,
          tenant: tenants,
        })
        .from(users)
        .innerJoin(tenants, eq(users.tenantId, tenants.id))
        .where(eq(users.email, email))
        .limit(1);

      if (!dbUser) return reply.status(404).send({ error: 'User not found' });
      
      const user = dbUser.user;
      const tenant = dbUser.tenant;
      const shortUserId = mapUuidToShortId(user.id)!;
      const roleConfig = getRoleConfig(user.role as any);

      return reply.send({
        success: true,
        user: {
          id: shortUserId,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tier: user.tier,
          tenantId: tenant.id,
          tenantName: tenant.displayName,
          dashboardPath: roleConfig.dashboardPath,
          menus: roleConfig.menus,
          roleLabel: roleConfig.label,
          roleColor: roleConfig.color,
        },
      });
    }
  );

  // GET /api/auth/demo-users — lists all demo credentials for the dev login panel
  fastify.get('/demo-users', async (_request: FastifyRequest, reply: FastifyReply) => {
    const usersList = DEMO_USERS.map((u) => ({
      email: u.email,
      password: u.password,
      name: u.name,
      role: u.role,
      tier: u.tier,
      roleLabel: getRoleConfig(u.role).label,
      roleColor: getRoleConfig(u.role).color,
    }));
    return reply.send({ success: true, users: usersList });
  });
}
