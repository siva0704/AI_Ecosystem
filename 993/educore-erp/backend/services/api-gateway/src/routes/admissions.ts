import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplyBody {
  // Student
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  applyingForGrade: string;
  previousSchool?: string;
  previousGrade?: string;
  // Parent
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentRelation?: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  // Address
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  // Preferences
  hostelRequested?: boolean;
  preferredRoomType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE';
  transportRequested?: boolean;
  preferredArea?: string;
  specialNeeds?: string;
  additionalNotes?: string;
  // Meta
  source?: 'ONLINE' | 'WALK_IN';
  subdomain?: string;  // tenant subdomain — defaults to 'demo'
}

interface DocUpdateBody {
  docType: string;
  status: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  storageKey?: string;
  rejectionNote?: string;
}

interface ReviewBody {
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

// ─── Helper: generate APP-XXXXXX ─────────────────────────────────────────────
function generateAppCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = 'APP-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Helper: get tenant id by subdomain (bypasses RLS — platform-level) ─────
async function getTenantIdBySubdomain(subdomain: string): Promise<string | null> {
  const result = await db.execute<{ tenant_id: string }>(
    sql`SELECT tenant_id FROM tenants WHERE domain_name = ${subdomain} AND is_active = TRUE LIMIT 1`
  );
  return result.rows[0]?.tenant_id ?? null;
}

// ─── Helper: set tenant context ───────────────────────────────────────────────
// We use withTenantContext from connection.ts instead.

// ─── Required documents for every application ────────────────────────────────
const REQUIRED_DOCS = ['MARK_SHEET', 'TRANSFER_CERT', 'ID_PROOF', 'PHOTO'];

export async function admissionsRoutes(fastify: FastifyInstance) {

  // ─── POST /api/admissions/apply (PUBLIC — no JWT required) ───────────────
  fastify.post<{ Body: ApplyBody }>(
    '/apply',
    {
      schema: {
        body: {
          type: 'object',
          required: ['studentFirstName', 'studentLastName', 'dateOfBirth', 'gender',
                     'applyingForGrade', 'parentName', 'parentEmail', 'parentPhone'],
          properties: {
            studentFirstName: { type: 'string', minLength: 1 },
            studentLastName:  { type: 'string', minLength: 1 },
            dateOfBirth:      { type: 'string' },
            gender:           { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
            applyingForGrade: { type: 'string' },
            previousSchool:   { type: 'string' },
            previousGrade:    { type: 'string' },
            parentName:       { type: 'string', minLength: 1 },
            parentEmail:      { type: 'string', format: 'email' },
            parentPhone:      { type: 'string', minLength: 6 },
            parentRelation:   { type: 'string', enum: ['FATHER', 'MOTHER', 'GUARDIAN'] },
            street:           { type: 'string' },
            city:             { type: 'string' },
            state:            { type: 'string' },
            pincode:          { type: 'string' },
            hostelRequested:  { type: 'boolean' },
            preferredRoomType:{ type: 'string', enum: ['SINGLE', 'DOUBLE', 'TRIPLE'] },
            transportRequested:{ type: 'boolean' },
            preferredArea:    { type: 'string' },
            specialNeeds:     { type: 'string' },
            additionalNotes:  { type: 'string' },
            source:           { type: 'string', enum: ['ONLINE', 'WALK_IN'] },
            subdomain:        { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ApplyBody }>, reply: FastifyReply) => {
      const body = request.body;
      const subdomain = body.subdomain || 'demo';

      // Resolve tenant
      const tenantId = await getTenantIdBySubdomain(subdomain);
      if (!tenantId) {
        return reply.status(400).send({ success: false, error: 'Invalid institution subdomain' });
      }

      const { applicationId, appCode: finalAppCode } = await withTenantContext(tenantId, async (tx) => {
        let code = generateAppCode();
        let attempts = 0;
        while (attempts < 5) {
          const existing = await tx.execute<{ app_code: string }>(
            sql`SELECT app_code FROM admission_applications WHERE app_code = ${code} LIMIT 1`
          );
          if (existing.rows.length === 0) break;
          code = generateAppCode();
          attempts++;
        }

        const address = JSON.stringify({
          street: body.street || '',
          city: body.city || '',
          state: body.state || '',
          pincode: body.pincode || '',
        });

        const appResult = await tx.execute<{ application_id: string }>(sql`
          INSERT INTO admission_applications (
            app_code, tenant_id,
            student_first_name, student_last_name, date_of_birth, gender,
            applying_for_grade, previous_school, previous_grade,
            parent_name, parent_email, parent_phone, parent_relation,
            address, source, status
          ) VALUES (
            ${code}, ${tenantId},
            ${body.studentFirstName}, ${body.studentLastName}, ${body.dateOfBirth}, ${body.gender},
            ${body.applyingForGrade}, ${body.previousSchool || null}, ${body.previousGrade || null},
            ${body.parentName}, ${body.parentEmail}, ${body.parentPhone}, ${body.parentRelation || 'FATHER'},
            ${address}::jsonb, ${body.source || 'ONLINE'}, 'SUBMITTED'
          ) RETURNING application_id
        `);

        const appId = appResult.rows[0].application_id;

        for (const docType of REQUIRED_DOCS) {
          await tx.execute(sql`
            INSERT INTO admission_documents (tenant_id, application_id, doc_type, status)
            VALUES (${tenantId}, ${appId}, ${docType}, 'PENDING')
          `);
        }

        await tx.execute(sql`
          INSERT INTO admission_preferences (
            tenant_id, application_id,
            hostel_requested, preferred_room_type,
            transport_requested, preferred_area,
            special_needs, additional_notes
          ) VALUES (
            ${tenantId}, ${appId},
            ${body.hostelRequested || false}, ${body.preferredRoomType || null},
            ${body.transportRequested || false}, ${body.preferredArea || null},
            ${body.specialNeeds || null}, ${body.additionalNotes || null}
          )
        `);

        await tx.execute(sql`
          UPDATE admission_applications SET status = 'PENDING_DOCS', updated_at = NOW()
          WHERE application_id = ${appId}
        `);

        return { applicationId: appId, appCode: code };
      });

      return reply.status(201).send({
        success: true,
        appCode: finalAppCode,
        applicationId,
        message: 'Application submitted successfully. Please track your status using your Application Code.',
        statusUrl: `/admissions/status?id=${finalAppCode}`,
      });
    }
  );

  // ─── GET /api/admissions/status/:appCode (PUBLIC — no JWT) ───────────────
  fastify.get<{ Params: { appCode: string } }>(
    '/status/:appCode',
    async (request, reply) => {
      const { appCode } = request.params;

      const appResult = await db.execute<{
        application_id: string; app_code: string; tenant_id: string;
        student_first_name: string; student_last_name: string;
        applying_for_grade: string; parent_name: string; parent_email: string;
        status: string; submitted_at: string; updated_at: string;
        hostel_requested: boolean; transport_requested: boolean;
      }>(sql`
        SELECT a.application_id, a.app_code, a.tenant_id,
               a.student_first_name, a.student_last_name,
               a.applying_for_grade, a.parent_name, a.parent_email,
               a.status, a.submitted_at, a.updated_at,
               p.hostel_requested, p.transport_requested
        FROM admission_applications a
        LEFT JOIN admission_preferences p ON p.application_id = a.application_id
        WHERE a.app_code = ${appCode.toUpperCase()}
        LIMIT 1
      `);

      if (!appResult.rows[0]) {
        return reply.status(404).send({ success: false, error: 'Application not found' });
      }

      const app = appResult.rows[0];

      // Get documents status
      const docsResult = await db.execute<{
        doc_type: string; status: string; file_name: string | null;
      }>(sql`
        SELECT doc_type, status, file_name
        FROM admission_documents
        WHERE application_id = ${app.application_id}
        ORDER BY doc_type
      `);

      const statusTimeline = getStatusTimeline(app.status);

      return reply.send({
        success: true,
        application: {
          appCode: app.app_code,
          studentName: `${app.student_first_name} ${app.student_last_name}`,
          applyingForGrade: app.applying_for_grade,
          parentName: app.parent_name,
          status: app.status,
          submittedAt: app.submitted_at,
          updatedAt: app.updated_at,
          hostelRequested: app.hostel_requested,
          transportRequested: app.transport_requested,
          documents: docsResult.rows,
          timeline: statusTimeline,
        },
      });
    }
  );

  // ─── GET /api/admissions (JWT required — ADMIN/PRINCIPAL) ────────────────
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: any, reply: FastifyReply) => {
      const { tenantId } = request.user;
      const { status, grade, search, page = 1, limit = 20 } = request.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      const { rows, countResult } = await withTenantContext(tenantId, async (tx) => {
        let query = sql`
          SELECT a.application_id, a.app_code,
                 a.student_first_name, a.student_last_name,
                 a.applying_for_grade, a.parent_name, a.parent_email, a.parent_phone,
                 a.status, a.source, a.submitted_at, a.updated_at,
                 p.hostel_requested, p.transport_requested,
                 (SELECT COUNT(*) FROM admission_documents d
                  WHERE d.application_id = a.application_id AND d.status = 'PENDING') AS pending_docs
          FROM admission_applications a
          LEFT JOIN admission_preferences p ON p.application_id = a.application_id
          WHERE a.tenant_id = ${tenantId}
        `;

        if (status) query = sql`${query} AND a.status = ${status}`;
        if (grade) query = sql`${query} AND a.applying_for_grade = ${grade}`;
        if (search) query = sql`${query} AND (
          a.student_first_name ILIKE ${'%' + search + '%'} OR
          a.student_last_name ILIKE ${'%' + search + '%'} OR
          a.app_code ILIKE ${'%' + search + '%'} OR
          a.parent_email ILIKE ${'%' + search + '%'}
        )`;

        query = sql`${query} ORDER BY a.submitted_at DESC LIMIT ${Number(limit)} OFFSET ${offset}`;

        const countQ = sql`SELECT COUNT(*) FROM admission_applications WHERE tenant_id = ${tenantId}${status ? sql` AND status = ${status}` : sql``}`;

        const [r, c] = await Promise.all([
          tx.execute(query),
          tx.execute<{ count: string }>(countQ),
        ]);
        return { rows: r, countResult: c };
      });

      return reply.send({
        success: true,
        data: rows.rows,
        pagination: {
          total: Number(countResult.rows[0]?.count ?? 0),
          page: Number(page),
          limit: Number(limit),
        },
      });
    }
  );

  // ─── GET /api/admissions/:id (JWT — ADMIN/PRINCIPAL) ─────────────────────
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request: any, reply: FastifyReply) => {
      const { tenantId } = request.user;
      const { id } = request.params;

      const { appResult, docsResult, prefsResult } = await withTenantContext(tenantId, async (tx) => {
        const [a, d, p] = await Promise.all([
          tx.execute<any>(sql`
            SELECT a.*, t.display_name AS tenant_name
            FROM admission_applications a
            JOIN tenants t ON t.tenant_id = a.tenant_id
            WHERE a.application_id = ${id} AND a.tenant_id = ${tenantId}
            LIMIT 1
          `),
          tx.execute<any>(sql`
            SELECT * FROM admission_documents
            WHERE application_id = ${id}
            ORDER BY doc_type
          `),
          tx.execute<any>(sql`
            SELECT * FROM admission_preferences
            WHERE application_id = ${id}
            LIMIT 1
          `),
        ]);
        return { appResult: a, docsResult: d, prefsResult: p };
      });

      if (!appResult.rows[0]) {
        return reply.status(404).send({ success: false, error: 'Application not found' });
      }

      return reply.send({
        success: true,
        data: {
          ...appResult.rows[0],
          documents: docsResult.rows,
          preferences: prefsResult.rows[0] ?? null,
          timeline: getStatusTimeline(appResult.rows[0].status),
        },
      });
    }
  );

  // ─── PATCH /api/admissions/:id/review (JWT — ADMIN/PRINCIPAL) ────────────
  fastify.patch<{ Params: { id: string }; Body: ReviewBody }>(
    '/:id/review',
    { onRequest: [fastify.authenticate] },
    async (request: any, reply: FastifyReply) => {
      const { tenantId, sub: userId } = request.user;
      const { id } = request.params;
      const { action, reason } = request.body;

      if (!['APPROVE', 'REJECT'].includes(action)) {
        return reply.status(400).send({ success: false, error: 'action must be APPROVE or REJECT' });
      }

      const result = await withTenantContext(tenantId, async (tx) => {
        const existing = await tx.execute<{ status: string; student_first_name: string; student_last_name: string; date_of_birth: string; gender: string; applying_for_grade: string; parent_email: string }>(sql`
          SELECT status, student_first_name, student_last_name, date_of_birth, gender,
                 applying_for_grade, parent_email
          FROM admission_applications
          WHERE application_id = ${id} AND tenant_id = ${tenantId}
          LIMIT 1
        `);

        if (!existing.rows[0]) return { error: 'Application not found' };

        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        await tx.execute(sql`
          UPDATE admission_applications
          SET status = ${newStatus},
              reviewed_by = ${userId}::uuid,
              reviewed_at = NOW(),
              rejection_reason = ${reason || null},
              updated_at = NOW()
          WHERE application_id = ${id} AND tenant_id = ${tenantId}
        `);

        if (action === 'APPROVE') {
          const app = existing.rows[0];
          const studentId = crypto.randomUUID();

          const classResult = await tx.execute<{ class_id: string }>(sql`
            SELECT class_id FROM classes
            WHERE tenant_id = ${tenantId} AND grade = ${app.applying_for_grade}
            LIMIT 1
          `);
          const classId = classResult.rows[0]?.class_id;

          if (classId) {
            const rollNumber = `ADM-${new Date().getFullYear()}-${studentId.slice(-4).toUpperCase()}`;

            await tx.execute(sql`
              INSERT INTO students (
                student_id, tenant_id, first_name, last_name,
                date_of_birth, gender, class_id, roll_number,
                parent_email, academic_year
              ) VALUES (
                ${studentId}::uuid, ${tenantId},
                ${app.student_first_name}, ${app.student_last_name},
                ${app.date_of_birth}, ${app.gender}, ${classId}::uuid,
                ${rollNumber}, ${app.parent_email}, '2026-27'
              )
              ON CONFLICT (tenant_id, class_id, roll_number) DO NOTHING
            `);

            await tx.execute(sql`
              UPDATE admission_applications
              SET student_id = ${studentId}::uuid, status = 'COMPLETED', updated_at = NOW()
              WHERE application_id = ${id}
            `);
          }
        }

        return { success: true, newStatus };
      });

      if (result.error) return reply.status(404).send({ success: false, error: result.error });

      return reply.send({
        success: true,
        message: action === 'APPROVE'
          ? 'Application approved and student record created.'
          : 'Application rejected.',
        status: result.newStatus,
      });
    }
  );

  // ─── PATCH /api/admissions/:id/documents (JWT — ADMIN) ───────────────────
  fastify.patch<{ Params: { id: string }; Body: DocUpdateBody }>(
    '/:id/documents',
    { onRequest: [fastify.authenticate] },
    async (request: any, reply: FastifyReply) => {
      const { tenantId, sub: userId } = request.user;
      const { id } = request.params;
      const { docType, status, fileName, fileSizeBytes, mimeType, storageKey, rejectionNote } = request.body;

      await withTenantContext(tenantId, async (tx) => {
        await tx.execute(sql`
          UPDATE admission_documents
          SET status = ${status},
              file_name = ${fileName || null},
              file_size_bytes = ${fileSizeBytes || null},
              mime_type = ${mimeType || null},
              storage_key = ${storageKey || null},
              rejection_note = ${rejectionNote || null},
              verified_by = ${status === 'VERIFIED' ? userId + '::uuid' : null},
              verified_at = ${status === 'VERIFIED' ? sql`NOW()` : null},
              updated_at = NOW()
          WHERE application_id = ${id}
            AND doc_type = ${docType}
            AND tenant_id = ${tenantId}
        `);

        const docsStatus = await tx.execute<{ status: string }>(sql`
          SELECT status FROM admission_documents
          WHERE application_id = ${id}
            AND doc_type = ANY(ARRAY['MARK_SHEET','TRANSFER_CERT','ID_PROOF','PHOTO'])
        `);

        const allReceived = docsStatus.rows.every(d => d.status !== 'PENDING');
        if (allReceived) {
          await tx.execute(sql`
            UPDATE admission_applications
            SET status = 'DOCS_RECEIVED', updated_at = NOW()
            WHERE application_id = ${id}
              AND status = 'PENDING_DOCS'
              AND tenant_id = ${tenantId}
          `);
        }
      });

      return reply.send({ success: true, message: 'Document status updated' });
    }
  );

  // ─── POST /api/admissions/admin/new (JWT — ADMIN walk-in entry) ──────────
  fastify.post<{ Body: ApplyBody }>(
    '/admin/new',
    { onRequest: [fastify.authenticate] },
    async (request: any, reply: FastifyReply) => {
      // Reuse the same logic as public apply, but force source = WALK_IN
      // and use the admin's tenant context directly
      request.body.source = 'WALK_IN';
      request.body.subdomain = request.user.subdomain;

      // Re-route to apply handler logic inline
      const body: ApplyBody = request.body;
      const tenantId = request.user.tenantId;

      const { applicationId, appCode: finalAppCode } = await withTenantContext(tenantId, async (tx) => {
        let code = generateAppCode();
        let attempts = 0;
        while (attempts < 5) {
          const existing = await tx.execute<{ app_code: string }>(
            sql`SELECT app_code FROM admission_applications WHERE app_code = ${code} LIMIT 1`
          );
          if (existing.rows.length === 0) break;
          code = generateAppCode();
          attempts++;
        }

        const address = JSON.stringify({
          street: body.street || '', city: body.city || '',
          state: body.state || '', pincode: body.pincode || '',
        });

        const appResult = await tx.execute<{ application_id: string }>(sql`
          INSERT INTO admission_applications (
            app_code, tenant_id,
            student_first_name, student_last_name, date_of_birth, gender,
            applying_for_grade, previous_school, previous_grade,
            parent_name, parent_email, parent_phone, parent_relation,
            address, source, status
          ) VALUES (
            ${code}, ${tenantId},
            ${body.studentFirstName}, ${body.studentLastName}, ${body.dateOfBirth}, ${body.gender},
            ${body.applyingForGrade}, ${body.previousSchool || null}, ${body.previousGrade || null},
            ${body.parentName}, ${body.parentEmail}, ${body.parentPhone}, ${body.parentRelation || 'FATHER'},
            ${address}::jsonb, 'WALK_IN', 'SUBMITTED'
          ) RETURNING application_id
        `);

        const appId = appResult.rows[0].application_id;

        for (const docType of REQUIRED_DOCS) {
          await tx.execute(sql`
            INSERT INTO admission_documents (tenant_id, application_id, doc_type, status)
            VALUES (${tenantId}, ${appId}, ${docType}, 'PENDING')
          `);
        }

        await tx.execute(sql`
          INSERT INTO admission_preferences (
            tenant_id, application_id, hostel_requested, transport_requested
          ) VALUES (${tenantId}, ${appId}, ${body.hostelRequested || false}, ${body.transportRequested || false})
        `);

        await tx.execute(sql`
          UPDATE admission_applications SET status = 'PENDING_DOCS', updated_at = NOW()
          WHERE application_id = ${appId}
        `);

        return { applicationId: appId, appCode: code };
      });

      return reply.status(201).send({
        success: true,
        appCode: finalAppCode,
        applicationId,
        message: 'Walk-in application created successfully.',
      });
    }
  );
}

// ─── Helper: build status timeline ───────────────────────────────────────────
function getStatusTimeline(currentStatus: string) {
  const steps = [
    { key: 'SUBMITTED',     label: 'Application Submitted',  icon: '📋' },
    { key: 'PENDING_DOCS',  label: 'Documents Required',     icon: '📄' },
    { key: 'DOCS_RECEIVED', label: 'Documents Received',     icon: '✅' },
    { key: 'UNDER_REVIEW',  label: 'Under Review',           icon: '🔍' },
    { key: 'APPROVED',      label: 'Application Approved',   icon: '🎉' },
    { key: 'COMPLETED',     label: 'Enrollment Complete',    icon: '🏫' },
  ];

  const order = steps.map(s => s.key);
  const currentIdx = order.indexOf(currentStatus);

  return steps.map((step, idx) => ({
    ...step,
    status: currentStatus === 'REJECTED' && idx > 1
      ? 'SKIPPED'
      : idx < currentIdx ? 'DONE'
      : idx === currentIdx ? 'CURRENT'
      : 'PENDING',
  }));
}
