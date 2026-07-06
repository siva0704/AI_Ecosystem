# Multi-Tenant Context & Row-Level Security Matrix

## Session Wrapping
```sql
SET LOCAL app.current_tenant_id = '<uuid>';
```
Set at the top of every transaction, before any query executes, via PgBouncer transaction
mode pooling.

## RLS Enforcement
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY <table>_isolation_policy ON <table>
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
```
Applied to every tenant-facing table without exception — `fee_transactions`,
`extracted_entities`, and all future domain tables.

## Full Access Tier Matrix
| Tier | Persona | Scope |
|---|---|---|
| 0 | Platform Super Admin | Full cross-tenant, global billing, global feature flags |
| 1 | Institution Admin/Owner | Full access, single institution, all departments/campuses |
| 2 | Principal/VP | Academic leadership, cross-departmental data, staff oversight |
| 2 | HOD | Department-scoped academic oversight |
| 3 | Teacher | Class-specific attendance, homework, grading |
| 3 | Accountant/Finance Officer | Full financial module, fee collection, payroll, GST |
| 3 | HR Manager | Staff lifecycle, payroll initiation, DPDP consent tracking |
| 3 | Transport/Hostel/Library | Operational, limited to own non-academic domain |
| 4 | Student | Read-only, own academic/attendance/assignment data |
| 5 | Parent/Guardian | Read-only, ward-scoped fee/attendance/GPS data |
| 6 | External Auditor/Driver | Temporary, highly restricted (read-only compliance/GPS) |

See `/docs/qa/tenant-isolation-test-matrix.md` for the automated verification suite proving
these boundaries hold under test.
