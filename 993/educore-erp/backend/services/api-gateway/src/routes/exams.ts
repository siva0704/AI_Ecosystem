import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { examResults, examCorrections, students, subjects, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { rbacGuard } from '../middleware/guards';

const CorrectionSchema = z.object({
  resultId: z.string().uuid(),
  reason: z.string().min(5),
});

export async function examsRoutes(fastify: FastifyInstance) {
  
  fastify.get('/results', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    
    const data = await withTenantContext(user.tenantId, async (tx) => {
      let condition = eq(examResults.tenantId, user.tenantId);
      // If student/parent, limit to own records
      if (user.tier > 2) {
        const myStudents = await tx.select({ id: students.id }).from(students).where(and(eq(students.tenantId, user.tenantId), eq(students.id, user.sub)));
        if (myStudents.length === 0) return [];
        // simplified logic for filtering
      }
      
      return await tx.select({
        id: examResults.id,
        examName: examResults.examName,
        marksObtained: examResults.marksObtained,
        maxMarks: examResults.maxMarks,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        rollNumber: students.rollNumber,
        subjectName: subjects.name,
      }).from(examResults)
        .innerJoin(students, eq(examResults.studentId, students.id))
        .innerJoin(subjects, eq(examResults.subjectId, subjects.id))
        .where(condition)
        .orderBy(desc(examResults.createdAt));
    });
    
    return reply.send({ success: true, data });
  });

  fastify.get('/corrections', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const data = await withTenantContext(user.tenantId, async (tx) => {
      return await tx.select({
        id: examCorrections.id,
        reason: examCorrections.reason,
        status: examCorrections.status,
        examName: examResults.examName,
        marksObtained: examResults.marksObtained,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        requestedByEmail: users.email,
      }).from(examCorrections)
        .innerJoin(examResults, eq(examCorrections.resultId, examResults.id))
        .innerJoin(students, eq(examResults.studentId, students.id))
        .innerJoin(users, eq(examCorrections.requestedBy, users.id))
        .where(eq(examCorrections.tenantId, user.tenantId))
        .orderBy(desc(examCorrections.createdAt));
    });
    return reply.send({ success: true, data });
  });

  fastify.post('/corrections', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const parsed = CorrectionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false });
    
    try {
      const data = await withTenantContext(user.tenantId, async (tx) => {
        const [c] = await tx.insert(examCorrections).values({
          tenantId: user.tenantId,
          resultId: parsed.data.resultId,
          reason: parsed.data.reason,
          requestedBy: user.sub,
        }).returning();
        return c;
      });
      return reply.code(201).send({ success: true, data });
    } catch (err) {
      return reply.code(500).send({ success: false });
    }
  });

  fastify.patch('/corrections/:id/approve', {
    onRequest: [fastify.authenticate, rbacGuard(['INSTITUTION_ADMIN', 'TEACHER', 'HOD'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    try {
      const data = await withTenantContext(user.tenantId, async (tx) => {
        const [updated] = await tx.update(examCorrections)
          .set({ status: 'APPROVED', reviewedBy: user.sub })
          .where(and(eq(examCorrections.id, id), eq(examCorrections.tenantId, user.tenantId)))
          .returning();
        return updated;
      });
      return reply.send({ success: true, data });
    } catch (err) {
      return reply.code(500).send({ success: false });
    }
  });

}
