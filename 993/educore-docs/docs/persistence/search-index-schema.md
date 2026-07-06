# Typo-Tolerant Search Index Schema (Typesense / Meilisearch)

## Multi-Tenant Isolation
Each tenant is scoped to its own API key with collection-level restriction — a leaked key
for Tenant A must be structurally incapable of querying Tenant B's index.

## Indexed Entities (initial set)
- Student/Staff directory search (name, admission number, class).
- Curriculum document full-text search (feeds RAG pipelines).
- Compliance policy search (NEP/state SEP documents).

## Sync
Indexes are rebuilt from Postgres/event-stream projections on a scheduled + event-triggered
basis — never the source of truth for any field.
