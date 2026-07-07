# 🎓 EduCore ERP — AI-Native Education Management Platform

> **Multi-tenant, DPDP Act 2025-compliant ERP** for Indian K-12 and Higher-Ed institutions.  
> Built with Next.js 16, Fastify 5, PostgreSQL 17 (with RLS), Neo4j, Kong API Gateway, and Docker Compose.

---

## 🚦 Current Development Status — Phase 1 MVP

**Build Status:** ✅ All services built and running  
**Last Updated:** July 2026  
**Stack:** Fully containerized via Docker Compose (13 containers)

---

## 🏗️ Architecture Overview

```
Browser (Next.js 16)
    │
    ▼
Kong API Gateway (Port 8000) — Edge proxy, rate limiting
    │
    ▼
Fastify BFF / API Gateway (Port 4000) — Auth, RBAC, tenant context, route proxy
    │
    ├── Academic Service (Port 4003)  — Neo4j ontology + PostgreSQL
    ├── Core ERP Service (Port 4001)  — Finance, fee ledger
    ├── Platform Admin (Port 4002)    — Tier-0 tenant management
    ├── HR Service (Port 4004)        — Staff, leave, DPDP
    ├── Transport Service (Port 4005) — Routes, GPS, buses
    ├── Library Service (Port 4006)   — Books, transactions
    ├── Hostel Service (Port 4007)    — Rooms, allocations
    └── Notification Service (Port 4008) — Alerts, emails
    │
    ▼
PostgreSQL 17 (Port 5432) — Primary relational store with RLS
Neo4j 5.20 (Port 7687)    — Academic ontology graph
Valkey 7.2 (Port 6379)    — Session cache / rate limiting
EventStoreDB 24.2          — Audit event sourcing
Temporal 1.23              — Saga orchestration (fee workflows)
```

---

## 🐳 Running Locally

### Prerequisites
- Docker Desktop (Windows) with WSL2 backend
- 8 GB RAM minimum

### Start All Services
```bash
docker compose up -d --build
```

### Seed the Database (first run)
```bash
docker run --rm \
  -v $(pwd):/app \
  -w /app/backend/services/api-gateway \
  --network educore-erp_educore_net \
  -e DATABASE_URL="postgresql://postgres:9902850039@educore_postgres:5432/educore" \
  node:22-alpine npx ts-node src/db/migrate-and-seed.ts
```

### Access Points
| Service | URL |
|---------|-----|
| Frontend (EduCore ERP) | http://localhost:3000 |
| API Gateway (Fastify BFF) | http://localhost:4000 |
| Kong Edge Proxy | http://localhost:8000 |
| Kong Admin | http://localhost:8001 |
| Neo4j Browser | http://localhost:7474 |
| EventStoreDB UI | http://localhost:2113 |
| Temporal UI | http://localhost:8233 |

---

## 🔑 Demo Credentials

| Role | Email | Password | Tier |
|------|-------|----------|------|
| Super Admin | superadmin@educore.dev | super@123 | Tier 0 |
| Institution Admin | admin@demo.educore.dev | admin@123 | Tier 1 |
| Principal | principal@demo.educore.dev | principal@123 | Tier 2 |
| HOD | hod@demo.educore.dev | hod@123 | Tier 2 |
| Teacher | teacher@demo.educore.dev | teacher@123 | Tier 3 |
| Accountant | accountant@demo.educore.dev | accountant@123 | Tier 3 |
| HR Manager | hr@demo.educore.dev | hr@123 | Tier 3 |
| Transport Officer | transport@demo.educore.dev | transport@123 | Tier 3 |
| Hostel Warden | hostel@demo.educore.dev | hostel@123 | Tier 3 |
| Librarian | librarian@demo.educore.dev | library@123 | Tier 3 |
| Student | student@demo.educore.dev | student@123 | Tier 4 |
| Parent | parent@demo.educore.dev | parent@123 | Tier 5 |
| Auditor | auditor@demo.educore.dev | auditor@123 | Tier 6 |

