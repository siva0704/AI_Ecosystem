# OpenAPI Contract & API Gateway Blueprint

## Kong Configuration Responsibilities
- Global rate limiting (per-tenant and per-IP tiers).
- WAF rule enforcement at the ingress boundary.
- Auth offloading — validates JWT (RS256) before requests reach any microservice.
- REST/JSON ↔ internal gRPC translation where services expose gRPC internally.
- Backend-for-Frontend (BFF) aggregation — combines multiple downstream calls into one
  client-facing response to reduce roundtrips.

## OpenAPI Contract Convention
- Every microservice publishes an OpenAPI 3.1 spec at `/openapi.json`.
- Kong ingests these to auto-generate route definitions and validate request/response shape.
- Breaking changes to a contract require a version bump (`/v1/` → `/v2/`) — no silent
  in-place breaking changes to a live route.

## Identity Extraction
JWTs signed with RS256 asymmetric keys. The permission resolution algorithm extracts
`tenant_id` and role claims from the verified token payload before any route handler runs —
this happens at the gateway, not duplicated per-service.
