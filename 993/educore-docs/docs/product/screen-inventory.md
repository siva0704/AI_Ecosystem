# Context-Aware Screen Inventory

## Design System
- TailwindCSS v4 + Radix UI / shadcn primitives — standardized across all screens for
  accessibility and rapid AI-assisted code generation (Frontend Architect agent output).

## Screen Density Tiers
| Tier | Example Users | Density |
|---|---|---|
| Ultra-dense admin | Institution Admin, Accountant | Data-table heavy, bulk actions, keyboard shortcuts |
| Standard operational | Teacher, HOD, HR | Card + list hybrid, moderate density |
| Minimalist mobile PWA | Parent, Driver, Student | Single-focus screens, large touch targets, offline-first |

## Screen Inventory (initial set)
- Dashboard (role-conditional widgets)
- Attendance capture (≤3 taps, offline queue)
- Fee payment (UPI/EMI selector → Razorpay checkout → receipt)
- Transport GPS live map (driver + parent views)
- Homework/assignment feed
- Report card viewer
- Consent/approval inbox (field trips, disciplinary notices)
- Compliance/audit export console (admin-only)

## Frontend Architect Agent Constraint
Output from this agent is restricted to the UI layer only — it cannot modify backend logic
or generate API contracts (see `AGENTS.md`).
