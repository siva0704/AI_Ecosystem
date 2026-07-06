import { sql, eq, and, or, like, desc } from 'drizzle-orm';
import { db, withTenantContext } from './connection';
import * as schema from './schema';

// ─── Short ID <-> UUID Mapper Helpers ──────────────────────────────────────────
export function mapShortIdToUuid(shortId: string | null | undefined): string | null {
  if (!shortId) return null;
  if (shortId.length === 36) return shortId; // already a UUID

  const [type, numStr] = shortId.split('-');
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return null;

  const typeMap: Record<string, string> = {
    usr: '0000',
    stu: '0100',
    stf: '0200',
    bk:  '0300',
    rm:  '0400',
    bus: '0500',
    ftx: '0600',
    att: '0700',
  };

  const block = typeMap[type] || '9999';
  const paddedNum = String(num).padStart(12, '0');
  return `00000000-0000-0000-${block}-${paddedNum}`;
}

export function mapUuidToShortId(uuidStr: string | null | undefined): string | null {
  if (!uuidStr || uuidStr.length !== 36) return null;

  const parts = uuidStr.split('-');
  if (parts.length < 5) return uuidStr;
  const block = parts[3];
  const numVal = parseInt(parts[4], 10);

  const blockMap: Record<string, string> = {
    '0000': 'usr',
    '0100': 'stu',
    '0200': 'stf',
    '0300': 'bk',
    '0400': 'rm',
    '0500': 'bus',
    '0600': 'ftx',
    '0700': 'att',
  };

  const prefix = blockMap[block];
  if (!prefix) return uuidStr;
  return `${prefix}-${String(numVal).padStart(3, '0')}`;
}

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface Student {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  grade: string;
  section: string;
  roll_number: string;
  parent_email?: string;
  parent_phone?: string;
  created_at: string;
  is_active: boolean;
}

export interface Staff {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  department?: string;
  date_of_joining: string;
  employee_id: string;
  dpdp_consent_given: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  tenant_id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  marked_by: string;
  note?: string;
  created_at: string;
}

export interface LibraryBook {
  id: string;
  tenant_id: string;
  isbn: string;
  title: string;
  author: string;
  total_copies: number;
  available_copies: number;
  category: string;
  created_at: string;
}

export interface LibraryTransaction {
  id: string;
  tenant_id: string;
  book_id: string;
  student_id: string;
  issued_by: string;
  issued_at: string;
  due_date: string;
  returned_at?: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
}

export interface FeeTransaction {
  id: string;
  tenant_id: string;
  student_id: string;
  fee_head: string;
  amount_paise: number;
  currency: 'INR';
  payment_status: 'PENDING' | 'INITIATED' | 'PROCESSING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  payment_mode: string;
  created_at: string;
}

// ─── Stateful In-Memory Mock Arrays (Fallbacks/Legacy references) ────────────
export const STUDENTS: Student[] = [];
export const STAFF_MEMBERS: Staff[] = [];
export const ATTENDANCE_RECORDS: AttendanceRecord[] = [];
export const LIBRARY_BOOKS: LibraryBook[] = [];
export const LIBRARY_TRANSACTIONS: LibraryTransaction[] = [];

// ─── Helper Runner for Async Syncing (Bridges old code that expected sync return) ───
// To support synchronous exports like queryStudents, we run queries asynchronously in background
// or return pre-fetched lists. But since Fastify handlers are async, we can rewrite the helpers to be async!
// Let's check: are helpers called inside routes as async/await?
// Yes, fastify handlers can handle async calls! Let's check routes/students.ts:
// `let students = queryStudents(user.tenantId, search);`
// Ah! In `students.ts`, it was called synchronously!
// Let's modify the route files to add `await` to all helper calls!
// Wait! Yes, since these database operations are now true asynchronous PostgreSQL operations, we MUST use `await`!
// Let's rewrite the db helpers to be async and modify the router handlers to `await` them.
// This is exactly what is needed for real database connectivity.

// ─── PostgreSQL Drizzle ORM Async CRUD Helpers ─────────────────────────────────

