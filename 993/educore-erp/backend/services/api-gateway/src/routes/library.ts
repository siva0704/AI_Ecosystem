/**
 * EduCore API — Library Routes
 * RBAC: Librarian manages books and transactions. Students view their own.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard } from '../middleware/guards';
import { queryLibraryBooks, LIBRARY_TRANSACTIONS, LIBRARY_BOOKS } from '../db/mock-db';
import { IssueBookSchema } from '../schemas/validation';
import { Role } from '../db/demo-users';

export async function libraryRoutes(fastify: FastifyInstance) {
  // GET /api/library/books
  fastify.get(
    '/books',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { search } = request.query as { search?: string };
      const books = queryLibraryBooks(user.tenantId, search);
      return reply.send({ success: true, data: books, count: books.length });
    }
  );

  // GET /api/library/transactions
  fastify.get(
    '/transactions',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      let transactions = LIBRARY_TRANSACTIONS.filter((t) => t.tenant_id === user.tenantId);

      // Students see only their own
      if (user.tier >= 4) {
        transactions = transactions.filter((t) => t.student_id === user.sub);
      }

      return reply.send({ success: true, data: transactions });
    }
  );

  // POST /api/library/issue — Librarian only
  fastify.post(
    '/issue',
    { onRequest: [fastify.authenticate, rbacGuard(['LIBRARIAN'] as Role[])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const parsed = IssueBookSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      }

      const { bookId, studentId, dueDate } = parsed.data;
      const book = LIBRARY_BOOKS.find((b) => b.id === bookId && b.tenant_id === user.tenantId);
      if (!book) return reply.status(404).send({ success: false, error: 'Book not found' });
      if (book.available_copies <= 0) return reply.status(409).send({ success: false, error: 'No copies available' });

      book.available_copies -= 1;
      const txn = { id: `ltx-${Date.now()}`, tenant_id: user.tenantId, book_id: bookId, student_id: studentId, issued_by: user.sub, issued_at: new Date().toISOString(), due_date: dueDate, status: 'ISSUED' as const };
      LIBRARY_TRANSACTIONS.push(txn);

      return reply.status(201).send({ success: true, data: txn, message: 'Book issued successfully' });
    }
  );

  // PATCH /api/library/return/:txnId — Librarian only
  fastify.patch(
    '/return/:txnId',
    { onRequest: [fastify.authenticate, rbacGuard(['LIBRARIAN'] as Role[])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { txnId } = request.params as { txnId: string };

      const txn = LIBRARY_TRANSACTIONS.find((t) => t.id === txnId && t.tenant_id === user.tenantId);
      if (!txn) return reply.status(404).send({ success: false, error: 'Transaction not found' });
      if (txn.status === 'RETURNED') return reply.status(409).send({ success: false, error: 'Book already returned' });

      txn.returned_at = new Date().toISOString();
      txn.status = 'RETURNED';

      const book = LIBRARY_BOOKS.find((b) => b.id === txn.book_id && b.tenant_id === user.tenantId);
      if (book) book.available_copies += 1;

      return reply.send({ success: true, data: txn, message: 'Book returned successfully' });
    }
  );
}
