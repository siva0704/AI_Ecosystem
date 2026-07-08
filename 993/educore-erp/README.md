# EduCore ERP

A modern, multi-tenant Education Enterprise Resource Planning (ERP) platform built with Fastify, Drizzle ORM, PostgreSQL, and Next.js.

## Current Development Status (July 2026)

EduCore has successfully reached **Phase 6 Implementation**. All core bounded contexts and forms as defined in the `module-catalog.md` and `forms-index.md` are backed by PostgreSQL schemas and fully operational CRUD endpoints.

### Key Achievements
- **Multi-Tenant Architecture**: Strict Data Isolation using Drizzle ORM (`withTenantContext`).
- **Role-Based Access Control (RBAC)**: Fine-grained tier-based access across all modules (Super Admin to Student/Parent levels).
- **Core Modules Fully Migrated from Mock to PostgreSQL Database**:
  1. HR & Staff Management
  2. Student Admissions
  3. Finance & Append-Only Fee Ledgers (with Concessions)
  4. Hostel & Transport Allocation
  5. Library Issue/Return Circulation
  6. Compliance (DPDP Consents & Grievance Ticketing)
  7. Academic Records (Exam Corrections & TC Requests)

## Tech Stack
- **Backend**: Fastify (Node.js), Drizzle ORM, Zod Validation, PostgreSQL 17.
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS.
- **Infrastructure**: Docker, Valkey (In-Memory Cache).

## Quick Start
1. Ensure Docker is running.
2. `docker-compose up -d` to spin up PostgreSQL and Valkey.
3. Apply database schemas via `create_missing_tables.sql`.
4. Run Backend: `cd backend/services/api-gateway && npm run dev`.
5. Run Frontend: `cd frontend/apps/web && npm run dev`.

*Refer to `backend/current_status.md` for a detailed breakdown of the current data structures and available CRUD endpoints.*
