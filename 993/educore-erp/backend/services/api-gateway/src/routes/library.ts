/**
 * EduCore API — Library Routes
 * RBAC: Librarian manages books and transactions. Students view their own.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard } from '../middleware/guards';
import { queryLibraryBooks, queryLibraryTransactions, issueBook, returnBook } from '../db/mock-db';
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
      const books = await queryLibraryBooks(user.tenantId, search);
      return reply.send({ success: true, data: books, count: books.length });
    }
  );

  // GET /api/library/transactions
  fastify.get(
    '/transactions',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      let transactions = await queryLibraryTransactions(user.tenantId);

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

      // Verify book has available copies
      const books = await queryLibraryBooks(user.tenantId);
      const book = books.find((b) => b.id === bookId);
      if (!book) return reply.status(404).send({ success: false, error: 'Book not found' });
      if (book.available_copies <= 0) return reply.status(409).send({ success: false, error: 'No copies available' });

      const txn = await issueBook(user.tenantId, bookId, studentId, dueDate, user.sub);

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

      try {
        const txn = await returnBook(user.tenantId, txnId);
        return reply.send({ success: true, data: txn, message: 'Book returned successfully' });
      } catch (err: any) {
        return reply.status(404).send({ success: false, error: err.message || 'Transaction not found' });
      }
    }
  );
}
