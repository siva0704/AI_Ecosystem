# Automated Multi-Tenant Isolation Test Matrix

## Purpose
Mathematically verify that a request authenticated as Tenant A can never read or write data
belonging to Tenant B, across every tenant-facing table and every access tier.

## Test Pattern
For each tenant-facing table:
1. Seed data for Tenant A and Tenant B.
2. Authenticate as a Tenant A user (any tier).
3. Attempt read, then attempt write, against Tenant B's rows using every plausible bypass
   (direct ID guessing, missing `SET LOCAL` context, malformed JWT claims).
4. Assert zero rows returned and zero writes committed in all cases.

## Coverage Requirement
Every new table added to the schema must have a corresponding entry in this matrix before
it can ship to production — enforced as a CI gate, not just a manual checklist.

## Regression Cadence
Full matrix re-run on every PR touching `/docs/persistence/postgres-schema.md`-adjacent
migration files, and on a nightly schedule against staging.
