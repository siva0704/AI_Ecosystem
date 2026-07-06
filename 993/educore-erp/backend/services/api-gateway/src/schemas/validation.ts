/**
 * EduCore API Gateway — Zod Validation Schemas
 * All inbound payloads validated before reaching domain logic.
 * Rejects malformed input BEFORE any database interaction.
 */
import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .min(1, 'Email is required')
    .email('Must be a valid email address')
    .max(254, 'Email too long')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password too long'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Student Schemas ─────────────────────────────────────────────────────────
export const CreateStudentSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  grade: z.string().min(1).max(20),
  section: z.string().min(1).max(10),
  rollNumber: z.string().min(1).max(20),
  parentEmail: z.string().email().optional(),
  parentPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number').optional(),
  aadhaarHash: z.string().optional(), // Never store raw Aadhaar
  address: z.object({
    line1: z.string().max(200),
    city: z.string().max(100),
    state: z.string().max(100),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  }).optional(),
});
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

// ─── Attendance Schemas ──────────────────────────────────────────────────────
export const AttendanceRecordSchema = z.object({
  classId: z.string().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().min(1).max(50),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    note: z.string().max(200).optional(),
  })).min(1, 'At least one attendance record required')
    .max(200, 'Too many records in a single batch'),
});
export type AttendanceRecordInput = z.infer<typeof AttendanceRecordSchema>;

// ─── Assignment Schemas ──────────────────────────────────────────────────────
export const CreateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  subjectId: z.string().min(1).max(50),
  classId: z.string().min(1).max(50),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxMarks: z.number().int().min(0).max(1000),
});
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

// ─── Library Schemas ─────────────────────────────────────────────────────────
export const IssueBookSchema = z.object({
  bookId: z.string().min(1).max(50),
  studentId: z.string().min(1).max(50),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type IssueBookInput = z.infer<typeof IssueBookSchema>;

// ─── Transport Schemas ────────────────────────────────────────────────────────
export const UpdateBusLocationSchema = z.object({
  busId: z.string().min(1).max(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timestamp: z.string().datetime(),
});
export type UpdateBusLocationInput = z.infer<typeof UpdateBusLocationSchema>;

// ─── Fee Collection Schema (NO arithmetic here — CONTEXT.md §1.1) ────────────
export const InitiateFeePaymentSchema = z.object({
  studentId: z.string().min(1).max(50),
  feeHeadId: z.string().min(1).max(50),
  // Amount comes from the server-side fee structure, NEVER from the client
  // This prevents client-side amount tampering
  paymentMode: z.enum(['UPI', 'NEFT', 'RTGS', 'CARD', 'CASH', 'RAZORPAY']),
  notes: z.string().max(500).optional(),
});
export type InitiateFeePaymentInput = z.infer<typeof InitiateFeePaymentSchema>;

// ─── Hostel Schemas ───────────────────────────────────────────────────────────
export const AllocateRoomSchema = z.object({
  studentId: z.string().min(1).max(50),
  roomId: z.string().min(1).max(50),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type AllocateRoomInput = z.infer<typeof AllocateRoomSchema>;

// ─── Staff Schemas ────────────────────────────────────────────────────────────
export const CreateStaffSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  role: z.enum([
    'TEACHER', 'PRINCIPAL', 'HOD', 'ACCOUNTANT', 'HR_MANAGER',
    'TRANSPORT_OFFICER', 'HOSTEL_WARDEN', 'LIBRARIAN', 'ADMIN_STAFF',
  ]),
  department: z.string().max(100).optional(),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  employeeId: z.string().max(50),
  dpdpConsentGiven: z.boolean(),
});
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;

// ─── Pagination Schema ────────────────────────────────────────────────────────
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;
