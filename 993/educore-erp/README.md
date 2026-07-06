# EduCore ERP — AI-Native Multi-Tenant Education Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Phase](https://img.shields.io/badge/Phase-1%20MVP-blue)](CHANGELOG.md)
[![Security: NIST CSF 2.0](https://img.shields.io/badge/Security-NIST%20CSF%202.0-green)](docs/security)
[![Architecture: Vibe-Coded](https://img.shields.io/badge/Architecture-Agentic%20Orchestration-purple)](#vibe-coding--agentic-collaboration)

## 🚀 Welcome, Collaborator!

If you are reading this, you are stepping into a modernized, highly secure, AI-native SaaS ERP for the Indian education sector (K-12 and higher-ed). This repository is engineered for **Vibe Coders and Developer Collaborators** using the Antigravity IDE. 

Here, humans and AI agents act as equal collaborators. Your role is defined by the project domain you are scoping, and you will use local agentic workflows to accelerate development all the way up to the Phase 1 MVP launch.

---

## 🏛️ System Architecture & Infrastructure

EduCore is modeled as a hierarchical knowledge graph, cross-linking student/staff/parent nodes with operational domains (Transport, Hostel, Library, Examination, Finance, HR, Assets, Compliance).

We have just completed **Phase 1 Infrastructure Hardening**, establishing a production-grade local environment:

### Core Tech Stack
| Layer | Choice |
|-------|--------|
| **Frontend** | Next.js 16.2 / React 19 (App Router, SSR), TailwindCSS v4, Radix UI |
| **API Edge / Ingress** | Kong API Gateway (Declarative routing via `kong.yml`) |
| **Backend (BFF)** | Fastify 5 (TypeScript, Zod validation, RS256 Asymmetric JWT) |
| **Persistence** | PostgreSQL 17 (OLTP), Drizzle ORM |
| **Caching** | Valkey (In-memory high-velocity datastore) |
| **Containerization** | Docker Compose with multi-stage, optimized builds |

### Security Mandates
- **Zero-Trust**: Hard-enforced **Row-Level Security (RLS)** in PostgreSQL via `NOBYPASSRLS`.
- **Session Auth**: 15m JWT Access Tokens + 7d HTTPOnly secure Refresh Tokens (Sliding Sessions).
- **Immutability**: Financial ledgers are strictly **append-only** at the database engine level.
- **Governing Frameworks**: NIST CSF 2.0, DPDP Rules 2025, OWASP GenAI Security (LLM06).

---

## 💻 Developer Onboarding (Local Environment)

We use Docker to ensure the entire multi-layered infrastructure spins up seamlessly on any collaborator's machine.

### Prerequisites
- Docker Desktop / Docker Engine
- Git
- Antigravity IDE (Local)

### 1. Spin up the Environment
From the root of the repository, execute:
```bash
docker compose up -d --build
```
This single command spins up:
- **Kong Gateway** (`localhost:8000`)
- **Fastify Backend** (`localhost:4000` - Internal)
- **Next.js Web App** (`localhost:3000`)
- **PostgreSQL 17** (`localhost:5432`)
- **Valkey Cache** (`localhost:6379`)

### 2. Access the Application
- Web UI: Navigate to `http://localhost:3000`
- API Gateway Edge: `http://localhost:8000/api/info`

*(Note: JWT secrets and RS256 keys are pre-generated in the `backend/services/api-gateway/keys` directory for local dev.)*

---

## 🤖 Vibe Coding & Agentic Collaboration

In this project, you are an architectural orchestrator. You will utilize the local **Antigravity IDE** alongside automated AI agents.

### The Collaboration Model
- **Domain-Based Ownership**: You and your fellow collaborators (human or AI) share the same underlying capabilities. The division of labor is entirely based on the **domain scope** you choose to work on (e.g., Finance, HR, Admissions).
- **`.agents` Governance**: The `.agents/` folder contains strict `.rules` and `.workflows`. Agents interacting with this repository automatically read these rules to ensure they do not hallucinate financial arithmetic, and they follow our strict RLS policies.
- **MCP Servers**: We leverage Model Context Protocol (MCP) servers to allow agents to interact with our local environment (e.g., executing DB migrations or fetching GitHub issues).

---

## 🌿 GitOps & Branching Strategy (Path to MVP)

As a collaborator, you will pull, branch, commit, and push just like in any standard IT enterprise, but accelerated by AI.

1. **Main Branch (`main`)**: The source of truth for the Phase 1 MVP. Code here must be stable and Docker-deployable.
2. **Feature Branching**: 
   - Always branch off `main` for your scoped domain.
   - Example: `git checkout -b feat/finance-ledger` or `git checkout -b fix/auth-refresh`
3. **Agentic Commits**: When working with Antigravity agents, allow them to write semantic commit messages based on the diffs they generated.
4. **Pull & Merge**:
   - Before pushing, always pull the latest changes: `git pull origin main`
   - Push your branch and open a Pull Request (PR) for automated CI/CD checks (Semgrep/Trivy - coming in Phase 4).
   - Once approved (or self-approved for local dev scopes), merge into `main`.

> **Goal**: We are currently marching towards the **Phase 1 MVP**. Fast iteration, continuous pushing, and resolving merge conflicts early are critical.

---

## 🔑 Demo Credentials (DEV ONLY)

> ⚠️ These credentials exist purely for local developer testing. 

| Role | Email | Password | Access Tier |
|------|-------|----------|-------------|
| Platform Super Admin | superadmin@educore.dev | super@123 | Tier 0 |
| Institution Admin | admin@demo.educore.dev | admin@123 | Tier 1 |
| Teacher | teacher@demo.educore.dev | teacher@123 | Tier 3 |
| Accountant | accountant@demo.educore.dev | accountant@123 | Tier 3 |
| Student | student@demo.educore.dev | student@123 | Tier 4 |

---

## 📜 Versioning & Status

This project follows [Semantic Versioning](https://semver.org/):
- **Current Status**: **v0.2.0-alpha** (Infrastructure Hardening & Sliding Token Auth Complete)
- **Target**: **v1.0.0** (Production-ready Phase 1 MVP)

See [CHANGELOG.md](CHANGELOG.md) for detailed release history.

---
*Built collaboratively with [Antigravity IDE](https://antigravity.dev) — Revolutionizing AI-native enterprise development.*
