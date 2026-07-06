/**
 * EduCore ERP — In-Memory Mock Database
 * DEV-ONLY: Simulates PostgreSQL 17 with RLS scoping.
 * Production: Drizzle ORM + PostgreSQL 17 with RLS policies per /docs/persistence/postgres-schema.md
 *
 * ALL data is tenant-scoped. Any query that doesn't pass tenant_id is rejected.
 * This mirrors the production RLS behavior:
 *   SET LOCAL app.current_tenant_id = '<uuid>';
 */

import { v4 as uuidv4 } from 'uuid';
import { DEMO_TENANT_ID } from './demo-users';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  parent_phone?: string; // stored as-is (would be encrypted in prod)
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
  marked_by: string; // teacher user_id
  note?: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  subject_id: string;
  class_id: string;
  created_by: string; // teacher user_id
  due_date: string;
  max_marks: number;
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

export interface HostelRoom {
  id: string;
  tenant_id: string;
  room_number: string;
  block: string;
  capacity: number;
  occupied: number;
  room_type: 'SINGLE' | 'DOUBLE' | 'TRIPLE';
}

export interface TransportBus {
  id: string;
  tenant_id: string;
  bus_number: string;
  route_name: string;
  driver_name: string;
  capacity: number;
  current_latitude?: number;
  current_longitude?: number;
  last_updated?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

/** Fee transaction — APPEND ONLY — no updates or deletes ever */
export interface FeeTransaction {
  id: string;
  tenant_id: string;
  student_id: string;
  fee_head: string;
  amount_paise: number; // Never floats, always integer paise
  currency: 'INR';
  payment_status: 'PENDING' | 'INITIATED' | 'PROCESSING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  payment_mode: string;
  created_at: string;
  // NO updated_at — this record is immutable
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const STUDENTS: Student[] = [
  { id: 'stu-001', tenant_id: DEMO_TENANT_ID, first_name: 'Arjun', last_name: 'Patel', date_of_birth: '2010-03-15', gender: 'MALE', grade: '10', section: 'A', roll_number: '10A001', parent_email: 'parent@demo.educore.dev', is_active: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'stu-002', tenant_id: DEMO_TENANT_ID, first_name: 'Priya', last_name: 'Singh', date_of_birth: '2010-07-22', gender: 'FEMALE', grade: '10', section: 'A', roll_number: '10A002', is_active: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'stu-003', tenant_id: DEMO_TENANT_ID, first_name: 'Rohan', last_name: 'Mehta', date_of_birth: '2010-11-08', gender: 'MALE', grade: '10', section: 'B', roll_number: '10B001', is_active: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'stu-004', tenant_id: DEMO_TENANT_ID, first_name: 'Asha', last_name: 'Rao', date_of_birth: '2011-02-14', gender: 'FEMALE', grade: '9', section: 'A', roll_number: '9A001', is_active: true, created_at: '2026-01-05T00:00:00Z' },
  { id: 'stu-005', tenant_id: DEMO_TENANT_ID, first_name: 'Kiran', last_name: 'Kumar', date_of_birth: '2011-09-30', gender: 'MALE', grade: '9', section: 'A', roll_number: '9A002', is_active: true, created_at: '2026-01-05T00:00:00Z' },
];

export const STAFF_MEMBERS: Staff[] = [
  { id: 'stf-001', tenant_id: DEMO_TENANT_ID, first_name: 'Anitha', last_name: 'Menon', email: 'teacher@demo.educore.dev', phone: '9876543210', role: 'TEACHER', department: 'Mathematics', date_of_joining: '2020-06-01', employee_id: 'EMP-001', dpdp_consent_given: true, is_active: true, created_at: '2020-06-01T00:00:00Z' },
  { id: 'stf-002', tenant_id: DEMO_TENANT_ID, first_name: 'Suresh', last_name: 'Iyer', email: 'accountant@demo.educore.dev', phone: '9876543211', role: 'ACCOUNTANT', date_of_joining: '2019-04-15', employee_id: 'EMP-002', dpdp_consent_given: true, is_active: true, created_at: '2019-04-15T00:00:00Z' },
  { id: 'stf-003', tenant_id: DEMO_TENANT_ID, first_name: 'Divya', last_name: 'Krishnan', email: 'hr@demo.educore.dev', phone: '9876543212', role: 'HR_MANAGER', date_of_joining: '2021-08-01', employee_id: 'EMP-003', dpdp_consent_given: true, is_active: true, created_at: '2021-08-01T00:00:00Z' },
  { id: 'stf-004', tenant_id: DEMO_TENANT_ID, first_name: 'Ramesh', last_name: 'Kumar', email: 'transport@demo.educore.dev', phone: '9876543213', role: 'TRANSPORT_OFFICER', date_of_joining: '2022-01-15', employee_id: 'EMP-004', dpdp_consent_given: false, is_active: true, created_at: '2022-01-15T00:00:00Z' },
];

export const ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { id: 'att-001', tenant_id: DEMO_TENANT_ID, class_id: 'cls-10a', student_id: 'stu-001', date: '2026-07-06', status: 'PRESENT', marked_by: 'usr-004', created_at: '2026-07-06T08:30:00Z' },
  { id: 'att-002', tenant_id: DEMO_TENANT_ID, class_id: 'cls-10a', student_id: 'stu-002', date: '2026-07-06', status: 'PRESENT', marked_by: 'usr-004', created_at: '2026-07-06T08:30:00Z' },
  { id: 'att-003', tenant_id: DEMO_TENANT_ID, class_id: 'cls-10a', student_id: 'stu-003', date: '2026-07-05', status: 'ABSENT', marked_by: 'usr-004', note: 'Medical leave', created_at: '2026-07-05T08:30:00Z' },
];

export const ASSIGNMENTS: Assignment[] = [
  { id: 'asgn-001', tenant_id: DEMO_TENANT_ID, title: 'Quadratic Equations — Practice Set', description: 'Solve problems 1–20 from NCERT Chapter 4', subject_id: 'sub-math', class_id: 'cls-10a', created_by: 'usr-004', due_date: '2026-07-12', max_marks: 20, created_at: '2026-07-01T00:00:00Z' },
  { id: 'asgn-002', tenant_id: DEMO_TENANT_ID, title: 'Physics Lab Report — Newton\'s Laws', description: 'Submit lab report from experiment conducted on 01 Jul', subject_id: 'sub-phys', class_id: 'cls-10a', created_by: 'usr-004', due_date: '2026-07-10', max_marks: 15, created_at: '2026-07-02T00:00:00Z' },
];

export const LIBRARY_BOOKS: LibraryBook[] = [
  { id: 'bk-001', tenant_id: DEMO_TENANT_ID, isbn: '9780070700734', title: 'Introduction to Algorithms', author: 'Cormen et al.', total_copies: 5, available_copies: 3, category: 'Computer Science', created_at: '2025-01-01T00:00:00Z' },
  { id: 'bk-002', tenant_id: DEMO_TENANT_ID, isbn: '9780071000741', title: 'Physics for Class XI', author: 'H.C. Verma', total_copies: 20, available_copies: 14, category: 'Science', created_at: '2025-01-01T00:00:00Z' },
  { id: 'bk-003', tenant_id: DEMO_TENANT_ID, isbn: '9789386424860', title: 'NCERT Mathematics Class X', author: 'NCERT', total_copies: 30, available_copies: 22, category: 'Mathematics', created_at: '2025-01-01T00:00:00Z' },
];

export const LIBRARY_TRANSACTIONS: LibraryTransaction[] = [
  { id: 'ltx-001', tenant_id: DEMO_TENANT_ID, book_id: 'bk-001', student_id: 'stu-001', issued_by: 'usr-009', issued_at: '2026-06-20T00:00:00Z', due_date: '2026-07-04', status: 'OVERDUE' },
  { id: 'ltx-002', tenant_id: DEMO_TENANT_ID, book_id: 'bk-002', student_id: 'stu-002', issued_by: 'usr-009', issued_at: '2026-07-01T00:00:00Z', due_date: '2026-07-15', status: 'ISSUED' },
];

export const HOSTEL_ROOMS: HostelRoom[] = [
  { id: 'rm-001', tenant_id: DEMO_TENANT_ID, room_number: 'A-101', block: 'A', capacity: 2, occupied: 2, room_type: 'DOUBLE' },
  { id: 'rm-002', tenant_id: DEMO_TENANT_ID, room_number: 'A-102', block: 'A', capacity: 1, occupied: 0, room_type: 'SINGLE' },
  { id: 'rm-003', tenant_id: DEMO_TENANT_ID, room_number: 'B-201', block: 'B', capacity: 3, occupied: 2, room_type: 'TRIPLE' },
];

export const TRANSPORT_BUSES: TransportBus[] = [
  { id: 'bus-001', tenant_id: DEMO_TENANT_ID, bus_number: 'KA-01-AB-1234', route_name: 'Route 1 — MG Road', driver_name: 'Ravi Kumar', capacity: 52, current_latitude: 12.9716, current_longitude: 77.5946, last_updated: new Date().toISOString(), status: 'ACTIVE' },
  { id: 'bus-002', tenant_id: DEMO_TENANT_ID, bus_number: 'KA-02-CD-5678', route_name: 'Route 2 — Indiranagar', driver_name: 'Suresh Babu', capacity: 52, current_latitude: 12.9784, current_longitude: 77.6408, last_updated: new Date().toISOString(), status: 'ACTIVE' },
];

/** Fee transactions — IMMUTABLE, APPEND-ONLY (no UPDATE/DELETE) */
export const FEE_TRANSACTIONS: FeeTransaction[] = [
  { id: 'ftx-001', tenant_id: DEMO_TENANT_ID, student_id: 'stu-001', fee_head: 'Annual Tuition Fee', amount_paise: 1250000, currency: 'INR', payment_status: 'CAPTURED', payment_mode: 'UPI', created_at: '2026-07-01T10:30:00Z' },
  { id: 'ftx-002', tenant_id: DEMO_TENANT_ID, student_id: 'stu-002', fee_head: 'Term Fee Q1', amount_paise: 820000, currency: 'INR', payment_status: 'CAPTURED', payment_mode: 'RAZORPAY', created_at: '2026-07-02T14:00:00Z' },
  { id: 'ftx-003', tenant_id: DEMO_TENANT_ID, student_id: 'stu-003', fee_head: 'Annual Tuition Fee', amount_paise: 1250000, currency: 'INR', payment_status: 'PENDING', payment_mode: 'NEFT', created_at: '2026-07-05T09:00:00Z' },
];

// ─── RLS-scoped Query Helpers ─────────────────────────────────────────────────

/** All queries MUST pass tenant_id — mirrors production RLS SET LOCAL */
export function queryStudents(tenantId: string, search?: string): Student[] {
  let results = STUDENTS.filter((s) => s.tenant_id === tenantId);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (s) => s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q)
    );
  }
  return results;
}