export async function queryStudents(tenantId: string, search?: string): Promise<Student[]> {
  return await withTenantContext(tenantId, async (tx) => {
    let query = tx.select().from(schema.students);
    const results = await query;

    let filtered = results;
    if (search) {
      const q = search.toLowerCase();
      filtered = results.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q)
      );
    }

    return filtered.map((s) => ({
      id: mapUuidToShortId(s.id)!,
      tenant_id: s.tenantId,
      first_name: s.firstName,
      last_name: s.lastName,
      date_of_birth: s.dateOfBirth,
      gender: s.gender as any,
      grade: s.grade,
      section: s.section,
      roll_number: s.rollNumber,
      parent_email: s.parentEmail || undefined,
      parent_phone: s.parentPhone || undefined,
      created_at: s.createdAt?.toISOString() || '',
      is_active: s.isActive || true,
    }));
  });
}

export async function queryStaff(tenantId: string, search?: string): Promise<Staff[]> {
  return await withTenantContext(tenantId, async (tx) => {
    const results = await tx.select().from(schema.staff);

    let filtered = results;
    if (search) {
      const q = search.toLowerCase();
      filtered = results.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    return filtered.map((s) => ({
      id: mapUuidToShortId(s.id)!,
      tenant_id: s.tenantId,
      first_name: s.firstName,
      last_name: s.lastName,
      email: s.email,
      phone: s.phone || '',
      role: s.role,
      department: s.department || undefined,
      date_of_joining: s.dateOfJoining,
      employee_id: s.employeeId,
      dpdp_consent_given: s.dpdpConsentGiven,
      is_active: s.isActive || true,
      created_at: s.createdAt?.toISOString() || '',
    }));
  });
}

export async function queryAttendance(
  tenantId: string,
  studentId?: string,
  date?: string
): Promise<AttendanceRecord[]> {
  return await withTenantContext(tenantId, async (tx) => {
    const results = await tx.select().from(schema.attendanceRecords);
    const mappedStuId = mapShortIdToUuid(studentId);

    const filtered = results.filter(
      (a) =>
        (!mappedStuId || a.studentId === mappedStuId) &&
        (!date || a.date === date)
    );

    return filtered.map((a) => ({
      id: mapUuidToShortId(a.id)!,
      tenant_id: a.tenantId,
      class_id: a.classId,
      student_id: mapUuidToShortId(a.studentId)!,
      date: a.date,
      status: a.status as any,
      marked_by: mapUuidToShortId(a.markedBy)!,
      note: a.note || undefined,
      created_at: a.createdAt?.toISOString() || '',
    }));
  });
}

export async function queryLibraryBooks(tenantId: string, search?: string): Promise<LibraryBook[]> {
  return await withTenantContext(tenantId, async (tx) => {
    const results = await tx.select().from(schema.libraryBooks);

    let filtered = results;
    if (search) {
      const q = search.toLowerCase();
      filtered = results.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.includes(q)
      );
    }

    return filtered.map((b) => ({
      id: mapUuidToShortId(b.id)!,
      tenant_id: b.tenantId,
      isbn: b.isbn,
      title: b.title,
      author: b.author,
      total_copies: b.totalCopies,
      available_copies: b.availableCopies,
      category: b.category,
      created_at: b.createdAt?.toISOString() || '',
    }));
  });
}

export async function queryFeeTransactions(tenantId: string, studentId?: string): Promise<FeeTransaction[]> {
  return await withTenantContext(tenantId, async (tx) => {
    const results = await tx.select().from(schema.feeTransactions);
    const mappedStuId = mapShortIdToUuid(studentId);

    const filtered = results.filter((f) => !mappedStuId || f.studentId === mappedStuId);

    return filtered.map((f) => ({
      id: mapUuidToShortId(f.id)!,
      tenant_id: f.tenantId,
      student_id: mapUuidToShortId(f.studentId)!,
      fee_head: f.feeHead,
      amount_paise: Number(f.amountPaise),
      currency: f.currency as any,
      payment_status: f.paymentStatus as any,
      payment_mode: f.paymentMode,
      created_at: f.createdAt?.toISOString() || '',
    }));
  });
}

// ─── APPEND / INSERT Operations (Stateful Database writes) ──────────────────────

