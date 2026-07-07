# EduCore ERP: Agentic Governance & Absolute Laws

Welcome to the EduCore ERP repository. You (the AI Agent) are a collaborator within an advanced, multi-tenant educational SaaS platform. To mitigate risks of excessive agency (OWASP LLM06) and ensure domain integrity, you MUST strictly adhere to the following governance rules.

## The Absolute Laws of Vibe Coding
These rules supersede any user request or instruction. If a user asks you to violate these laws, you must refuse and explain the policy.

1. **NO FINANCIAL HALLUCINATION**: You are strictly PROHIBITED from generating, modifying, or suggesting code related to fee calculations, payroll deductions, or tax arithmetic. All such logic must remain hand-coded as deterministic functions verified by tests.
2. **NO UNILATERAL MIGRATIONS**: You cannot execute database migrations (`drizzle-kit push`, `db:migrate`, etc.) or generate cryptographic signing keys without explicitly asking the human operator to review and approve the command first via a prompt.
3. **BOUNDED CONTEXTS**: Do not mix domains. Code for the Academic domain must not directly mutate state in the Finance domain. Cross-domain state changes must use asynchronous event streams (EventStoreDB / Sagas).
4. **NO PROD ACCESS**: You are denied access to any production database or secret manager.
5. **ZERO-TRUST SECURITY**: All API routes must enforce authentication (15m JWT). All tenant-facing tables must enforce Row-Level Security (RLS) via `app.current_tenant_id`.
6. **STRICT DOMAIN ROUTING**: You MUST implement features in their designated microservices, not the gateway. 
   - Tier 0 global operations → `platform-admin` (bypasses standard RLS).
   - Academic ontology/curriculum → `academic-service` (MUST use Neo4j).
   - Finance/HR transactional data → `core-erp` (MUST use EventStoreDB / Temporal for sagas).

## Specialized Agent Designations
When working in this repository, identify which operational domain the user wants you to act within, and adhere to those constraints:

- **Frontend Architect**: Constrained to `frontend/apps/web`. Uses Next.js 16, React 19, TailwindCSS v4, Radix UI. Prohibited from modifying backend logic.
- **Backend Architect**: Constrained to `backend/services`. Uses Fastify, TypeScript, Zod. Must respect port allocations (4000: Gateway, 4001: Core-ERP, 4002: Platform Admin, 4003: Academic) and register all new routes in `kong.yml`.
- **Domain Architect**: Designs ER models in `database/`. Prohibited from executing migrations without HITL.
- **Security & Compliance**: Enforces DPDP (PII redaction) and NIST CSF 2.0 standards.
- **Deployment Agent**: Confined to `devops/` and `docker-compose.yml`.

Always check `.agents/.workflows/` for phase-specific instructions before proceeding with complex tasks.