export function queryStaff(tenantId: string, search?: string): Staff[] {
  let results = STAFF_MEMBERS.filter((s) => s.tenant_id === tenantId);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (s) => s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }
  return results;
}

export function queryAttendance(tenantId: string, studentId?: string, date?: string): AttendanceRecord[] {
  return ATTENDANCE_RECORDS.filter(
    (a) => a.tenant_id === tenantId
      && (!studentId || a.student_id === studentId)
      && (!date || a.date === date)
  );
}

export function queryLibraryBooks(tenantId: string, search?: string): LibraryBook[] {
  let results = LIBRARY_BOOKS.filter((b) => b.tenant_id === tenantId);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q)
    );
  }
  return results;
}

export function queryFeeTransactions(tenantId: string, studentId?: string): FeeTransaction[] {
  return FEE_TRANSACTIONS.filter(
    (f) => f.tenant_id === tenantId && (!studentId || f.student_id === studentId)
  );
}

/** APPEND only — no updates, no deletes */
export function appendFeeTransaction(tx: Omit<FeeTransaction, 'id' | 'created_at'>): FeeTransaction {
  const newTx: FeeTransaction = {
    ...tx,
    id: `ftx-${uuidv4().slice(0, 8)}`,
    created_at: new Date().toISOString(),
  };
  FEE_TRANSACTIONS.push(newTx);
  return newTx;
}

export function appendAttendanceRecords(records: Omit<AttendanceRecord, 'id' | 'created_at'>[]): AttendanceRecord[] {
  const added: AttendanceRecord[] = records.map((r) => ({
    ...r,
    id: `att-${uuidv4().slice(0, 8)}`,
    created_at: new Date().toISOString(),
  }));
  ATTENDANCE_RECORDS.push(...added);
  return added;
}

export function addStudent(student: Omit<Student, 'id' | 'created_at'>): Student {
  const newStudent: Student = {
    ...student,
    id: `stu-${uuidv4().slice(0, 8)}`,
    created_at: new Date().toISOString(),
  };
  STUDENTS.push(newStudent);
  return newStudent;
}

export function addStaff(staff: Omit<Staff, 'id' | 'created_at'>): Staff {
  const newStaff: Staff = {
    ...staff,
    id: `stf-${uuidv4().slice(0, 8)}`,
    created_at: new Date().toISOString(),
  };
  STAFF_MEMBERS.push(newStaff);
  return newStaff;
}
