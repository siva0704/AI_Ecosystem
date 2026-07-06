-- ============================================================================
-- EduCore ERP — Migration 004: Fix RLS Policies (RESTRICTIVE → PERMISSIVE)
--
-- PROBLEM: All tenant isolation policies were created AS RESTRICTIVE.
-- PostgreSQL requires at least one PERMISSIVE policy to pass rows through.
-- With only RESTRICTIVE policies and no PERMISSIVE ones, NO rows ever pass.
--
-- FIX: Recreate all policies as PERMISSIVE (the default for CREATE POLICY).
-- A PERMISSIVE policy means: "allow access IF this condition is true."
-- Multiple PERMISSIVE policies are OR'd together.
-- RESTRICTIVE policies would AND on top — not needed here for MVP.
--
-- The correct pattern for multi-tenant row isolation:
--   PERMISSIVE: tenant_id = current_setting('app.current_tenant_id')::UUID
--   This means: "only rows whose tenant_id matches the session tenant are visible."
-- ============================================================================

-- ─── Students ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS students_isolation_policy ON students;
CREATE POLICY students_isolation_policy ON students
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Staff ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS staff_isolation_policy ON staff;
CREATE POLICY staff_isolation_policy ON staff
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Attendance Records ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS attendance_isolation_policy ON attendance_records;
CREATE POLICY attendance_isolation_policy ON attendance_records
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Fee Transactions ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS fee_transactions_isolation_policy ON fee_transactions;
CREATE POLICY fee_transactions_isolation_policy ON fee_transactions
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Library Books ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS library_books_isolation_policy ON library_books;
CREATE POLICY library_books_isolation_policy ON library_books
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Library Transactions ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS library_transactions_isolation_policy ON library_transactions;
CREATE POLICY library_transactions_isolation_policy ON library_transactions
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Hostel Rooms ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS hostel_rooms_isolation_policy ON hostel_rooms;
CREATE POLICY hostel_rooms_isolation_policy ON hostel_rooms
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Transport Buses ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS transport_buses_isolation_policy ON transport_buses;
CREATE POLICY transport_buses_isolation_policy ON transport_buses
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Assignments ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS assignments_isolation_policy ON assignments;
CREATE POLICY assignments_isolation_policy ON assignments
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ─── Users — allow same-tenant OR Tier-0 Super Admins ────────────────────────
DROP POLICY IF EXISTS users_isolation_policy ON users;
CREATE POLICY users_isolation_policy ON users
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
    OR tier = 0
  );

-- ─── Verify: All policies should now show permissive = PERMISSIVE ─────────────
SELECT tablename, policyname, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
