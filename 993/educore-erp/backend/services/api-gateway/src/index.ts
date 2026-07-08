/**
 * EduCore API Gateway — Main Server
 * Security: JWT + CORS + Helmet + Rate Limiting + Audit Logging
 * All routes are RBAC-protected. All data is tenant-scoped.
 * Compliant with CONTEXT.md security laws.
 */
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { authRoutes } from './routes/auth';
import { dashboardRoutes } from './routes/dashboard';
import { studentsRoutes } from './routes/students';
import { attendanceRoutes } from './routes/attendance';
import { feeRoutes } from './routes/fees';
import { libraryRoutes } from './routes/library';
import { staffRoutes } from './routes/staff';
import { academicRoutes } from './routes/academic';
import { hrRoutes } from './routes/hr';
import { leavesRoutes } from './routes/leaves';
import { transportRoutesPlugin } from './routes/transport';
import { hostelRoutesPlugin } from './routes/hostel';
import { admissionsRoutes } from './routes/admissions';
import { complianceRoutes } from './routes/compliance';
import { recordsRoutes } from './routes/records';
import { assetsRoutes } from './routes/assets';
import { examsRoutes } from './routes/exams';
import { auditLoggerPlugin } from './middleware/audit-logger';

const fastify = Fastify({
  logger: {
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
  genReqId: function (req) {
    return (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  }
});

// ─── Security Headers (Helmet) ───────────────────────────────────────────────
fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'http://localhost:3000'],
      frameSrc: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',');
fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('CORS blocked'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

// ─── JWT ─────────────────────────────────────────────────────────────────────
// The architectural specification mandates RS256 asymmetric cryptography.
// In production, these should be loaded from HashiCorp Vault.
let privateKey, publicKey;
try {
  privateKey = fs.readFileSync(path.join(__dirname, '../keys/jwtRS256.key'), 'utf8');
  publicKey = fs.readFileSync(path.join(__dirname, '../keys/jwtRS256.key.pub'), 'utf8');
} catch (err) {
  console.warn('WARN: RS256 keys not found in keys/. Run `node generate-keys.js`.');
  // Fallback for dev if keys are missing (should not happen in prod)
  privateKey = 'fallback';
  publicKey = 'fallback';
}

fastify.register(jwt, {
  secret: {
    private: privateKey,
    public: publicKey,
  },
  sign: { algorithm: 'RS256' },
});

// ─── Cookie Plugin (for httpOnly refresh tokens) ──────────────────────────────
fastify.register(cookie);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
fastify.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
  errorResponseBuilder: () => ({
    success: false,
    error: 'Too many requests — you are being rate limited',
    code: 'RATE_LIMIT_EXCEEDED',
  }),
});

// ─── Audit Logging ────────────────────────────────────────────────────────────
fastify.register(auditLoggerPlugin);

// ─── JWT Auth Decorator ───────────────────────────────────────────────────────
fastify.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({
      success: false,
      error: 'Unauthorized — invalid or expired token. Please log in again.',
      code: 'AUTH_TOKEN_INVALID',
    });
  }
});

// ─── Routes ──────────────────────────────────────────────────────────────────
fastify.register(authRoutes,        { prefix: '/api/auth' });
fastify.register(dashboardRoutes,   { prefix: '/api/dashboard' });
fastify.register(studentsRoutes,    { prefix: '/api/students' });
fastify.register(attendanceRoutes,  { prefix: '/api/attendance' });
fastify.register(feeRoutes,         { prefix: '/api/fees' });
fastify.register(libraryRoutes,     { prefix: '/api/library' });
fastify.register(staffRoutes,       { prefix: '/api/staff' });
fastify.register(academicRoutes,    { prefix: '/api/academic' });
fastify.register(hrRoutes,          { prefix: '/api/hr' });
fastify.register(leavesRoutes,      { prefix: '/api/leaves' });
fastify.register(transportRoutesPlugin, { prefix: '/api/transport' });
fastify.register(hostelRoutesPlugin,    { prefix: '/api/hostel' });
fastify.register(admissionsRoutes,      { prefix: '/api/admissions' });
fastify.register(complianceRoutes,      { prefix: '/api/compliance' });
fastify.register(recordsRoutes,         { prefix: '/api/records' });
fastify.register(assetsRoutes,          { prefix: '/api/assets' });
fastify.register(examsRoutes,           { prefix: '/api/exams' });

// ─── Health & Info ────────────────────────────────────────────────────────────
fastify.get('/health', async () => ({
  status: 'ok',
  service: 'EduCore API Gateway',
  version: '0.1.0-alpha',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
}));

fastify.get('/api/info', async () => ({
  name: 'EduCore ERP API',
  version: '0.2.0-alpha',
  description: 'AI-Native Multi-Tenant Education ERP — Phase 1 MVP',
  endpoints: {
    auth:       '/api/auth/*',
    refresh:    'POST /api/auth/refresh  (silent token rotation via httpOnly cookie)',
    logout:     'POST /api/auth/logout   (revokes refresh token)',
    dashboard:  '/api/dashboard',
    students:   '/api/students',
    attendance: '/api/attendance',
    fees:       '/api/fees',
    library:    '/api/library/*',
    staff:      '/api/staff',
  },
  security: {
    auth: 'JWT HS256 (15m access token + 7d httpOnly refresh cookie)',
    cors: allowedOrigins,
    rateLimit: '100 req/min',
    headers: 'Helmet CSP enforced',
    tenantIsolation: 'RLS via set_config(app.current_tenant_id)',
    dbRole: 'educore_app (NOBYPASSRLS)',
  },
}));

// ─── Global Error Handler ─────────────────────────────────────────────────────
fastify.setErrorHandler((error: any, _request, reply) => {
  fastify.log.error(error);
  const statusCode = (error as any).statusCode || 500;
  reply.status(statusCode).send({
    success: false,
    error: statusCode === 500 ? 'Internal server error' : (error as any).message,
    code: (error as any).code || 'INTERNAL_ERROR',
  });
});


// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });

    console.log('\n🎓 EduCore API Gateway — v0.1.0-alpha');
    console.log('─────────────────────────────────────────────');
    console.log(`🌐 Base URL:       http://localhost:${port}`);
    console.log(`❤️  Health:         http://localhost:${port}/health`);
    console.log(`ℹ️  API Info:       http://localhost:${port}/api/info`);
    console.log(`🔑 Auth:           POST http://localhost:${port}/api/auth/login`);
    console.log(`👥 Demo users:     GET  http://localhost:${port}/api/auth/demo-users`);
    console.log('─────────────────────────────────────────────');
    console.log(`⚠️  MODE:          ${process.env.NODE_ENV || 'development'}`);
    console.log(process.env.NODE_ENV !== 'production'
      ? '⚠️  Demo credentials active — NOT for production\n'
      : '✅ Production mode — demo routes disabled\n');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
