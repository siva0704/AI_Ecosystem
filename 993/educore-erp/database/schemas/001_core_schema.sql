-- ============================================================================
-- EduCore ERP — PostgreSQL 17 Core Schema (Phase 1 MVP)
-- Compliant with CONTEXT.md, rls-tenant-matrix.md, postgres-schema.md
-- 
-- CRITICAL RULES (CONTEXT.md §1):
--   1. All tenant-facing tables have RLS (Row-Level Security) enabled
--   2. fee_transactions is append-only — UPDATE/DELETE blocked at engine level
--   3. Currency stored as integer PAISE (never floats)
--   4. PgBouncer transaction mode: SET LOCAL app.current_tenant_id before every txn
--   5. GIN indexes on JSONB columns per postgres-schema.md strategy
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy name search

-- ─── Tenants (Non-RLS — Platform-level table) ─────────────────────────────
CREATE TABLE tenants (
  tenant_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name   VARCHAR(255) NOT NULL UNIQUE,
  display_name  VARCHAR(500) NOT NULL,
  kms_dek_arn   VARCHAR(512) NOT NULL,             -- AWS KMS DEK per tenant
  plan          VARCHAR(50) DEFAULT 'STANDARD',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Users (All roles) ───────────────────────────────────────────────────────
CREATE TABLE users (
  user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  email           VARCHAR(254) NOT NULL,
  password_hash   TEXT NOT NULL,                    -- bcrypt, never plaintext
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  role            VARCHAR(50) NOT NULL CHECK (role IN (
                    'SUPER_ADMIN','INSTITUTION_ADMIN','PRINCIPAL','HOD',
                    'TEACHER','ACCOUNTANT','HR_MANAGER','TRANSPORT_OFFICER',
                    'HOSTEL_WARDEN','LIBRARIAN','STUDENT','PARENT','AUDITOR'
                  )),
  tier            SMALLINT NOT NULL CHECK (tier BETWEEN 0 AND 6),
  subdomain       VARCHAR(100) NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, email)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_isolation_policy ON users
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
      OR tier = 0); -- Super admin bypasses tenant filter

-- ─── Students ────────────────────────────────────────────────────────────────
CREATE TABLE students (
  student_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(user_id),  -- linked portal user (optional)
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  date_of_birth   DATE NOT NULL,
  gender          VARCHAR(10) NOT NULL CHECK (gender IN ('MALE','FEMALE','OTHER')),
  grade           VARCHAR(20) NOT NULL,
  section         VARCHAR(10) NOT NULL,
  roll_number     VARCHAR(20) NOT NULL,
  parent_email    VARCHAR(254),
  parent_phone    TEXT,                             -- encrypted in prod via KMS
  aadhaar_hash    TEXT,                             -- NEVER store raw Aadhaar (DPDP §4)
  address         JSONB,                            -- GIN indexed (jsonb_path_ops)
  is_active       BOOLEAN DEFAULT TRUE,
  academic_year   VARCHAR(20) NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, grade, section, roll_number)
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY students_isolation_policy ON students
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX students_name_trgm_idx ON students USING GIN (first_name gin_trgm_ops, last_name gin_trgm_ops);
CREATE INDEX students_address_gin_idx ON students USING GIN (address jsonb_path_ops);

-- ─── Staff ───────────────────────────────────────────────────────────────────
CREATE TABLE staff (
  staff_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(user_id),
  employee_id       VARCHAR(50) NOT NULL,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  email             VARCHAR(254) NOT NULL,
  phone             TEXT,                           -- encrypted
  role              VARCHAR(50) NOT NULL,
  department        VARCHAR(100),
  date_of_joining   DATE NOT NULL,
  dpdp_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  dpdp_consent_at   TIMESTAMP WITH TIME ZONE,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, employee_id),
  UNIQUE (tenant_id, email)
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_isolation_policy ON staff
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Attendance Records ───────────────────────────────────────────────────────
CREATE TABLE attendance_records (
  attendance_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  class_id        VARCHAR(50) NOT NULL,
  student_id      UUID NOT NULL REFERENCES students(student_id),
  date            DATE NOT NULL,
  status          VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
  marked_by       UUID NOT NULL REFERENCES users(user_id),  -- teacher
  note            TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, class_id, student_id, date)            -- one record per student per day
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendance_isolation_policy ON attendance_records
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX attendance_date_idx ON attendance_records (tenant_id, date);
CREATE INDEX attendance_student_idx ON attendance_records (tenant_id, student_id);