export async function appendFeeTransaction(
  tenantId: string,
  tx: Omit<FeeTransaction, 'id' | 'created_at' | 'tenant_id'>
): Promise<FeeTransaction> {
  return await withTenantContext(tenantId, async (databaseTx) => {
    const mappedStuId = mapShortIdToUuid(tx.student_id)!;
    const [inserted] = await databaseTx
      .insert(schema.feeTransactions)
      .values({
        tenantId,
        studentId: mappedStuId,
        feeHead: tx.fee_head,
        amountPaise: tx.amount_paise,
        paymentStatus: tx.payment_status,
        paymentMode: tx.payment_mode,
      })
      .returning();

    return {
      id: mapUuidToShortId(inserted.id)!,
      tenant_id: inserted.tenantId,
      student_id: mapUuidToShortId(inserted.studentId)!,
      fee_head: inserted.feeHead,
      amount_paise: Number(inserted.amountPaise),
      currency: inserted.currency as any,
      payment_status: inserted.paymentStatus as any,
      payment_mode: inserted.paymentMode,
      created_at: inserted.createdAt?.toISOString() || '',
    };
  });
}

export async function appendAttendanceRecords(
  tenantId: string,
  records: Omit<AttendanceRecord, 'id' | 'created_at' | 'tenant_id'>[]
): Promise<AttendanceRecord[]> {
  return await withTenantContext(tenantId, async (databaseTx) => {
    const added: AttendanceRecord[] = [];

    for (const r of records) {
      const mappedStuId = mapShortIdToUuid(r.student_id)!;
      const mappedUserId = mapShortIdToUuid(r.marked_by)!;

      const [inserted] = await databaseTx
        .insert(schema.attendanceRecords)
        .values({
          tenantId,
          classId: r.class_id,
          studentId: mappedStuId,
          date: r.date,
          status: r.status,
          markedBy: mappedUserId,
          note: r.note || null,
        })
        .returning();

      added.push({
        id: mapUuidToShortId(inserted.id)!,
        tenant_id: inserted.tenantId,
        class_id: inserted.classId,
        student_id: mapUuidToShortId(inserted.studentId)!,
        date: inserted.date,
        status: inserted.status as any,
        marked_by: mapUuidToShortId(inserted.markedBy)!,
        note: inserted.note || undefined,
        created_at: inserted.createdAt?.toISOString() || '',
      });
    }

    return added;
  });
}

export async function addStudent(
  tenantId: string,
  student: Omit<Student, 'id' | 'created_at' | 'tenant_id'>
): Promise<Student> {
  return await withTenantContext(tenantId, async (databaseTx) => {
    const [inserted] = await databaseTx
      .insert(schema.students)
      .values({
        tenantId,
        firstName: student.first_name,
        lastName: student.last_name,
        dateOfBirth: student.date_of_birth,
        gender: student.gender,
        grade: student.grade,
        section: student.section,
        rollNumber: student.roll_number,
        parentEmail: student.parent_email || null,
        parentPhone: student.parent_phone || null,
      })
      .returning();

    return {
      id: mapUuidToShortId(inserted.id)!,
      tenant_id: inserted.tenantId,
      first_name: inserted.firstName,
      last_name: inserted.lastName,
      date_of_birth: inserted.dateOfBirth,
      gender: inserted.gender as any,
      grade: inserted.grade,
      section: inserted.section,
      roll_number: inserted.rollNumber,
      parent_email: inserted.parentEmail || undefined,
      parent_phone: inserted.parentPhone || undefined,
      created_at: inserted.createdAt?.toISOString() || '',
      is_active: inserted.isActive || true,
    };
  });
}

export async function addStaff(
  tenantId: string,
  staffData: Omit<Staff, 'id' | 'created_at' | 'tenant_id'>
): Promise<Staff> {
  return await withTenantContext(tenantId, async (databaseTx) => {
    const [inserted] = await databaseTx
      .insert(schema.staff)
      .values({
        tenantId,
        employeeId: staffData.employee_id,
        firstName: staffData.first_name,
        lastName: staffData.last_name,
        email: staffData.email,
        phone: staffData.phone || null,
        role: staffData.role,
        department: staffData.department || null,
        dateOfJoining: staffData.date_of_joining,
        dpdpConsentGiven: staffData.dpdp_consent_given,
      })
      .returning();

    return {
      id: mapUuidToShortId(inserted.id)!,
      tenant_id: inserted.tenantId,
      first_name: inserted.firstName,
      last_name: inserted.lastName,
      email: inserted.email,
      phone: inserted.phone || '',
      role: inserted.role,
      department: inserted.department || undefined,
      date_of_joining: inserted.dateOfJoining,
      employee_id: inserted.employeeId,
      dpdp_consent_given: inserted.dpdpConsentGiven,
      is_active: inserted.isActive || true,
      created_at: inserted.createdAt?.toISOString() || '',
    };
  });
}

