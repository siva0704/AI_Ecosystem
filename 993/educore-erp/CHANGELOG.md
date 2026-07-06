# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### In Progress
- Full CRUD API endpoints per domain (Hostel, Transport remaining)
- UI data-entry screens per role (attendance, fees, assignments, etc.)
- GitHub Actions CI/CD pipeline

---

## [0.2.0-alpha] — 2026-07-06

### Fixed
- **Critical RLS Bug** — `SET LOCAL app.current_tenant_id = $1` syntax error in PostgreSQL.
  PostgreSQL's `SET LOCAL` does not accept parameterized bind values (`$1`). 
  Fixed by replacing with `SELECT set_config('app.current_tenant_id', $1, true)` which is
  a regular SQL function supporting bind parameters (equivalent to `SET LOCAL` when `is_local=true`).

### Added
- **Live PostgreSQL 17 Integration** via Drizzle ORM + `withTenantContext()` wrapper:
  - All API routes (students, staff, attendance, fees, library) now execute against live PostgreSQL
  - RLS session variable set via `set_config()` inside every database transaction
  - Async/await pattern throughout all Fastify route handlers
- **UUID ↔ Short-ID Mapper** — `mapShortIdToUuid()` / `mapUuidToShortId()` for reconciling
  developer-readable IDs (`stu-001`) with strict PostgreSQL UUID primary keys
- **Database Migration + Seed Script** (`migrate-and-seed.ts`):
  - Creates all core tables (tenants, users, students, staff, attendance, fees, library)
  - Seeds 1 demo tenant (Greenfield Academy) and 13 demo users with bcrypt-hashed passwords
  - Seeds 5 students, 3 staff, 5 library books, 3 fee transactions, 2 attendance records
- **dotenv Integration** — `DATABASE_URL` loaded from `.env` before any DB connection code imports
- **bcryptjs Authentication** — login compares password against hashed value from PostgreSQL
- **Zero TypeScript Compilation Errors** — `npx tsc --noEmit` passes clean

---

## [0.1.0-alpha] — 2026-07-06

### Added
- **Virtual IT Company Structure** — multi-layer folder organization with department domains
- **Agentic Governance** — `.agents/.rules/global.md`, `.agents/.workflows/phase-1-mvp.md`, MCP server config
- **Fastify API Gateway** (port 4000) with:
  - JWT authentication (HS256, 8h expiry)
  - CORS, rate limiting (100 req/min)
  - 13 demo users across all 7 RBAC tiers (Tier 0–6)
  - POST `/api/auth/login` — returns JWT with role, tier, tenant_id, menus
  - GET `/api/auth/me` — introspect current user
  - GET `/api/auth/demo-users` — dev credential panel feed
  - GET `/api/dashboard` — role-scoped mock dashboard data
  - GET `/health` — liveness probe
- **Next.js 16 Frontend** (port 3000) with:
  - Animated dark-theme login page with live demo credentials panel
  - Tier filter for credential browser (All / Tier 0–6)
  - Click-to-fill quick login cards
  - JWT auth context with localStorage persistence
  - Role-aware Sidebar (dynamic menus per role, badge counts, tier indicator)
  - Topbar with live date/time, DEV MODE badge, role badge
  - DashboardShell — auth guard + RBAC route protection (`requiredRole` prop)
  - StatCard, QuickAction, AlertBanner — reusable dashboard widgets
  - **13 role dashboards** (Platform SuperAdmin, Institution Admin, Principal, HOD, Teacher, Accountant, HR Manager, Transport Officer, Hostel Warden, Librarian, Student, Parent, External Auditor)
- **CONTEXT.md Compliance Notes** embedded in UI (immutable ledger warning, DPDP alerts)
- **Documentation root** (`educore-docs/`) with full architecture, security, and product specs

### Architecture
- 7-tier RBAC (Tier 0–6) mirroring RLS security matrix from `rls-tenant-matrix.md`
- Tenant isolation via `tenant_id` in every JWT + RLS policy pattern ready for production DB
- No AI-generated financial arithmetic anywhere in codebase (Absolute Law #1)

---

## [0.0.1] — 2026-07-06

### Added
- Initial project scaffolding
- `educore-docs/` documentation root with CONTEXT.md, AGENTS.md, and 8 track directories
