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
  classId: uuid('class_id').notNull().references(() => classes.id),
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

// ─── Academic: Classes Table ─────────────────────────────────────────────────
export const classes = pgTable('classes', {
  id: uuid('class_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  grade: varchar('grade', { length: 20 }).notNull(),
  section: varchar('section', { length: 10 }).notNull(),
  classTeacherId: uuid('class_teacher_id').references(() => staff.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Academic: Subjects Table ────────────────────────────────────────────────
export const subjects = pgTable('subjects', {
  id: uuid('subject_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Academic: Class Subjects (Mapping) ──────────────────────────────────────
export const classSubjects = pgTable('class_subjects', {
  id: uuid('mapping_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id').references(() => staff.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Attendance Records Table ────────────────────────────────────────────────
export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('attendance_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').notNull().references(() => classes.id),
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
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  classId: uuid('class_id').notNull().references(() => classes.id),
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

// ─── Leave Requests Table ───────────────────────────────────────────────────
export const leaveRequests = pgTable('leave_requests', {
  id: uuid('leave_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  leaveType: varchar('leave_type', { length: 50 }).notNull(),
  fromDate: date('from_date').notNull(),
  toDate: date('to_date').notNull(),
  daysCount: smallint('days_count').notNull(),
  reason: varchar('reason', { length: 2000 }),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNote: varchar('review_note', { length: 1000 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── DPDP Consent Log Table (APPEND-ONLY — IMMUTABLE) ────────────────────────
export const dpdpConsentLog = pgTable('dpdp_consent_log', {
  id: uuid('consent_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  dataCategory: varchar('data_category', { length: 100 }).notNull(),
  consentGiven: boolean('consent_given').notNull(),
  consentVersion: varchar('consent_version', { length: 20 }).default('1.0').notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: varchar('user_agent', { length: 512 }),
  recordedBy: uuid('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Hostel Allocations Table ─────────────────────────────────────────────────
export const hostelAllocations = pgTable('hostel_allocations', {
  id: uuid('allocation_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').notNull().references(() => hostelRooms.id),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  academicYear: varchar('academic_year', { length: 20 }).default('2026-27').notNull(),
  checkInDate: date('check_in_date').notNull(),
  checkOutDate: date('check_out_date'),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  allocatedBy: uuid('allocated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── Transport Routes Table ───────────────────────────────────────────────────
export const transportRoutes = pgTable('transport_routes', {
  id: uuid('route_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  routeName: varchar('route_name', { length: 200 }).notNull(),
  origin: varchar('origin', { length: 200 }).notNull(),
  stops: jsonb('stops').default([]).notNull(),
  estimatedMins: smallint('estimated_mins'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Bus Assignments Table ────────────────────────────────────────────────────
export const busAssignments = pgTable('bus_assignments', {
  id: uuid('assignment_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  busId: uuid('bus_id').notNull().references(() => transportBuses.id),
  routeId: uuid('route_id').notNull().references(() => transportRoutes.id),
  academicYear: varchar('academic_year', { length: 20 }).default('2026-27').notNull(),
  pickupStop: varchar('pickup_stop', { length: 200 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Refresh Tokens Table ───────────────────────────────────────────────────
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('token_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  userAgent: varchar('user_agent', { length: 512 }),
  ipAddress: varchar('ip_address', { length: 50 }),
});

// ── TC Requests Table ──────────────────────────────────────────────────────
export const tcRequests = pgTable('tc_requests', {
  id: uuid('request_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  reason: varchar('reason', { length: 1000 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ── Grievances Table ───────────────────────────────────────────────────────
export const grievances = pgTable('grievances', {
  id: uuid('grievance_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: varchar('description', { length: 4000 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(),
  submittedBy: uuid('submitted_by').notNull().references(() => users.id),
  resolution: varchar('resolution', { length: 4000 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ── Assets & Vendors Table ─────────────────────────────────────────────────
export const vendors = pgTable('vendors', {
  id: uuid('vendor_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  servicesProvided: varchar('services_provided', { length: 1000 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const assets = pgTable('assets', {
  id: uuid('asset_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  purchaseDate: date('purchase_date'),
  valuePaise: bigint('value_paise', { mode: 'number' }),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Exam Results & Corrections ─────────────────────────────────────────────
export const examResults = pgTable('exam_results', {
  id: uuid('result_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  examName: varchar('exam_name', { length: 200 }).notNull(),
  marksObtained: decimal('marks_obtained', { precision: 5, scale: 2 }).notNull(),
  maxMarks: smallint('max_marks').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const examCorrections = pgTable('exam_corrections', {
  id: uuid('correction_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  resultId: uuid('result_id').notNull().references(() => examResults.id, { onDelete: 'cascade' }),
  reason: varchar('reason', { length: 1000 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
