# CONTEXT.md — EduCore ERP Master System Context
**Status:** Root-level file. This is the single file Antigravity IDE (and any other AI agent
orchestrator) must load first, on every session, before generating or modifying any code.
It is the compressed source of truth for the entire ecosystem. All other documents in `/docs`
are expansions of sections below — link out to them, never contradict them.

---

## 0. What This System Is
EduCore is an AI-native, multi-tenant SaaS ERP for the Indian education sector (K-12 and
higher-ed institutions). It is modeled as a hierarchical knowledge graph, not a flat table set:
`Institution → Academic Year → Campus → Department → Class/Section/Subject`, cross-linked
to `Student, Parent, Teacher, Staff` nodes and operational domains
(`Transport, Hostel, Library, Examination, Finance, HR, Assets, Compliance`), feeding
`Analytics` and `AI Knowledge` nodes.

Governing frameworks: NIST CSF 2.0, DPDP Rules 2025, OWASP GenAI Security Project
(specifically LLM06 — Excessive Agency).

---

## 1. Absolute Laws (Non-Negotiable — Agents Must Refuse to Violate These)
1. **No AI-generated financial/payroll/tax arithmetic.** Fee calculation, payroll deduction,
   GST, and PF/ESI logic is hand-coded, deterministic, and requires ≥95% test coverage.
   Agents (Backend Architect, Domain Architect, etc.) are prohibited from writing this logic.
2. **No agent executes a database migration unilaterally.** Migrations are drafted, then
   require human sign-off before running via Drizzle ORM pre-deploy hooks.
3. **Immutability of financial ledgers.** `fee_transactions` and payroll tables are
   append-only at the database engine level (`CREATE RULE ... DO INSTEAD NOTHING`).
   No UPDATE/DELETE path may ever be introduced.
4. **Row-Level Security is mandatory** on every tenant-facing table. No table ships without
   an RLS policy tied to `app.current_tenant_id`.
5. **Bounded contexts communicate only via asynchronous events** (EventStoreDB). No
   synchronous cross-domain calls that could let an Academic-domain error corrupt Finance.
6. **All inter-service traffic is mTLS v1.3**, enforced by Linkerd. No plaintext internal calls.
7. **Token budgets are hard limits.** Any agent execution exceeding its configured token
   ceiling halts and requires human authorization to continue (Denial-of-Wallet defense).
8. **Cryptographic signing of inter-agent messages** is mandatory; payloads are validated to
   contain no embedded executable commands (prompt-injection / context-poisoning defense).
9. **Security Architect review is mandatory (human-in-the-loop)** for all generated code
   before merge — this cannot be bypassed by any other agent.

---

## 2. Tech Stack Pins (Do Not Substitute Without an ADR)
| Layer | Choice |
|---|---|
| Frontend | Next.js 15 / React 19 (App Router, SSR), TailwindCSS v4, Radix UI / shadcn |
| API Gateway | Kong (WAF, rate limiting, REST↔gRPC translation, BFF pattern) |
| Backend services | Containerized microservices, Fastify/Express, Zod validation |
| Service Mesh | Linkerd (Rust proxy) — selected over Istio/Consul for latency + memory footprint |
| OLTP | PostgreSQL 17 (schema-per-tenant, RLS, JSONB + GIN indexing) |
| Connection pooling | PgBouncer (transaction mode) |
| OLAP | ClickHouse (via Debezium CDC) |
| Graph | Neo4j (Cypher-indexed knowledge graph / entity relationships) |
| Cache / hot writes | Valkey (Redis fork) |
| Event backbone | EventStoreDB (async, cross-domain) |
| Saga orchestration | Temporal.io (compensating transactions) |
| Search | Typesense or Meilisearch (per-tenant API key scoping) |
| ML feature store | Feast (Redis online store, Postgres registry) |
| ML tracking | MLflow + DVC |
| NER inference | ONNX Runtime, quantized RoBERTa-base (CPU, ~500MB image) |
| Secrets/keys | HashiCorp Vault + AWS KMS (DEK per tenant) |
| Orchestration | Kubernetes on Amazon EKS (Fargate), Terraform + Helm/Kustomize |
| CI/CD | GitHub Actions / GitOps, Semgrep (SAST), Trivy (image scan), OWASP ZAP (DAST) |
| Observability | OpenTelemetry → Prometheus/Grafana + Grafana Loki (with PII redaction) |
| Region | AWS ap-south-1 (Mumbai) |

---

## 3. Access Tier Summary (full matrix in `/docs/security/rls-tenant-matrix.md`)
`Tier 0` Platform Super Admin → `Tier 1` Institution Admin → `Tier 2` Principal/HOD →
`Tier 3` Teacher/Accountant/HR/Transport-Hostel-Library → `Tier 4` Student (read-only) →
`Tier 5` Parent (read-only, ward-scoped) → `Tier 6` External Auditor/Driver (restricted).

---

## 4. Agent Roster & Boundaries (full matrix in `/docs/ai-ml/agentic-guardrails.md`)
| Agent | Allowed | Forbidden |
|---|---|---|
| Product Research | Market/competitor analysis | Prod DB access |
| Compliance | DPDP/NIST/policy checks | Write access — read-only |
| Domain Architect | ER model design | Unilateral migrations |
| Security Architect | OWASP code review | Auto-merge without human sign-off |
| Frontend Architect | React/Next.js UI | Backend logic changes |
| Backend Architect | API routes/schemas | Financial/payroll arithmetic |
| Testing Agent | Unit/integration tests | Unbounded loop runs (token-capped) |
| Deployment Agent | Terraform drafts | Applying without human crypto signature |

---

## 5. Data Lifecycle Rules
- Financial/payroll records: immutable, append-only, retained **≥ 7 years** (statutory).
- Behavioral telemetry, GPS history, app logs: rotated out of hot storage after **12 months**.
- PII in logs: regex-redacted (Aadhaar, phone, financial) before reaching the log store.

---

## 6. Document Index
This file is the entry point. Deeper specs live under `/docs`:

- `/docs/product/` — functional PRDs, UX/persona specs
- `/docs/engineering/` — HLAD, LLD, API/event contracts, service mesh runbook
- `/docs/persistence/` — Postgres/Neo4j/ClickHouse/search schemas
- `/docs/ai-ml/` — NER model specs, Feast catalog, agent guardrails, prompt standards
- `/docs/security/` — crypto/KMS, RLS matrix, DPDP compliance, SIEM/logging policy
- `/docs/devops/` — Terraform, Kubernetes/Helm, CI/CD, observability
- `/docs/qa/` — SAST/DAST logs, tenant isolation tests, ML eval, drift monitoring
- `/docs/operations/` — admin guides, HITL clearance manual, persona operational manuals

See `README.md` for repo layout and `AGENTS.md` for the full per-agent operating contract.
