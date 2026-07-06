import { pgTable, uuid, varchar, timestamp, boolean, smallint, date, bigint, jsonb, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Tenants Table ──────────────────────────────────────────────────────────
export const tenants = pgTable('tenants', {
  id: uuid('tenant_id').primaryKey().defaultRandom(),
  domainName: varchar('domain_name', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 500 }).notNull(),
  kmsDekArn: varchar('kms_dek_arn', { length: 512 }).notNull(),
  plan: varchar('plan', { length: 50 }).default('STANDARD'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── Users Table ─────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('user_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 254 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  tier: smallint('tier').notNull(),
  subdomain: varchar('subdomain', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── Students Table ──────────────────────────────────────────────────────────
export const students = pgTable('students', {
  id: uuid('student_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  gender: varchar('gender', { length: 10 }).notNull(),
  grade: varchar('grade', { length: 20 }).notNull(),
  section: varchar('section', { length: 10 }).notNull(),
  rollNumber: varchar('roll_number', { length: 20 }).notNull(),
  parentEmail: varchar('parent_email', { length: 254 }),
  parentPhone: varchar('parent_phone', { length: 100 }), // encrypted in production
  aadhaarHash: varchar('aadhaar_hash', { length: 255 }), // SHA-256 hash only
  address: jsonb('address'),
  isActive: boolean('is_active').default(true),
  academicYear: varchar('academic_year', { length: 20 }).default('2026-27').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── Staff Table ─────────────────────────────────────────────────────────────
export const staff = pgTable('staff', {
  id: uuid('staff_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  employeeId: varchar('employee_id', { length: 50 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 254 }).notNull(),
  phone: varchar('phone', { length: 100 }), // encrypted
  role: varchar('role', { length: 50 }).notNull(),
  department: varchar('department', { length: 100 }),
  dateOfJoining: date('date_of_joining').notNull(),
  dpdpConsentGiven: boolean('dpdp_consent_given').default(false).notNull(),
  dpdpConsentAt: timestamp('dpdp_consent_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── Attendance Records Table ────────────────────────────────────────────────
export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('attendance_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  classId: varchar('class_id', { length: 50 }).notNull(),
  studentId: uuid('student_id').notNull().references(() => students.id),
  date: date('date').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  markedBy: uuid('marked_by').notNull().references(() => users.id),
  note: varchar('note', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Assignments Table ───────────────────────────────────────────────────────
export const assignments = pgTable('assignments', {
  id: uuid('assignment_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: varchar('description', { length: 2000 }),
  subjectId: varchar('subject_id', { length: 50 }).notNull(),
  classId: varchar('class_id', { length: 50 }).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  dueDate: date('due_date').notNull(),
  maxMarks: smallint('max_marks').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Fee Transactions Table (APPEND-ONLY — IMMUTABLE) ──────────────────────
export const feeTransactions = pgTable('fee_transactions', {
  id: uuid('transaction_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id),
  feeHead: varchar('fee_head', { length: 200 }).notNull(),
  amountPaise: bigint('amount_paise', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 3 }).default('INR').notNull(),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull(),
  paymentMode: varchar('payment_mode', { length: 30 }).notNull(),
  auditMetadata: jsonb('audit_metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Library Books Table ─────────────────────────────────────────────────────
export const libraryBooks = pgTable('library_books', {
  id: uuid('book_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  isbn: varchar('isbn', { length: 20 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  author: varchar('author', { length: 500 }).notNull(),
  totalCopies: smallint('total_copies').notNull(),
  availableCopies: smallint('available_copies').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Library Transactions Table ──────────────────────────────────────────────
export const libraryTransactions = pgTable('library_transactions', {
  id: uuid('txn_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  bookId: uuid('book_id').notNull().references(() => libraryBooks.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  issuedBy: uuid('issued_by').notNull().references(() => users.id),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow(),
  dueDate: date('due_date').notNull(),
  returnedAt: timestamp('returned_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull(),
});

// ─── Hostel Rooms Table ──────────────────────────────────────────────────────
export const hostelRooms = pgTable('hostel_rooms', {
  id: uuid('room_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  roomNumber: varchar('room_number', { length: 20 }).notNull(),
  block: varchar('block', { length: 50 }).notNull(),
  capacity: smallint('capacity').notNull(),
  occupied: smallint('occupied').default(0).notNull(),
  roomType: varchar('room_type', { length: 20 }).notNull(),
});

// ─── Transport Buses Table ───────────────────────────────────────────────────
export const transportBuses = pgTable('transport_buses', {
  id: uuid('bus_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  busNumber: varchar('bus_number', { length: 20 }).notNull(),
  routeName: varchar('route_name', { length: 200 }).notNull(),
  driverName: varchar('driver_name', { length: 200 }).notNull(),
  capacity: smallint('capacity').notNull(),
  currentLatitude: decimal('current_latitude', { precision: 10, scale: 7 }),
  currentLongitude: decimal('current_longitude', { precision: 10, scale: 7 }),
  lastUpdated: timestamp('last_updated', { withTimezone: true }),
  status: varchar('status', { length: 20 }).default('INACTIVE').notNull(),
});
