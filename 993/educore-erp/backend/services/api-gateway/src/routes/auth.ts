import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/connection';
import { sql, eq, and } from 'drizzle-orm';
import { refreshTokens } from '../db/schema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { mapUuidToShortId, mapShortIdToUuid } from '../db/mock-db';
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

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_COOKIE_NAME = 'educore_refresh';

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function authRoutes(fastify: FastifyInstance) {
  // ─── POST /api/auth/login ─────────────────────────────────────────────────
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
      const isMatch = await bcrypt.compare(password, dbUser.password_hash as string);
      if (!isMatch) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      const shortUserId = mapUuidToShortId(dbUser.user_id as string)!;
      const roleConfig = getRoleConfig(dbUser.role as any);

      // 3. Issue short-lived access token (15m)
      const accessToken = fastify.jwt.sign(
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
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      // 4. Issue long-lived refresh token (7d) — stored hashed in DB
      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      const fullUserId = dbUser.user_id as string;

      await db.insert(refreshTokens).values({
        userId: fullUserId,
        tenantId: dbUser.tenant_id as string,
        tokenHash,
        expiresAt,
        userAgent: request.headers['user-agent']?.substring(0, 512) || null,
        ipAddress: request.ip?.substring(0, 50) || null,
      });

      // 5. Set refresh token in httpOnly cookie (not accessible from JS)
      reply.setCookie(REFRESH_COOKIE_NAME, rawRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
        sameSite: 'strict',
        path: '/api/auth',                              // Only sent to /api/auth/* endpoints
        maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
      });

      return reply.status(200).send({
        success: true,
        token: accessToken,                             // Short-lived (15m) — used in Authorization header
        expiresIn: 900,                                 // 15 * 60 seconds
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

  // ─── POST /api/auth/refresh ───────────────────────────────────────────────
  // Silently rotates access + refresh tokens using the httpOnly cookie.
  // Called automatically by the frontend when an API request returns 401.
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawToken = (request.cookies as any)?.[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      return reply.status(401).send({ success: false, error: 'No refresh token', code: 'NO_REFRESH_TOKEN' });
    }

    const tokenHash = hashToken(rawToken);
    const now = new Date();

    // 1. Look up the refresh token record
    const [record] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          eq(refreshTokens.isRevoked, false)
        )
      )
      .limit(1);

    if (!record || record.expiresAt < now) {
      // Clear the stale cookie
      reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      return reply.status(401).send({ success: false, error: 'Refresh token expired or revoked', code: 'REFRESH_TOKEN_INVALID' });
    }

    // 2. Revoke the old refresh token (rotation — prevents replay attacks)
    await db
      .update(refreshTokens)
      .set({ isRevoked: true, lastUsedAt: now })
      .where(eq(refreshTokens.id, record.id));

    // 3. Get user details via the SECURITY DEFINER function
    const userRows = await db.execute<AuthUserRow>(
      sql`SELECT u.user_id, u.tenant_id, u.first_name, u.last_name, u.email,
               u.role, u.tier, u.subdomain, u.is_active, t.display_name as tenant_display_name
          FROM users u
          JOIN tenants t ON u.tenant_id = t.tenant_id
          WHERE u.user_id = ${record.userId}`
    );
    const dbUser = userRows.rows[0] as AuthUserRow | undefined;

    if (!dbUser || !dbUser.is_active) {
      reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      return reply.status(401).send({ success: false, error: 'User not found or inactive', code: 'USER_INACTIVE' });
    }

    const shortUserId = mapUuidToShortId(dbUser.user_id as string)!;

    // 4. Issue new 15m access token
    const newAccessToken = fastify.jwt.sign(
      {
        sub: shortUserId,
        email: dbUser.email,
        name: `${dbUser.first_name} ${dbUser.last_name}`,
        role: dbUser.role,
        tier: dbUser.tier,
        tenantId: dbUser.tenant_id,
        tenantName: dbUser.tenant_display_name,
        subdomain: dbUser.subdomain,
      },
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // 5. Issue new 7d refresh token (rotation complete)
    const newRawToken = generateRefreshToken();
    const newTokenHash = hashToken(newRawToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({
      userId: record.userId,
      tenantId: record.tenantId,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      userAgent: request.headers['user-agent']?.substring(0, 512) || null,
      ipAddress: request.ip?.substring(0, 50) || null,
    });

    reply.setCookie(REFRESH_COOKIE_NAME, newRawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    });

    return reply.send({
      success: true,
      token: newAccessToken,
      expiresIn: 900,
    });
  });

  // ─── POST /api/auth/logout ────────────────────────────────────────────────
  // Revokes all refresh tokens for the current user. Clears the cookie.
  fastify.post(
    '/logout',
    { onRequest: [fastify.authenticate] },
    async (request: any, reply: FastifyReply) => {
      const rawToken = (request.cookies as any)?.[REFRESH_COOKIE_NAME];
      if (rawToken) {
        const tokenHash = hashToken(rawToken);
        await db
          .update(refreshTokens)
          .set({ isRevoked: true })
          .where(eq(refreshTokens.tokenHash, tokenHash));
      }

      reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      return reply.send({ success: true, message: 'Logged out successfully' });
    }
  );

  // ─── GET /api/auth/me ─────────────────────────────────────────────────────
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

      const shortUserId = mapUuidToShortId(dbUser.user_id as string)!;
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

}
