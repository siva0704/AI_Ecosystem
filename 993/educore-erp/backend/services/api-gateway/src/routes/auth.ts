import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/connection';
import { sql } from 'drizzle-orm';
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

interface AuthUserRow {
  [key: string]: unknown;  // Required for Drizzle execute<T> constraint
  user_id: string;
  tenant_id: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  tier: number;
  subdomain: string;
  is_active: boolean;
  tenant_display_name: string;
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

      // 1. Call SECURITY DEFINER function — the ONLY sanctioned RLS bypass.
      //    authenticate_user() runs as postgres (schema owner), bypassing RLS only
      //    for this single-row email lookup before tenant context is known.
      const result = await db.execute<AuthUserRow>(
        sql`SELECT * FROM authenticate_user(${email})`
      );
      const dbUser = result.rows[0] as AuthUserRow | undefined;

      if (!dbUser || !dbUser.is_active) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // 2. Compare password hashes via bcrypt
      const isMatch = await bcrypt.compare(password, dbUser.password_hash);
      if (!isMatch) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      const shortUserId = mapUuidToShortId(dbUser.user_id)!;
      const roleConfig = getRoleConfig(dbUser.role as any);

      const token = fastify.jwt.sign(
        {
          sub: shortUserId,
          email,
          name: `${dbUser.first_name} ${dbUser.last_name}`,
          role: dbUser.role,
          tier: dbUser.tier,
          tenantId: dbUser.tenant_id,
          tenantName: dbUser.tenant_display_name,
          subdomain: dbUser.subdomain,
        },
        { expiresIn: '8h' }
      );

      return reply.status(200).send({
        success: true,
        token,
        user: {
          id: shortUserId,
          email,
          name: `${dbUser.first_name} ${dbUser.last_name}`,
          role: dbUser.role,
          tier: dbUser.tier,
          tenantId: dbUser.tenant_id,
          tenantName: dbUser.tenant_display_name,
          subdomain: dbUser.subdomain,
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
      // Use the same SECURITY DEFINER function so /me also works under RLS
      const result = await db.execute<AuthUserRow>(
        sql`SELECT * FROM authenticate_user(${email})`
      );
      const dbUser = result.rows[0] as AuthUserRow | undefined;

      if (!dbUser) return reply.status(404).send({ error: 'User not found' });

      const shortUserId = mapUuidToShortId(dbUser.user_id)!;
      const roleConfig = getRoleConfig(dbUser.role as any);

      return reply.send({
        success: true,
        user: {
          id: shortUserId,
          email,
          name: `${dbUser.first_name} ${dbUser.last_name}`,
          role: dbUser.role,
          tier: dbUser.tier,
          tenantId: dbUser.tenant_id,
          tenantName: dbUser.tenant_display_name,
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
