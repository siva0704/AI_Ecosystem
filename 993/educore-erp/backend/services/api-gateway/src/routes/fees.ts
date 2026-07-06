/**
 * EduCore API — Fee Routes
 * CRITICAL LAWS (CONTEXT.md §1):
 *   - Amount comes from SERVER-SIDE fee structure only — never from client payload
 *   - No AI-generated arithmetic
 *   - Transactions are APPEND-ONLY — no UPDATE/DELETE paths exist
 * RBAC: Accountant — full access. Student/Parent — own records only.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard } from '../middleware/guards';
import { queryFeeTransactions, appendFeeTransaction, STUDENTS } from '../db/mock-db';
import { InitiateFeePaymentSchema } from '../schemas/validation';
import { Role } from '../db/demo-users';

// ⚠️ FEE STRUCTURES — Hand-coded, deterministic. NEVER AI-generated. CONTEXT.md §1.1
// In production these come from the fee_structures table, NOT from client payloads.
const FEE_STRUCTURES: Record<string, { amount_paise: number; description: string }> = {
  'annual-tuition':  { amount_paise: 1250000, description: 'Annual Tuition Fee (₹12,500)' },
  'term-q1':        { amount_paise:  820000,  description: 'Term Fee Q1 (₹8,200)' },
  'hostel-annual':  { amount_paise: 1500000, description: 'Annual Hostel Fee (₹15,000)' },
  'transport-term': { amount_paise:  350000,  description: 'Term Transport Fee (₹3,500)' },
  'library':        { amount_paise:   50000,  description: 'Annual Library Fee (₹500)' },
};

export async function feeRoutes(fastify: FastifyInstance) {
  // GET /api/fees — Accountant sees all; Student/Parent see their own
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { studentId } = request.query as { studentId?: string };

      let resolvedStudentId: string | undefined = studentId;

      // Students and parents can only see their own fees
      if (user.tier >= 4) {
        const ownStudent = STUDENTS.find(
          (s) => s.id === user.sub || s.parent_email === user.email
        );
        resolvedStudentId = ownStudent?.id;
      }

      const transactions = queryFeeTransactions(user.tenantId, resolvedStudentId);

      // Convert paise to rupees for display (display only — internal always paise)
      const formatted = transactions.map((t) => ({
        ...t,
        amount_rupees: (t.amount_paise / 100).toFixed(2),
        amount_display: `₹${(t.amount_paise / 100).toLocaleString('en-IN')}`,
      }));

      return reply.send({
        success: true,
        data: formatted,
        meta: {
          total_collected_paise: transactions
            .filter((t) => t.payment_status === 'CAPTURED')
            .reduce((sum, t) => sum + t.amount_paise, 0),
          pending_count: transactions.filter((t) => t.payment_status === 'PENDING').length,
        },
      });
    }
  );

  // GET /api/fees/structures — available fee heads (server-defined, not client-mutable)
  fastify.get(
    '/structures',
    { onRequest: [fastify.authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ success: true, data: FEE_STRUCTURES });
    }
  );

  // POST /api/fees/initiate — ACCOUNTANT only — initiates payment
  // Amount is taken from server-side FEE_STRUCTURES — NEVER from client
  fastify.post(
    '/initiate',
    { onRequest: [fastify.authenticate, rbacGuard(['ACCOUNTANT'] as Role[])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const parsed = InitiateFeePaymentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      const { studentId, feeHeadId, paymentMode, notes } = parsed.data;

      // Verify student exists in this tenant
      const student = STUDENTS.find((s) => s.id === studentId && s.tenant_id === user.tenantId);
      if (!student) {
        return reply.status(404).send({ success: false, error: 'Student not found in this institution' });
      }

      // ⚠️ Amount comes from server — client cannot specify amount (prevents tampering)
      const feeStructure = FEE_STRUCTURES[feeHeadId];
      if (!feeStructure) {
        return reply.status(400).send({ success: false, error: `Unknown fee head: ${feeHeadId}` });
      }

      // Append-only — creates a new PENDING transaction
      const transaction = appendFeeTransaction({
        tenant_id: user.tenantId,
        student_id: studentId,
        fee_head: feeStructure.description,
        amount_paise: feeStructure.amount_paise, // Server-defined only
        currency: 'INR',
        payment_status: 'PENDING',
        payment_mode: paymentMode,
      });

      fastify.log.info({
        action: 'FEE_PAYMENT_INITIATED',
        transactionId: transaction.id,
        studentId,
        amountPaise: feeStructure.amount_paise,
        by: user.sub,
      }, 'audit');

      return reply.status(201).send({
        success: true,
        data: transaction,
        message: `Payment of ₹${(feeStructure.amount_paise / 100).toLocaleString('en-IN')} initiated`,
      });
    }
  );
}
