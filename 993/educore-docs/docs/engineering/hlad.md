# 4-Tier High-Level Architectural Design (HLAD)

## Tier 1: Presentation
Stateless SPAs (Next.js 15 / React 19, App Router, SSR). Communicate exclusively with the
API gateway over HTTPS; edge caching and access control enforced at the ingress boundary.

## Tier 2: API Gateway
Kong — single entry point for all external traffic. Global rate limiting, WAF enforcement,
auth offloading, REST/JSON↔gRPC translation, BFF aggregation to reduce client roundtrips.

## Tier 3: Microservices (Backend)
Independent, bounded-context services (Auth, Academic, Finance, Transport, Hostel, Library,
Examination, HR, Assets, Compliance, NER-Inference). Each maintains its own codebase and
scales independently. Cross-domain communication is async-only via EventStoreDB.

## Tier 4: Polyglot Persistence
- PostgreSQL 17 — OLTP core, schema-per-tenant, RLS.
- ClickHouse — OLAP projections via CDC (Debezium).
- Neo4j — knowledge graph / relationship traversal.
- Valkey — high-velocity cache/write-behind layer.
- Feast (Redis + Postgres) — ML feature store.

## Cross-Cutting Concerns (Service Mesh)
Linkerd handles mTLS v1.3, distributed tracing hooks, and traffic policy — decoupled from
business logic so services don't hand-roll security plumbing.

## Latency Model
```
L_total = Σ (L_service_i + 2 · L_proxy)  for i = 1..H hops
```
Linkerd's sub-millisecond proxy latency minimizes compounding cost across multi-hop calls
compared to Istio/Consul (see `service-mesh-runbook.md` for full benchmark table).
