-- ============================================================================
-- EduCore ERP — PostgreSQL 17 Application Role Setup (Migration 002)
-- 
-- Creates dedicated `educore_app` database role with minimal privileges.
-- This role is NOT a superuser, so RLS policies are enforced at the engine
-- level — a code path that forgets withTenantContext() will be BLOCKED by
-- the database itself, not just by application logic.
--
-- Run once on a fresh educore database after 001_core_schema.sql
-- CONTEXT.md §4 — Security Absolute Laws
-- ============================================================================

-- 1. Create the application role (no superuser, no bypass RLS, no createdb)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'educore_app') THEN
    CREATE ROLE educore_app WITH
      LOGIN
      PASSWORD 'educore_app_dev_password'   -- override in production via vault
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOBYPASSRLS;                           -- THIS IS THE CRITICAL LINE
    RAISE NOTICE 'Role educore_app created.';
  ELSE
    RAISE NOTICE 'Role educore_app already exists, skipping.';
  END IF;
END $$;

-- 2. Grant CONNECT on the database
GRANT CONNECT ON DATABASE educore TO educore_app;

-- 3. Grant USAGE on the public schema
GRANT USAGE ON SCHEMA public TO educore_app;

-- 4. Grant DML privileges on all tenant-scoped tables
--    (RLS policies will further restrict at row level)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  tenants,
  users,
  students,
  staff,
  attendance_records,
  fee_transactions,
  library_books,
  library_transactions,
  hostel_rooms,
  transport_buses,
  assignments,
  audit_log
TO educore_app;

-- 5. Grant USAGE on all sequences (for DEFAULT gen_random_uuid() and SERIAL types)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO educore_app;

-- 6. Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO educore_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO educore_app;

-- 7. Revoke the fee_transactions DELETE and UPDATE from the app role.
--    fee_transactions is APPEND-ONLY (CONTEXT.md §1.3 — Immutable Ledger).
--    The engine-level rule blocks UPDATE/DELETE already, but defense in depth.
REVOKE UPDATE, DELETE ON TABLE fee_transactions FROM educore_app;

-- 8. Audit log is INSERT-only from app, SELECT for auditors (read via reports)
REVOKE UPDATE, DELETE ON TABLE audit_log FROM educore_app;

-- Verification query (run manually to confirm setup)
-- SELECT rolname, rolsuper, rolbypassrls, rolcanlogin FROM pg_roles WHERE rolname = 'educore_app';
-- SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE grantee = 'educore_app' ORDER BY table_name, privilege_type;
