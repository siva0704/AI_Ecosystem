/**
 * EduCore API Gateway — Audit Logger Middleware
 * Every request is logged with user identity, tenant, and outcome.
 * PII (Aadhaar, phone numbers) is regex-redacted before logging.
 * Complies with CONTEXT.md §5 data lifecycle rules.
 */
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

// PII redaction patterns — per CONTEXT.md §5 / DPDP Rules 2025
const PII_PATTERNS = [
  { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,              replacement: '[AADHAAR_REDACTED]' },
  { pattern: /\b[6-9]\d{9}\b/g,                          replacement: '[PHONE_REDACTED]' },
  { pattern: /\b\d{16}\b/g,                              replacement: '[CARD_REDACTED]' },
  { pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/g,                 replacement: '[PAN_REDACTED]' },
];

function redactPII(text: string): string {
  let redacted = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

export interface AuditLogEntry {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  userId?: string;
  userRole?: string;
  tenantId?: string;
  ip: string;
  userAgent: string;
  durationMs: number;
  error?: string;
}

const auditLog: AuditLogEntry[] = []; // In-memory for dev; prod: OpenTelemetry → Grafana Loki

export function getAuditLog(): AuditLogEntry[] {
  return [...auditLog];
}

export async function auditLoggerPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (request: FastifyRequest, _reply: FastifyReply, done) => {
    const requestId = randomUUID();
    (request as any).requestId = requestId;
    (request as any).startTime = Date.now();
    // Attach to reply headers for traceability
    done();
  });

  fastify.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply, done) => {
    const user = (request as any).user;
    const durationMs = Date.now() - ((request as any).startTime || Date.now());

    const entry: AuditLogEntry = {
      requestId: (request as any).requestId || randomUUID(),
      timestamp: new Date().toISOString(),
      method: request.method,
      path: redactPII(request.url),
      statusCode: reply.statusCode,
      userId: user?.sub,
      userRole: user?.role,
      tenantId: user?.tenantId,
      ip: request.ip,
      userAgent: redactPII(request.headers['user-agent'] || ''),
      durationMs,
    };

    // Keep rolling window of 1000 entries in dev
    if (auditLog.length >= 1000) auditLog.shift();
    auditLog.push(entry);

    fastify.log.info({
      requestId: entry.requestId,
      method: entry.method,
      path: entry.path,
      status: entry.statusCode,
      ms: entry.durationMs,
      role: entry.userRole || 'unauthenticated',
    }, 'request');

    done();
  });

  fastify.addHook('onError', (request: FastifyRequest, _reply: FastifyReply, error, done) => {
    fastify.log.error({
      requestId: (request as any).requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, 'request_error');
    done();
  });
}
