-- ============================================================================
-- EduCore ERP — 006: HR & Operational Domain Extensions
-- Compliant with CONTEXT.md §1:
--   - All tenant-facing tables have RLS enabled
--   - Append-only enforcement where applicable
--   - Currency stored as integer PAISE (never floats)
--   - NO UPDATE/DELETE on consent_log (audit immutability)
-- ============================================================================

-- ─── Leave Requests ──────────────────────────────────────────────────────────
CREATE TABLE leave_requests (
  leave_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  staff_id         UUID NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
  leave_type       VARCHAR(50) NOT NULL CHECK (leave_type IN (
                     'CASUAL','SICK','EARNED','MATERNITY','PATERNITY','UNPAID','OTHER'
                   )),
  from_date        DATE NOT NULL,
  to_date          DATE NOT NULL,
  days_count       SMALLINT NOT NULL CHECK (days_count > 0),
  reason           TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  reviewed_by      UUID REFERENCES users(user_id),
  reviewed_at      TIMESTAMP WITH TIME ZONE,
  review_note      TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT leave_dates_valid CHECK (to_date >= from_date)
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY leave_requests_isolation ON leave_requests
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(tenant_id, status);

-- ─── DPDP Consent Log (APPEND-ONLY — IMMUTABLE) ──────────────────────────────
CREATE TABLE dpdp_consent_log (
  consent_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  staff_id           UUID NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
  data_category      VARCHAR(100) NOT NULL,   -- e.g. 'BIOMETRIC','FINANCIAL','HEALTH'
  consent_given      BOOLEAN NOT NULL,
  consent_version    VARCHAR(20) NOT NULL DEFAULT '1.0',
  ip_address         VARCHAR(50),
  user_agent         VARCHAR(512),
  recorded_by        UUID REFERENCES users(user_id),
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  -- No updated_at — this table is append-only
);

ALTER TABLE dpdp_consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY dpdp_consent_log_isolation ON dpdp_consent_log
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- Immutability: block UPDATE and DELETE on consent log (DPDP audit requirement)
CREATE RULE dpdp_deny_update AS ON UPDATE TO dpdp_consent_log DO INSTEAD NOTHING;
CREATE RULE dpdp_deny_delete AS ON DELETE TO dpdp_consent_log DO INSTEAD NOTHING;

CREATE INDEX idx_dpdp_consent_tenant ON dpdp_consent_log(tenant_id);
CREATE INDEX idx_dpdp_consent_staff ON dpdp_consent_log(staff_id);

-- ─── Hostel Allocations ───────────────────────────────────────────────────────
CREATE TABLE hostel_allocations (
  allocation_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  room_id          UUID NOT NULL REFERENCES hostel_rooms(room_id) ON DELETE RESTRICT,
  student_id       UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  academic_year    VARCHAR(20) NOT NULL DEFAULT '2026-27',
  check_in_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  check_out_date   DATE,
  status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','VACATED','TRANSFERRED')),
  allocated_by     UUID REFERENCES users(user_id),
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, student_id, academic_year)
);

ALTER TABLE hostel_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY hostel_allocations_isolation ON hostel_allocations
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX idx_hostel_alloc_tenant ON hostel_allocations(tenant_id);
CREATE INDEX idx_hostel_alloc_room ON hostel_allocations(room_id);
CREATE INDEX idx_hostel_alloc_student ON hostel_allocations(student_id);

-- ─── Transport Routes ─────────────────────────────────────────────────────────
CREATE TABLE transport_routes (
  route_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  route_name       VARCHAR(200) NOT NULL,
  origin           VARCHAR(200) NOT NULL,
  stops            JSONB NOT NULL DEFAULT '[]',  -- array of stop names
  estimated_mins   SMALLINT,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_routes_isolation ON transport_routes
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX idx_transport_routes_tenant ON transport_routes(tenant_id);

-- ─── Bus Assignments (student ↔ route ↔ bus) ─────────────────────────────────
CREATE TABLE bus_assignments (
  assignment_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  bus_id           UUID NOT NULL REFERENCES transport_buses(bus_id) ON DELETE RESTRICT,
  route_id         UUID NOT NULL REFERENCES transport_routes(route_id) ON DELETE RESTRICT,
  academic_year    VARCHAR(20) NOT NULL DEFAULT '2026-27',
  pickup_stop      VARCHAR(200),
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, student_id, academic_year)
);

ALTER TABLE bus_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY bus_assignments_isolation ON bus_assignments
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX idx_bus_assignments_tenant ON bus_assignments(tenant_id);
CREATE INDEX idx_bus_assignments_student ON bus_assignments(student_id);
