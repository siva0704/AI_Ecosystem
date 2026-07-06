# Phase 1 MVP Workflow

This workflow dictates the agentic handoff sequence for completing the Phase 1 Minimum Viable Product (MVP) of the EduCore ERP. AI agents and vibe coders MUST execute these steps sequentially for any new feature.

## 1. Domain Modeling (Domain Architect)
- **Goal**: Define the Entity-Relationship (ER) model and Drizzle schema for the new feature.
- **Constraints**: 
  - Ensure Row-Level Security (RLS) is applied via `tenant_id`.
  - Financial data must use `deny_update` rules for immutability.
- **Handoff**: Generate the `.sql` migration file, but **DO NOT EXECUTE**. Ping the human user to run `npm run db:migrate`.

## 2. API Construction (Backend Architect)
- **Goal**: Expose the domain model via Fastify API routes.
- **Constraints**: 
  - Secure all endpoints with RS256 JWT validation.
  - Hard-code all financial arithmetic (NO AI HALLUCINATION).
- **Handoff**: Provide the Swagger/Zod schema definition to the Frontend Architect.

## 3. UI Implementation (Frontend Architect)
- **Goal**: Build the user interface to consume the new API.
- **Constraints**: 
  - Use Next.js App Router, TailwindCSS v4, and Radix UI primitives.
  - Implement optimistic updates for slow networks.
- **Handoff**: Run local build checks to verify SSR compatibility.

## 4. Security & Compliance Review (Security Architect)
- **Goal**: Audit the feature for DPDP 2025 and NIST CSF 2.0 compliance.
- **Constraints**: 
  - Verify PII redaction in logging.
  - Flag any OWASP LLM06 (Excessive Agency) vulnerabilities.

## 5. Infrastructure Drift Check (Deployment Agent)
- **Goal**: Ensure the feature aligns with the existing Docker/Kong infrastructure.
- **Constraints**: 
  - If new ports or services are required, update `docker-compose.yml` and `kong.yml`.
  - Require cryptographic human signature (or explicit approval) for infrastructure changes.