---

## 🗄️ Database Schema (PostgreSQL 17 + Row-Level Security)

All tenant-facing tables enforce **RLS** — every query must set `app.current_tenant_id` via `SET LOCAL`.

### Core Tables (001_core_schema.sql)
| Table | Description | RLS | Notes |
|-------|-------------|-----|-------|
| `tenants` | Platform tenants | ❌ Platform-level | `kms_dek_arn` per tenant |
| `users` | All user accounts | ✅ Restrictive | bcrypt passwords, tier 0–6 |
| `staff` | Employee records | ✅ | DPDP consent flag |
| `classes` | Academic classes | ✅ | grade + section |
| `subjects` | Subjects catalog | ✅ | |
| `class_subjects` | Class↔Subject mapping | ✅ | |
| `students` | Student roster | ✅ | Aadhaar stored as SHA-256 hash only |
| `attendance_records` | Daily attendance | ✅ | PRESENT/ABSENT/LATE/EXCUSED |
| `assignments` | Homework/tasks | ✅ | |
| `fee_transactions` | Fee ledger | ✅ | **APPEND-ONLY** — UPDATE/DELETE blocked at engine level; amounts in PAISE (integer) |
| `library_books` | Book catalog | ✅ | GIN index for fuzzy search |
| `library_transactions` | Book issues/returns | ✅ | |
| `hostel_rooms` | Room inventory | ✅ | SINGLE/DOUBLE/TRIPLE |
| `transport_buses` | Fleet registry | ✅ | GPS lat/long fields |
| `audit_log` | Platform audit trail | ❌ | Immutable, 7-year retention |

### Extension Tables (006_hr_extensions.sql)
| Table | Description | RLS | Notes |
|-------|-------------|-----|-------|
| `leave_requests` | Staff leave management | ✅ | PENDING/APPROVED/REJECTED/CANCELLED |
| `dpdp_consent_log` | DPDP Act consent audit | ✅ | **APPEND-ONLY** — immutable by rule |
| `hostel_allocations` | Student room allocations | ✅ | Per academic year |
| `transport_routes` | Bus routes with stops (JSONB) | ✅ | |
| `bus_assignments` | Student ↔ bus ↔ route | ✅ | Per academic year |

### Special Tables
| Table | Description |
|-------|-------------|
| `refresh_tokens` | Server-side refresh token store; rotated on every use |

---

## 🌐 API Routes (Fastify BFF — Port 4000)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email + password → JWT (15m) + httpOnly refresh cookie (7d) |
| POST | `/api/auth/refresh` | Silent token rotation using httpOnly cookie |
| POST | `/api/auth/logout` | Revoke all refresh tokens |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/auth/demo-users` | List demo credentials (dev mode only) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Role-aware aggregated stats |
| GET | `/api/dashboard/announcements` | Institution announcements |
| GET | `/api/dashboard/attendance/today` | Today's attendance snapshot |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List students (RLS-filtered) |
| GET | `/api/students/:id` | Student detail |
| GET | `/api/students/:id/attendance` | Student attendance history |
| GET | `/api/students/:id/fees` | Student fee transactions |

### Staff
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff` | List staff (RLS-filtered) |

### HR
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hr/staff` | Staff directory with DPDP consent status |
| POST | `/api/hr/staff` | Create new staff record |
| GET | `/api/hr/leave` | Leave requests list |
| POST | `/api/hr/leave` | Submit leave request |
| PATCH | `/api/hr/leave/:id` | Approve/reject leave (HR/Principal) |
| GET | `/api/hr/dpdp` | DPDP pending consent list |
| POST | `/api/hr/dpdp/:staffId/consent` | Record DPDP consent |

### Finance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fees` | Fee transactions ledger |
| POST | `/api/fees` | Record fee payment (appends only) |
| GET | `/api/fees/summary` | Aggregated fee collection stats |