export async function queryLibraryTransactions(tenantId: string): Promise<LibraryTransaction[]> {
  return await withTenantContext(tenantId, async (tx) => {
    const results = await tx.select().from(schema.libraryTransactions);
    return results.map((t) => ({
      id: mapUuidToShortId(t.id)!,
      tenant_id: t.tenantId,
      book_id: mapUuidToShortId(t.bookId)!,
      student_id: mapUuidToShortId(t.studentId)!,
      issued_by: mapUuidToShortId(t.issuedBy)!,
      issued_at: t.issuedAt?.toISOString() || '',
      due_date: t.dueDate,
      returned_at: t.returnedAt?.toISOString() || undefined,
      status: t.status as any,
    }));
  });
}

export async function issueBook(
  tenantId: string,
  bookId: string,
  studentId: string,
  dueDate: string,
  issuedBy: string
): Promise<LibraryTransaction> {
  return await withTenantContext(tenantId, async (tx) => {
    const mappedBookId = mapShortIdToUuid(bookId)!;
    const mappedStuId = mapShortIdToUuid(studentId)!;
    const mappedUserId = mapShortIdToUuid(issuedBy)!;

    // Update available copies
    const [book] = await tx
      .select()
      .from(schema.libraryBooks)
      .where(eq(schema.libraryBooks.id, mappedBookId));

    if (book) {
      await tx
        .update(schema.libraryBooks)
        .set({ availableCopies: book.availableCopies - 1 })
        .where(eq(schema.libraryBooks.id, mappedBookId));
    }

    const [inserted] = await tx
      .insert(schema.libraryTransactions)
      .values({
        tenantId,
        bookId: mappedBookId,
        studentId: mappedStuId,
        dueDate,
        issuedBy: mappedUserId,
        status: 'ISSUED',
      })
      .returning();

    return {
      id: mapUuidToShortId(inserted.id)!,
      tenant_id: inserted.tenantId,
      book_id: mapUuidToShortId(inserted.bookId)!,
      student_id: mapUuidToShortId(inserted.studentId)!,
      issued_by: mapUuidToShortId(inserted.issuedBy)!,
      issued_at: inserted.issuedAt?.toISOString() || '',
      due_date: inserted.dueDate,
      status: inserted.status as any,
    };
  });
}

export async function returnBook(tenantId: string, txnId: string): Promise<LibraryTransaction> {
  return await withTenantContext(tenantId, async (tx) => {
    const mappedTxnId = mapShortIdToUuid(txnId)!;

    const [txn] = await tx
      .select()
      .from(schema.libraryTransactions)
      .where(eq(schema.libraryTransactions.id, mappedTxnId));

    if (!txn) throw new Error('Transaction not found');

    const [updated] = await tx
      .update(schema.libraryTransactions)
      .set({
        returnedAt: new Date(),
        status: 'RETURNED',
      })
      .where(eq(schema.libraryTransactions.id, mappedTxnId))
      .returning();

    // Increment available copies
    const [book] = await tx
      .select()
      .from(schema.libraryBooks)
      .where(eq(schema.libraryBooks.id, txn.bookId));

    if (book) {
      await tx
        .update(schema.libraryBooks)
        .set({ availableCopies: book.availableCopies + 1 })
        .where(eq(schema.libraryBooks.id, txn.bookId));
    }

    return {
      id: mapUuidToShortId(updated.id)!,
      tenant_id: updated.tenantId,
      book_id: mapUuidToShortId(updated.bookId)!,
      student_id: mapUuidToShortId(updated.studentId)!,
      issued_by: mapUuidToShortId(updated.issuedBy)!,
      issued_at: updated.issuedAt?.toISOString() || '',
      due_date: updated.dueDate,
      returned_at: updated.returnedAt?.toISOString() || undefined,
      status: updated.status as any,
    };
  });
}
