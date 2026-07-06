# Persona-Scoped Operational Manuals

## Teacher Module
- Mark attendance in ≤3 taps; works offline, syncs on reconnect.
- Distribute homework/assignments; grade submissions.
- Track curriculum mapping progress against the institution's selected policy (NEP/SEP).

## Finance Module
- Audit the immutable fee ledger (read path only — no edit/delete UI exists by design).
- Reconcile Razorpay webhook events against `fee_transactions` state transitions.
- Track and export statutory payroll deduction reports.

## Parent Module
- Manage consent records (field trips, disciplinary acknowledgments).
- Use the mobile PWA for daily attendance/GPS checks and monthly fee payments.
- Track ward's financial schedule and download receipts.

## Design Note
Each manual is written for non-technical end users — no architecture terminology, no
internal service names, just task-oriented steps mapped to the actual UI screens in
`/docs/product/screen-inventory.md`.
