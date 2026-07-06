import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { findUserByEmail, DEMO_USERS } from '../db/demo-users';
import { getRoleConfig } from '../middleware/rbac';

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
      const user = findUserByEmail(email);

      if (!user || user.password !== password) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      const roleConfig = getRoleConfig(user.role);

      const token = fastify.jwt.sign(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tier: user.tier,
          tenantId: user.tenantId,
          tenantName: user.tenantName,
          subdomain: user.subdomain,
        },
        { expiresIn: '8h' }
      );

      return reply.status(200).send({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tier: user.tier,
          tenantId: user.tenantId,
          tenantName: user.tenantName,
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
      const user = findUserByEmail(request.user.email);
      if (!user) return reply.status(404).send({ error: 'User not found' });
      const roleConfig = getRoleConfig(user.role);
      return reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tier: user.tier,
          tenantId: user.tenantId,
          tenantName: user.tenantName,
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
    const users = DEMO_USERS.map((u) => ({
      email: u.email,
      password: u.password,
      name: u.name,
      role: u.role,
      tier: u.tier,
      roleLabel: getRoleConfig(u.role).label,
      roleColor: getRoleConfig(u.role).color,
    }));
    return reply.send({ success: true, users });
  });
}