### Academic
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/academic/classes` | Classes list |
| GET | `/api/academic/subjects` | Subjects catalog |
| GET | `/api/academic/attendance` | Attendance records |
| POST | `/api/academic/attendance` | Mark attendance |
| GET | `/api/academic/assignments` | Assignments list |

### Library
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/library/books` | Book catalog |
| GET | `/api/library/transactions` | Issue/return transactions |
| POST | `/api/library/issue` | Issue a book |
| POST | `/api/library/return` | Return a book |

### Transport
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transport/buses` | Fleet list with GPS status |
| GET | `/api/transport/routes` | Routes with stops |

### Hostel
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hostel/rooms` | Room availability |
| GET | `/api/hostel/allocations` | Student allocations |

---

## 🖥️ Frontend — Pages & Dashboards

All dashboards use `DashboardShell` + `Sidebar` component driven by RBAC role config.

| Route | Role | Status |
|-------|------|--------|
| `/login` | All | ✅ Functional — demo credential picker |
| `/admin/dashboard` | INSTITUTION_ADMIN | ✅ Functional |
| `/admin/academic` | INSTITUTION_ADMIN | ✅ Functional |
| `/admin/academic/classes` | INSTITUTION_ADMIN | ✅ Functional |
| `/principal/dashboard` | PRINCIPAL | ✅ Functional |
| `/hod/dashboard` | HOD | ✅ Functional |
| `/teacher/dashboard` | TEACHER | ✅ Functional |
| `/teacher/classes` | TEACHER | ✅ Functional |
| `/teacher/attendance` | TEACHER | ✅ Functional |
| `/hr/dashboard` | HR_MANAGER | ✅ Functional |
| `/hr/staff` | HR_MANAGER | ✅ Functional |
| `/hr/leave` | HR_MANAGER | ✅ Functional |
| `/hr/dpdp` | HR_MANAGER | ✅ Functional |
| `/finance/dashboard` | ACCOUNTANT | ✅ Functional |
| `/finance/fees` | ACCOUNTANT | ✅ Functional |
| `/transport/dashboard` | TRANSPORT_OFFICER | ✅ Functional |
| `/hostel/dashboard` | HOSTEL_WARDEN | ✅ Functional |
| `/library/dashboard` | LIBRARIAN | ✅ Functional |
| `/library/transactions` | LIBRARIAN | ✅ Functional |
| `/student/dashboard` | STUDENT | ✅ Functional |
| `/parent/dashboard` | PARENT | ✅ Functional |
| `/audit/dashboard` | AUDITOR | ✅ Functional |
| `/platform/dashboard` | SUPER_ADMIN | ✅ Functional |
| `/platform/tenants/onboard` | SUPER_ADMIN | ✅ Functional |

---

## 🔐 Security Architecture

### Absolute Laws (CONTEXT.md §1)
1. **No AI financial arithmetic** — all fee calculations in integer paise; AI only summarizes
2. **Mandatory RLS** — every tenant table has `RESTRICTIVE` RLS policy; no bypass without SECURITY DEFINER function
3. **Bounded context isolation** — each microservice only queries its own domain tables
4. **DPDP Act 2025** — Aadhaar stored as SHA-256 hash only; explicit consent logged immutably
5. **Fee immutability** — `fee_transactions` is append-only at the PostgreSQL engine level

### RBAC Tiers
| Tier | Role | Dashboard Color |
|------|------|----------------|
| 0 | SUPER_ADMIN | Slate |
| 1 | INSTITUTION_ADMIN | Indigo |
| 2 | PRINCIPAL, HOD | Blue |
| 3 | TEACHER, ACCOUNTANT, HR_MANAGER, TRANSPORT_OFFICER, HOSTEL_WARDEN, LIBRARIAN | Pink/Amber |
| 4 | STUDENT | Green |
| 5 | PARENT | Purple |
| 6 | AUDITOR | Gray |

