-- ============================================================================
-- EduCore ERP — 007: Admissions Workflow
-- Compliant with CONTEXT.md §1:
--   - All tenant-facing tables have RLS enabled
--   - Append-only enforcement where applicable (admission_documents audit trail)
--   - Application ID is human-readable: APP-XXXXXX
-- ============================================================================

-- ─── Admission Applications ───────────────────────────────────────────────────
CREATE TABLE admission_applications (
  application_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_code            VARCHAR(20) NOT NULL UNIQUE,  -- APP-XXXXXX human-readable ID
  tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

  -- Student Info
  student_first_name  VARCHAR(100) NOT NULL,
  student_last_name   VARCHAR(100) NOT NULL,
  date_of_birth       DATE NOT NULL,
  gender              VARCHAR(10) NOT NULL CHECK (gender IN ('MALE','FEMALE','OTHER')),
  applying_for_grade  VARCHAR(20) NOT NULL,          -- e.g. '10', '9', 'XI'
  academic_year       VARCHAR(20) NOT NULL DEFAULT '2026-27',
  previous_school     VARCHAR(500),
  previous_grade      VARCHAR(50),

  -- Parent/Guardian Info
  parent_name         VARCHAR(200) NOT NULL,
  parent_email        VARCHAR(254) NOT NULL,
  parent_phone        TEXT NOT NULL,                  -- encrypted at rest in prod
  parent_relation     VARCHAR(50) NOT NULL DEFAULT 'FATHER'
                        CHECK (parent_relation IN ('FATHER','MOTHER','GUARDIAN')),

  -- Address
  address             JSONB NOT NULL DEFAULT '{}',    -- {street, city, state, pincode}

  -- Status
  status              VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED'
                        CHECK (status IN (
                          'SUBMITTED',
                          'PENDING_DOCS',
                          'DOCS_RECEIVED',
                          'UNDER_REVIEW',
                          'APPROVED',
                          'REJECTED',
                          'COMPLETED'
                        )),
  rejection_reason    TEXT,
  reviewed_by         UUID REFERENCES users(user_id),
  reviewed_at         TIMESTAMP WITH TIME ZONE,

  -- Saga tracking
  saga_run_id         VARCHAR(255),                  -- Temporal workflow run ID
  student_id          UUID REFERENCES students(student_id), -- set after provisioning

  -- Metadata
  source              VARCHAR(20) NOT NULL DEFAULT 'ONLINE'
                        CHECK (source IN ('ONLINE', 'WALK_IN')),
  submitted_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY admission_applications_isolation ON admission_applications
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX idx_admissions_tenant ON admission_applications(tenant_id);
CREATE INDEX idx_admissions_status ON admission_applications(tenant_id, status);
CREATE INDEX idx_admissions_app_code ON admission_applications(app_code);
CREATE INDEX idx_admissions_parent_email ON admission_applications(tenant_id, parent_email);
CREATE INDEX idx_admissions_address_gin ON admission_applications USING GIN (address jsonb_path_ops);

-- ─── Admission Documents ──────────────────────────────────────────────────────
-- One row per required document type per application.
-- Append-only style: updates only allowed via status field, no deletes.
CREATE TABLE admission_documents (
  doc_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  application_id      UUID NOT NULL REFERENCES admission_applications(application_id) ON DELETE CASCADE,

  doc_type            VARCHAR(50) NOT NULL CHECK (doc_type IN (
                        'MARK_SHEET',      -- Previous year mark sheet
                        'TRANSFER_CERT',   -- Transfer Certificate
                        'ID_PROOF',        -- Aadhaar card (hash only stored)
                        'PHOTO',           -- Passport size photo
                        'BIRTH_CERT',      -- Birth certificate
                        'ADDRESS_PROOF'    -- Utility bill / Aadhaar address
                      )),
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED')),
  file_name           VARCHAR(255),                  -- original file name (metadata only)
  file_size_bytes     INTEGER,                       -- file size in bytes
  mime_type           VARCHAR(100),                  -- e.g. 'application/pdf', 'image/jpeg'
  storage_key         VARCHAR(512),                  -- S3/MinIO object key (path only)
  verified_by         UUID REFERENCES users(user_id),
  verified_at         TIMESTAMP WITH TIME ZONE,
  rejection_note      TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (application_id, doc_type)                  -- one row per doc type per application
);

ALTER TABLE admission_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY admission_documents_isolation ON admission_documents
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX idx_adm_docs_application ON admission_documents(application_id);
CREATE INDEX idx_adm_docs_tenant ON admission_documents(tenant_id);
CREATE INDEX idx_adm_docs_status ON admission_documents(tenant_id, status);

-- ─── Admission Preferences ────────────────────────────────────────────────────
-- Optional hostel + transport preferences declared during application.
CREATE TABLE admission_preferences (
  preference_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  application_id      UUID NOT NULL REFERENCES admission_applications(application_id) ON DELETE CASCADE,

  -- Hostel
  hostel_requested    BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_room_type VARCHAR(20) CHECK (preferred_room_type IN ('SINGLE','DOUBLE','TRIPLE')),

  -- Transport
  transport_requested BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_area      VARCHAR(200),                  -- pickup area / locality name
  preferred_route_id  UUID REFERENCES transport_routes(route_id),

  -- Notes
  special_needs       TEXT,                          -- dietary, medical, accessibility
  additional_notes    TEXT,

  created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (application_id)                            -- one preference record per application
);

ALTER TABLE admission_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY admission_preferences_isolation ON admission_preferences
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE INDEX idx_adm_prefs_application ON admission_preferences(application_id);
CREATE INDEX idx_adm_prefs_tenant ON admission_preferences(tenant_id);

-- ─── Grants ───────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON TABLE admission_applications TO educore_app;
GRANT SELECT, INSERT, UPDATE ON TABLE admission_documents TO educore_app;
GRANT SELECT, INSERT, UPDATE ON TABLE admission_preferences TO educore_app;

-- ─── Comments ─────────────────────────────────────────────────────────────────
COMMENT ON TABLE admission_applications IS 'Core admissions table. Status machine: SUBMITTED→PENDING_DOCS→DOCS_RECEIVED→UNDER_REVIEW→APPROVED/REJECTED→COMPLETED.';
COMMENT ON TABLE admission_documents IS 'Per-document tracking for each admission. File metadata only — actual files stored in S3/MinIO.';
COMMENT ON TABLE admission_preferences IS 'Optional hostel and transport preferences captured during the admission application process.';
COMMENT ON COLUMN admission_applications.app_code IS 'Human-readable application ID shown to parents (APP-XXXXXX format).';
COMMENT ON COLUMN admission_documents.storage_key IS 'S3/MinIO object key. Raw file content never stored in DB.';
