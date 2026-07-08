/**
 * EduCore API — Library Routes
 * RBAC: Librarian manages books and transactions. Students view their own.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rbacGuard } from '../middleware/guards';
import { IssueBookSchema } from '../schemas/validation';
import { Role } from '../db/demo-users';
import { db, withTenantContext } from '../db/connection';
import { libraryBooks, libraryTransactions, students, users } from '../db/schema';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';

export async function libraryRoutes(fastify: FastifyInstance) {
  // GET /api/library/books
  fastify.get(
    '/books',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { search } = request.query as { search?: string };
      
      const books = await withTenantContext(user.tenantId, async (tx) => {
        let condition = eq(libraryBooks.tenantId, user.tenantId);
        if (search) {
          condition = and(condition, ilike(libraryBooks.title, `%${search}%`)) as any;
        }
        return await tx.select().from(libraryBooks).where(condition).orderBy(libraryBooks.title);
      });

      return reply.send({ success: true, data: books, count: books.length });
    }
  );

  // GET /api/library/transactions
  fastify.get(
    '/transactions',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const transactions = await withTenantContext(user.tenantId, async (tx) => {
        let condition = eq(libraryTransactions.tenantId, user.tenantId);
        if (user.tier >= 4) {
          condition = and(condition, eq(libraryTransactions.studentId, user.sub)) as any;
        }

        const data = await tx.select({
          id: libraryTransactions.id,
          bookId: libraryTransactions.bookId,
          studentId: libraryTransactions.studentId,
          issuedAt: libraryTransactions.issuedAt,
          dueDate: libraryTransactions.dueDate,
          returnedAt: libraryTransactions.returnedAt,
          status: libraryTransactions.status,
          bookTitle: libraryBooks.title,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          rollNumber: students.rollNumber,
        }).from(libraryTransactions)
          .innerJoin(libraryBooks, eq(libraryTransactions.bookId, libraryBooks.id))
          .innerJoin(students, eq(libraryTransactions.studentId, students.id))
          .where(condition)
          .orderBy(desc(libraryTransactions.issuedAt));
          
        return data;
      });

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

      try {
        const txn = await withTenantContext(user.tenantId, async (tx) => {
          // Verify book exists and has available copies
          const [book] = await tx.select().from(libraryBooks)
            .where(and(eq(libraryBooks.id, bookId), eq(libraryBooks.tenantId, user.tenantId)));
            
          if (!book) throw new Error('Book not found');
          if (book.availableCopies <= 0) throw new Error('No copies available');

          // Decrement available copies
          await tx.update(libraryBooks)
            .set({ availableCopies: book.availableCopies - 1 })
            .where(eq(libraryBooks.id, bookId));

          // Insert transaction
          const [t] = await tx.insert(libraryTransactions).values({
            tenantId: user.tenantId,
            bookId,
            studentId,
            dueDate,
            issuedBy: user.sub,
            status: 'ISSUED',
          }).returning();

          return t;
        });

        fastify.log.info({ action: 'BOOK_ISSUED', bookId, studentId, by: user.sub }, 'audit');
        return reply.status(201).send({ success: true, data: txn, message: 'Book issued successfully' });
      } catch (err: any) {
        if (err.message === 'Book not found') return reply.status(404).send({ success: false, error: err.message });
        if (err.message === 'No copies available') return reply.status(409).send({ success: false, error: err.message });
        return reply.status(500).send({ success: false, error: 'Internal server error' });
      }
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
        const txn = await withTenantContext(user.tenantId, async (tx) => {
          const [t] = await tx.select().from(libraryTransactions)
            .where(and(eq(libraryTransactions.id, txnId), eq(libraryTransactions.tenantId, user.tenantId)));
            
          if (!t) throw new Error('Transaction not found');
          if (t.status === 'RETURNED') throw new Error('Book is already returned');

          // Mark returned
          const [updated] = await tx.update(libraryTransactions)
            .set({ status: 'RETURNED', returnedAt: new Date() })
            .where(eq(libraryTransactions.id, txnId))
            .returning();

          // Increment available copies
          await tx.update(libraryBooks)
            .set({ availableCopies: sql`${libraryBooks.availableCopies} + 1` })
            .where(eq(libraryBooks.id, t.bookId));

          return updated;
        });

        fastify.log.info({ action: 'BOOK_RETURNED', txnId, by: user.sub }, 'audit');
        return reply.send({ success: true, data: txn, message: 'Book returned successfully' });
      } catch (err: any) {
        if (err.message === 'Transaction not found') return reply.status(404).send({ success: false, error: err.message });
        if (err.message === 'Book is already returned') return reply.status(400).send({ success: false, error: err.message });
        return reply.status(500).send({ success: false, error: 'Internal server error' });
      }
    }
  );
}