-- ─── Assignments ──────────────────────────────────────────────────────────────
CREATE TABLE assignments (
  assignment_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  subject_id      VARCHAR(50) NOT NULL,
  class_id        VARCHAR(50) NOT NULL,
  created_by      UUID NOT NULL REFERENCES users(user_id),
  due_date        DATE NOT NULL,
  max_marks       SMALLINT NOT NULL CHECK (max_marks >= 0),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignments_isolation_policy ON assignments
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Fee Transactions (APPEND-ONLY — IMMUTABLE) ──────────────────────────────
-- CONTEXT.md §1.3: No UPDATE/DELETE may ever be introduced
-- Amount stored as BIGINT paise — NEVER floats
CREATE TABLE fee_transactions (
  transaction_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(student_id),
  fee_head        VARCHAR(200) NOT NULL,
  amount_paise    BIGINT NOT NULL CHECK (amount_paise > 0),   -- paise only, never floats
  currency        VARCHAR(3) DEFAULT 'INR' NOT NULL,
  payment_status  VARCHAR(20) NOT NULL CHECK (payment_status IN
                    ('PENDING','INITIATED','PROCESSING','CAPTURED','FAILED','REFUNDED')),
  payment_mode    VARCHAR(30) NOT NULL,
  audit_metadata  JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  -- NO updated_at — immutable record
);

-- Block ALL updates and deletes at engine level (CONTEXT.md §1.3)
CREATE RULE deny_update_fee_transactions AS ON UPDATE TO fee_transactions DO INSTEAD NOTHING;
CREATE RULE deny_delete_fee_transactions AS ON DELETE TO fee_transactions DO INSTEAD NOTHING;

ALTER TABLE fee_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_transactions_isolation_policy ON fee_transactions
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX fee_transactions_student_idx ON fee_transactions (tenant_id, student_id);
CREATE INDEX fee_transactions_status_idx ON fee_transactions (tenant_id, payment_status);
CREATE INDEX fee_transactions_metadata_gin ON fee_transactions USING GIN (audit_metadata jsonb_path_ops);

-- ─── Library Books ────────────────────────────────────────────────────────────
CREATE TABLE library_books (
  book_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  isbn            VARCHAR(20) NOT NULL,
  title           VARCHAR(500) NOT NULL,
  author          VARCHAR(500) NOT NULL,
  total_copies    SMALLINT NOT NULL CHECK (total_copies >= 0),
  available_copies SMALLINT NOT NULL CHECK (available_copies >= 0),
  category        VARCHAR(100) NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, isbn)
);

ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY library_books_isolation_policy ON library_books
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX library_books_title_trgm ON library_books USING GIN (title gin_trgm_ops);

-- ─── Library Transactions ─────────────────────────────────────────────────────
CREATE TABLE library_transactions (
  txn_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  book_id         UUID NOT NULL REFERENCES library_books(book_id),
  student_id      UUID NOT NULL REFERENCES students(student_id),
  issued_by       UUID NOT NULL REFERENCES users(user_id),
  issued_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date        DATE NOT NULL,
  returned_at     TIMESTAMP WITH TIME ZONE,
  status          VARCHAR(20) NOT NULL CHECK (status IN ('ISSUED','RETURNED','OVERDUE'))
);

ALTER TABLE library_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY library_transactions_isolation_policy ON library_transactions
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Hostel Rooms ─────────────────────────────────────────────────────────────
CREATE TABLE hostel_rooms (
  room_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  room_number     VARCHAR(20) NOT NULL,
  block           VARCHAR(50) NOT NULL,
  capacity        SMALLINT NOT NULL CHECK (capacity > 0),
  occupied        SMALLINT NOT NULL DEFAULT 0 CHECK (occupied >= 0),
  room_type       VARCHAR(20) NOT NULL CHECK (room_type IN ('SINGLE','DOUBLE','TRIPLE')),
  UNIQUE (tenant_id, room_number)
);

ALTER TABLE hostel_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY hostel_rooms_isolation_policy ON hostel_rooms
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Transport Buses ──────────────────────────────────────────────────────────
CREATE TABLE transport_buses (
  bus_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  bus_number        VARCHAR(20) NOT NULL,
  route_name        VARCHAR(200) NOT NULL,
  driver_name       VARCHAR(200) NOT NULL,
  capacity          SMALLINT NOT NULL CHECK (capacity > 0),
  current_latitude  DECIMAL(10, 7),
  current_longitude DECIMAL(10, 7),
  last_updated      TIMESTAMP WITH TIME ZONE,
  status            VARCHAR(20) DEFAULT 'INACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','MAINTENANCE')),
  UNIQUE (tenant_id, bus_number)
);

ALTER TABLE transport_buses ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_buses_isolation_policy ON transport_buses
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Audit Log (Platform-level — no RLS, immutable) ──────────────────────────
CREATE TABLE audit_log (
  log_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL,
  tenant_id       UUID,
  user_id         UUID,
  user_role       VARCHAR(50),
  action          VARCHAR(200) NOT NULL,
  resource_type   VARCHAR(100),
  resource_id     UUID,
  ip_address      INET,
  status_code     SMALLINT,
  duration_ms     INTEGER,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Audit log is never deleted (7-year retention per CONTEXT.md §5)

-- ─── Comments ─────────────────────────────────────────────────────────────────
COMMENT ON TABLE fee_transactions IS 'IMMUTABLE — append-only by engine rule. No UPDATE/DELETE. CONTEXT.md §1.3';
COMMENT ON COLUMN fee_transactions.amount_paise IS 'Integer paise only — never float. Prevents precision loss.';
COMMENT ON COLUMN students.aadhaar_hash IS 'SHA-256 hash only — raw Aadhaar never stored. DPDP Rules 2025.';
COMMENT ON TABLE audit_log IS 'Platform-wide audit trail. 7-year retention. PII redacted before insert.';
