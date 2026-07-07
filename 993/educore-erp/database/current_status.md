# EduCore ERP — Current Development Status

**Last Updated:** 7 July 2026  
**Phase:** Phase 1 MVP — In Progress  
**Environment:** Local Docker Compose (All services running)

---

## ✅ Fully Operational Services

| Container | Port | Status | Notes |
|-----------|------|--------|-------|
| `educore_web` | 3000 | ✅ Running | Next.js 16 frontend, 28 routes |
| `educore_api_gateway` | 4000 | ✅ Running | Fastify BFF, auth, RBAC |
| `educore_core_erp` | 4001 | ✅ Running | Finance/fee microservice |
| `educore_platform_admin` | 4002 | ✅ Running | Tier-0 platform management |
| `educore_academic_service` | 4003 | ✅ Running | Neo4j + PostgreSQL |
| `educore_hr_service` | 4004 | ✅ Running | Staff, leave, DPDP |
| `educore_transport_service` | 4005 | ✅ Running | Buses, routes |
| `educore_library_service` | 4006 | ✅ Running | Books, transactions |
| `educore_hostel_service` | 4007 | ✅ Running | Rooms, allocations |
| `educore_notification_service` | 4008 | ✅ Running | Alert delivery |
| `educore_postgres` | 5432 | ✅ Running | PostgreSQL 17 + RLS |
| `educore_neo4j` | 7474/7687 | ✅ Running | Graph DB |
| `educore_valkey` | 6379 | ✅ Running | Cache |
| `educore_eventstore` | 2113 | ✅ Running | Event sourcing |
| `educore_temporal` | 7233/8233 | ✅ Running | Saga orchestration |
| `educore_kong` | 8000/8001 | ✅ Running | Edge API gateway |

---

## 🗄️ Database Status

**Host:** educore_postgres (Docker) — PostgreSQL 17-alpine  
**Database:** `educore`  
**App Role:** `educore_app` (limited permissions, RLS-compliant)

### Migrations Applied
| File | Status |
|------|--------|
| 001_core_schema.sql | ✅ Applied |
| 002_app_role.sql | ✅ Applied |
| 003_auth_function.sql | ✅ Applied |
| 004_fix_rls_permissive.sql | ✅ Applied |
| 005_refresh_tokens.sql | ✅ Applied |
| 006_hr_extensions.sql | ✅ Applied |

### Seeded Data
| Entity | Records |
|--------|---------|
| Tenants | 1 (Greenfield Academy) |
| Users | 13 (all roles) |
| Classes | 3 (10A, 10B, 9A) |
| Students | 5 |
| Staff | 4 |
| Library Books | 3 |
| Hostel Rooms | 3 |
| Transport Buses | 2 |
| Fee Transactions | 3 |

---

## 🖥️ Frontend Status

**Framework:** Next.js 16.2.10 (Turbopack, production build)  
**URL:** http://localhost:3000

### Routes Compiled & Functional
All 28 routes compiled successfully. Unified dark sidebar (`DashboardShell`) used across all dashboards — no duplicate layout files remain.

| Module | Route | Status |
|--------|-------|--------|
| Auth | /login | ✅ Login working, demo creds panel |
| Admin | /admin/dashboard | ✅ Stats fetching from API |
| Admin | /admin/academic | ✅ |
| Admin | /admin/academic/classes | ✅ |
| Principal | /principal/dashboard | ✅ |
| HOD | /hod/dashboard | ✅ |
| Teacher | /teacher/dashboard | ✅ |
| Teacher | /teacher/classes | ✅ |
| Teacher | /teacher/attendance | ✅ |
| HR | /hr/dashboard | ✅ Staff stats, DPDP alert |
| HR | /hr/staff | ✅ Staff directory |
| HR | /hr/leave | ✅ Leave request list |
| HR | /hr/dpdp | ✅ DPDP consent review |
| Finance | /finance/dashboard | ✅ Fee ledger overview |
| Finance | /finance/fees | ✅ Transaction list |
| Transport | /transport/dashboard | ✅ Fleet + live status |
| Hostel | /hostel/dashboard | ✅ Room block status |
| Library | /library/dashboard | ✅ Overdue returns |
| Library | /library/transactions | ✅ Issue/return log |
| Student | /student/dashboard | ✅ |
| Parent | /parent/dashboard | ✅ |
| Audit | /audit/dashboard | ✅ |
| Platform | /platform/dashboard | ✅ Tenant management |
| Platform | /platform/tenants/onboard | ✅ |

