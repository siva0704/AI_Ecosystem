# Immutability Ledger & Core Financial PRD

## Purpose
Governs fee architecture, payroll calculation, and statutory deduction logic. This is the
single most security-sensitive PRD in the system — **all arithmetic here is hand-coded**,
never AI-generated (Absolute Law #1, `CONTEXT.md`).

## Data Model
- `fee_transactions`: append-only, `payment_status` constrained to
  `PENDING → INITIATED → PROCESSING → CAPTURED | FAILED | REFUNDED`.
  Any jump (e.g., PENDING→CAPTURED) is rejected at the application boundary and raises a
  security anomaly alert.
- Currency stored strictly as integers in paise (`amount_paise BIGINT`), never floats.
- Database-engine-level rules block UPDATE/DELETE on `fee_transactions` entirely
  (`CREATE RULE deny_update_fee_transactions ... DO INSTEAD NOTHING`).

## Statutory Deductions (Payroll)
- PF, ESI, Professional Tax calculated via hand-coded deterministic functions.
- Minimum 95% test coverage required in CI before merge (enforced by Testing Agent +
  Security Architect human-in-the-loop review).

## Payment Gateway Integration
- Razorpay webhook validation triggers automatic fee receipt generation (see Parent persona
  automation in `ux-persona-matrix.md`).
- Webhook signature verification is mandatory before any state transition is accepted.

## Retention
- Financial records retained ≥ 7 years in immutable, append-only storage (statutory audit
  requirement — see `/docs/security/dpdp-compliance-guide.md`).

## Distributed Transaction Handling
- Multi-step flows (e.g., admission: profile → fee capture → resource allocation) run as
  Temporal.io Sagas with compensating transactions on failure — see
  `/docs/engineering/event-bus-catalog.md` and `CONTEXT.md` tech stack pins.
