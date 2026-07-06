# EduCore ERP — AI-Native Multi-Tenant Education Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Phase](https://img.shields.io/badge/Phase-1%20MVP-blue)](CHANGELOG.md)
[![Security: NIST CSF 2.0](https://img.shields.io/badge/Security-NIST%20CSF%202.0-green)](docs/security)
[![Compliance: DPDP 2025](https://img.shields.io/badge/Compliance-DPDP%202025-orange)](docs/security)

## Overview

EduCore is an AI-native, multi-tenant SaaS ERP for the Indian education sector (K-12 and higher-ed). It is modeled as a hierarchical knowledge graph, cross-linked to student/staff/parent nodes and operational domains (Transport, Hostel, Library, Examination, Finance, HR, Assets, Compliance).

**Governing Frameworks:** NIST CSF 2.0 · DPDP Rules 2025 · OWASP GenAI Security (LLM06)

---

## Repository Structure

```
educore-erp/
├── .agents/                   # AI agent governance rules & workflows
│   ├── .rules/global.md       # Global coding standards for all agents
│   ├── .workflows/            # Phase-specific agentic workflows
│   └── mcp-servers/           # MCP server configurations
├── backend/
│   └── services/
│       └── api-gateway/       # Fastify REST API (port 4000)
│           ├── src/
│           │   ├── db/        # Schema, migrations, seed data
│           │   ├── middleware/ # RBAC, auth, audit logging
│           │   ├── routes/    # Domain-specific API routes
│           │   └── schemas/   # Zod validation schemas
│           └── package.json
├── frontend/
│   └── apps/
│       └── web/               # Next.js 16 App Router (port 3000)
│           └── src/
│               ├── app/       # Role-based route groups
│               ├── components/ # Shared UI components
│               └── lib/       # Auth, RBAC, types, utilities
├── database/                  # SQL schemas, RLS policies, migrations
├── devops/                    # Terraform, Kubernetes, CI/CD
└── version_control/           # GitOps policies & branching strategy
```

---

## Quick Start (Dev Mode)

### Prerequisites
- Node.js 20+
- npm 10+
- (Optional) PostgreSQL 17 for real DB testing

### 1. Start the Backend API
```bash
cd backend/services/api-gateway
npm install
npm run dev
# API running at http://localhost:4000
# Health: http://localhost:4000/health
# Demo users: http://localhost:4000/api/auth/demo-users
```

### 2. Start the Frontend
```bash
cd frontend/apps/web
npm install
npm run dev
# App running at http://localhost:3000
```

### 3. Login
Navigate to `http://localhost:3000` — you will see the login page with a demo credentials panel.

---

## Demo Credentials (DEV ONLY — NOT FOR PRODUCTION)

> ⚠️ These credentials exist purely for local developer testing. Production auth uses HashiCorp Vault + SSO.

| Role | Email | Password | Access Tier |
|------|-------|----------|-------------|
| Platform Super Admin | superadmin@educore.dev | super@123 | Tier 0 |
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
| External Auditor | auditor@demo.educore.dev | auditor@123 | Tier 6 |

---

## Technology Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 16 / React 19 (App Router, SSR), TailwindCSS v4 |
| Backend | Fastify 5, TypeScript, Zod validation |
| Database | PostgreSQL 17, Drizzle ORM, Row-Level Security |
| Auth | JWT (HS256), bcrypt password hashing |
| API Security | CORS, rate limiting, helmet, request audit logging |

**Production stack** pins (see [CONTEXT.md](../educore-docs/CONTEXT.md)):
Kong API Gateway · Linkerd service mesh · EventStoreDB · Temporal.io · ClickHouse OLAP · Neo4j graph · Valkey cache · AWS EKS

---

## Security

- All tenant-facing tables enforce **Row-Level Security (RLS)** via `app.current_tenant_id`
- Financial ledgers (`fee_transactions`) are **append-only** at the DB engine level
- JWT tokens embed `tenant_id`, `role`, and `tier` — validated on every request
- No AI-generated financial arithmetic (Absolute Law #1 per CONTEXT.md)
- See [SECURITY.md](SECURITY.md) for vulnerability reporting

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **v0.x.x** — Alpha / pre-production development
- **v1.0.0** — Production-ready Phase 1 MVP launch

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

## License

MIT © 2026 EduCore Platform

---

*Built with [Antigravity IDE](https://antigravity.dev) — AI-native agentic development*