---

## 🌐 API Gateway Status

**Framework:** Fastify 5.x  
**URL:** http://localhost:4000  

### Route Modules Implemented
| Module | File | Endpoints |
|--------|------|-----------|
| Auth | routes/auth.ts | 5 endpoints (login, refresh, logout, me, demo-users) |
| Dashboard | routes/dashboard.ts | 3 endpoints |
| Students | routes/students.ts | 4 endpoints |
| Staff | routes/staff.ts | 2 endpoints |
| HR | routes/hr.ts | 7 endpoints (staff, leave, DPDP) |
| Fees | routes/fees.ts | 3 endpoints |
| Academic | routes/academic.ts | 5 endpoints |
| Attendance | routes/attendance.ts | 2 endpoints |
| Library | routes/library.ts | 4 endpoints |
| Transport | routes/transport.ts | 2 endpoints |
| Hostel | routes/hostel.ts | 2 endpoints |

### Security
- JWT (15 min access token) + httpOnly refresh cookie (7 days, rotated on use)
- All routes use `withTenantContext()` middleware — injects `SET LOCAL app.current_tenant_id` before every DB query
- RBAC enforced per-route via `getRoleConfig()` tier checks

---

## 📋 Known Gaps / Pending Work

| Area | Issue | Priority |
|------|-------|----------|
| Neo4j | Academic ontology not yet populated | Medium |
| Temporal | Fee saga workflows not yet wired to frontend | Medium |
| Notifications | Service running but no email/SMS adapter connected | Low |
| Parent Portal | UI exists, data fetching stubs only | Medium |
| Audit Dashboard | Fetches audit_log (empty in demo) | Low |
| PWA | Not yet implemented | Low |
| Tests | No automated test suite yet | High |

---

## 📁 Modified Files (This Session)

### Created / Modified
- `database/schemas/005_refresh_tokens.sql` — Removed invalid sequence grant
- `database/schemas/006_hr_extensions.sql` — Created: HR/DPDP/Hostel/Transport extension tables
- `backend/services/api-gateway/src/db/migrate-and-seed.ts` — Updated to run all 6 schema files + fixed execution condition
- `backend/services/api-gateway/src/routes/hr.ts` — Full HR route suite
- `backend/services/api-gateway/src/routes/hostel.ts` — Hostel routes
- `backend/services/api-gateway/src/routes/transport.ts` — Transport routes
- `frontend/apps/web/.dockerignore` — Created: excludes node_modules/.next from Docker context (build time: 168s → 25s)
- `frontend/apps/web/src/app/hr/dashboard/page.tsx` — HR dashboard page
- `frontend/apps/web/src/app/hr/staff/page.tsx` — HR staff directory
- `frontend/apps/web/src/app/hr/leave/page.tsx` — Leave management
- `frontend/apps/web/src/app/hr/dpdp/page.tsx` — DPDP consent review
- `.dockerignore` — Root-level Docker context exclusions

### Deleted (Duplicate Layouts)
- `frontend/apps/web/src/app/hr/layout.tsx`
- `frontend/apps/web/src/app/library/layout.tsx`
- `frontend/apps/web/src/app/hostel/layout.tsx`
- `frontend/apps/web/src/app/transport/layout.tsx`
- `frontend/apps/web/src/app/principal/layout.tsx`
