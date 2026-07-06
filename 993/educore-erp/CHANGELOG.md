# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### In Progress
- Database schema (PostgreSQL 17 + Drizzle ORM + RLS policies)
- Full CRUD API endpoints per domain
- UI data-entry screens per role (attendance, fees, assignments, etc.)
- GitHub Actions CI/CD pipeline

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