### Auth Flow
```
Login → authenticate_user() SECURITY DEFINER (bypasses RLS for email lookup)
      → bcrypt.compare()
      → JWT (15m) issued
      → Refresh token (SHA-256 hashed) stored in refresh_tokens table
      → httpOnly cookie (7d, sameSite=strict)
      → All subsequent requests: SET LOCAL app.current_tenant_id before queries
```

---

## 📦 Seeded Demo Data

| Entity | Count | Details |
|--------|-------|---------|
| Tenants | 1 | Greenfield Academy (demo) |
| Users | 13 | All roles covered |
| Classes | 3 | 10A, 10B, 9A |
| Students | 5 | Arjun, Priya, Rohan, Asha, Kiran |
| Staff | 4 | Teacher, Accountant, HR Manager, Transport Officer |
| Library Books | 3 | Algorithms, Physics, NCERT Maths |
| Hostel Rooms | 3 | Block A & B rooms |
| Transport Buses | 2 | KA-01-AB-1234, KA-02-CD-5678 |
| Fee Transactions | 3 | Mix of CAPTURED and PENDING |

---

## 🗺️ Roadmap

### Phase 1 MVP — IN PROGRESS
- [x] Multi-tenant PostgreSQL with RLS
- [x] JWT auth with refresh token rotation
- [x] Role-based sidebar navigation (13 roles)
- [x] Admissions: Application portal, Walk-in logic, Documents tracking
- [x] HR: Staff directory, leave management, DPDP consent
- [x] Finance: Fee ledger (append-only)
- [x] Academic: Classes, subjects, attendance
- [x] Library: Books, issue/return
- [x] Transport: Fleet, routes
- [x] Hostel: Rooms, allocations
- [x] Docker Compose full-stack deployment
- [x] Kong API gateway routing

### Phase 2 — PLANNED
- [ ] Neo4j academic ontology (curriculum graph)
- [ ] Temporal saga for fee payment workflows
- [ ] AI-powered attendance anomaly detection
- [ ] Parent portal with real-time notifications
- [ ] Timetable generation engine
- [ ] Mobile PWA

---

## 📁 Project Structure

```
educore-erp/
├── backend/services/
│   ├── api-gateway/        # Fastify BFF — auth, RBAC, proxy (Port 4000)
│   ├── academic-service/   # Neo4j + PostgreSQL academic domain (Port 4003)
│   ├── core-erp/           # Finance domain (Port 4001)
│   ├── platform-admin/     # Tier-0 platform management (Port 4002)
│   ├── hr-service/         # HR domain (Port 4004)
│   ├── transport-service/  # Transport domain (Port 4005)
│   ├── library-service/    # Library domain (Port 4006)
│   ├── hostel-service/     # Hostel domain (Port 4007)
│   └── notification-service/ # Alerts (Port 4008)
├── database/schemas/
│   ├── 001_core_schema.sql  # Core tables + RLS policies
│   ├── 002_app_role.sql     # educore_app role grants
│   ├── 003_auth_function.sql # SECURITY DEFINER authenticate_user()
│   ├── 004_fix_rls_permissive.sql # RLS policy corrections
│   ├── 005_refresh_tokens.sql # Server-side refresh token store
│   ├── 006_hr_extensions.sql # HR, DPDP, hostel, transport tables
│   └── 007_admissions.sql   # Admissions tables, RLS policies
├── devops/infrastructure/
│   └── kong.yml            # Kong declarative config
├── frontend/apps/web/      # Next.js 16 frontend (Port 3000)
│   └── src/app/            # 28 pages across 14 role dashboards
└── docker-compose.yml      # Full-stack orchestration
```

---

## ⚖️ Compliance

- **DPDP Act 2025 (India)**: Aadhaar hashed, explicit consent logged immutably, PII marked
- **PCI-DSS aligned**: Amounts in paise, append-only fee ledger, audit trail
- **RLS everywhere**: No cross-tenant data leakage possible at the database level
