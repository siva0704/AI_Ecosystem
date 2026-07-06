# DPDP Rules 2025 Compliance Guide

## Consent Management
- Parental consent captured and stored cryptographically (signed consent records, not just
  a boolean flag) — auditable proof of informed consent for minors' data processing.
- HR Manager persona owns employee-side DPDP consent tracking (see `AGENTS.md`/tier matrix).

## Data Subject Access Requests (DSAR)
- Platform must support structured export of all data held on a given student/parent/staff
  member on request, scoped correctly through RLS so no cross-tenant leakage occurs during
  export generation.

## Right to Erasure
- 30-day cold-storage cryptographic erasure routine: on a valid erasure request, DEKs
  associated with the affected records are destroyed (crypto-shredding) rather than
  attempting row-by-row deletion across an immutable ledger — satisfies erasure intent while
  preserving statutory financial retention (7-year rule) where legally required to persist.

## Retention Summary
| Data class | Retention | Mechanism |
|---|---|---|
| Financial/payroll ledgers | ≥ 7 years | Immutable append-only tables |
| Behavioral telemetry, GPS history, app logs | 12 months | Rotated out of hot storage |
| PII in logs | Not retained in plaintext | Regex redaction before write |

## Regulatory Mapping Ownership
Compliance Agent maintains read-only access to the regulatory knowledge graph and evaluates
feature changes against DPDP, NIST CSF 2.0, and applicable state education policy — see
`AGENTS.md` governance matrix.
