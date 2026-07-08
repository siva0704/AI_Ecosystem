/**
 * EduCore API — Fee Routes
 * CRITICAL LAWS (CONTEXT.md §1):
 *   - Amount comes from SERVER-SIDE fee structure only — never from client payload
 *   - No AI-generated arithmetic
 *   - Transactions are APPEND-ONLY — no UPDATE/DELETE paths exist
 * RBAC: Accountant — full access. Student/Parent — own records only.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard, tierGuard } from '../middleware/guards';
import { Role } from '../db/demo-users';
import { db, withTenantContext } from '../db/connection';
import { feeTransactions, students } from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { z } from 'zod';

// ⚠️ FEE STRUCTURES — Hand-coded, deterministic. NEVER AI-generated.
const FEE_STRUCTURES: Record<string, { amount_paise: number; description: string }> = {
  'annual-tuition':  { amount_paise: 1250000, description: 'Annual Tuition Fee (₹12,500)' },
  'term-q1':        { amount_paise:  820000,  description: 'Term Fee Q1 (₹8,200)' },
  'hostel-annual':  { amount_paise: 1500000, description: 'Annual Hostel Fee (₹15,000)' },
  'transport-term': { amount_paise:  350000,  description: 'Term Transport Fee (₹3,500)' },
  'library':        { amount_paise:   50000,  description: 'Annual Library Fee (₹500)' },
};

const InitiateFeePaymentSchema = z.object({
  studentId: z.string().uuid(),
  feeHeadId: z.string(),
  paymentMode: z.enum(['UPI', 'CARD', 'CASH', 'BANK_TRANSFER']),
});

const ConcessionSchema = z.object({
  studentId: z.string().uuid(),
  amountPaise: z.number().int().positive(), // will be converted to negative
  reason: z.string().min(5),
});

export async function feeRoutes(fastify: FastifyInstance) {
  // GET /api/fees — Accountant sees all; Student/Parent see their own
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { studentId } = request.query as { studentId?: string };

      const data = await withTenantContext(user.tenantId, async (tx) => {
        let condition = eq(feeTransactions.tenantId, user.tenantId);
        
        if (user.tier >= 4) {
          // Find own student records
          const myStudents = await tx.select({ id: students.id }).from(students)
            .where(and(eq(students.tenantId, user.tenantId), eq(students.id, user.sub))); // Simplification: assume user.sub is student id if student.
          
          if (myStudents.length === 0) return [];
          condition = and(condition, inArray(feeTransactions.studentId, myStudents.map(s => s.id))) as any;
        } else if (studentId) {
          condition = and(condition, eq(feeTransactions.studentId, studentId)) as any;
        }

        return await tx.select({
          id: feeTransactions.id,
          studentId: feeTransactions.studentId,
          feeHead: feeTransactions.feeHead,
          amountPaise: feeTransactions.amountPaise,
          currency: feeTransactions.currency,
          paymentStatus: feeTransactions.paymentStatus,
          paymentMode: feeTransactions.paymentMode,
          createdAt: feeTransactions.createdAt,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          rollNumber: students.rollNumber,
        }).from(feeTransactions)
          .innerJoin(students, eq(feeTransactions.studentId, students.id))
          .where(condition)
          .orderBy(desc(feeTransactions.createdAt));
      });

      const formatted = data.map((t) => ({
        ...t,
        amount_rupees: (t.amountPaise / 100).toFixed(2),
        amount_display: `₹${(t.amountPaise / 100).toLocaleString('en-IN')}`,
      }));

      return reply.send({
        success: true,
        data: formatted,
        meta: {
          total_collected_paise: data
            .filter((t) => t.paymentStatus === 'CAPTURED')
            .reduce((sum, t) => sum + t.amountPaise, 0),
          pending_count: data.filter((t) => t.paymentStatus === 'PENDING').length,
        },
      });
    }
  );

  // GET /api/fees/structures
  fastify.get(
    '/structures',
    { onRequest: [fastify.authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ success: true, data: FEE_STRUCTURES });
    }
  );

  // POST /api/fees/initiate — ACCOUNTANT only
  fastify.post(
    '/initiate',
    { onRequest: [fastify.authenticate, rbacGuard(['ACCOUNTANT', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const parsed = InitiateFeePaymentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      const { studentId, feeHeadId, paymentMode } = parsed.data;

      const feeStructure = FEE_STRUCTURES[feeHeadId];
      if (!feeStructure) {
        return reply.status(400).send({ success: false, error: `Unknown fee head: ${feeHeadId}` });
      }

      try {
        const txn = await withTenantContext(user.tenantId, async (tx) => {
          const [s] = await tx.select().from(students)
            .where(and(eq(students.id, studentId), eq(students.tenantId, user.tenantId)));
          if (!s) throw new Error('Student not found');

          const [transaction] = await tx.insert(feeTransactions).values({
            tenantId: user.tenantId,
            studentId,
            feeHead: feeStructure.description,
            amountPaise: feeStructure.amount_paise,
            paymentStatus: 'CAPTURED', // Auto capture for MVP
            paymentMode,
            auditMetadata: { initiatedBy: user.sub },
          }).returning();

          return transaction;
        });

        fastify.log.info({ action: 'FEE_PAYMENT_INITIATED', transactionId: txn.id, by: user.sub }, 'audit');
        return reply.status(201).send({ success: true, data: txn });
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );

  // POST /api/fees/concession — INSTITUTION ADMIN only
  fastify.post(
    '/concession',
    { onRequest: [fastify.authenticate, tierGuard(1)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const parsed = ConcessionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      const { studentId, amountPaise, reason } = parsed.data;

      try {
        const txn = await withTenantContext(user.tenantId, async (tx) => {
          const [s] = await tx.select().from(students)
            .where(and(eq(students.id, studentId), eq(students.tenantId, user.tenantId)));
          if (!s) throw new Error('Student not found');

          const [transaction] = await tx.insert(feeTransactions).values({
            tenantId: user.tenantId,
            studentId,
            feeHead: `Concession: ${reason}`,
            amountPaise: -Math.abs(amountPaise), // Append-only negative amount
            paymentStatus: 'CAPTURED',
            paymentMode: 'CONCESSION',
            auditMetadata: { approvedBy: user.sub, reason },
          }).returning();

          return transaction;
        });

        fastify.log.info({ action: 'FEE_CONCESSION_GRANTED', transactionId: txn.id, by: user.sub }, 'audit');
        return reply.status(201).send({ success: true, data: txn });
      } catch (err: any) {
        return reply.status(500).send({ success: false, error: err.message });
      }
    }
  );
}
