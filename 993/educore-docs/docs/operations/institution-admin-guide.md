# Institutional System Administrator Guide

## Scope (Tier 1)
Full access within a single institution, across all departments and campuses.

## Responsibilities
- Configure tenant onboarding details (campuses, departments, academic year setup, chosen
  curriculum policy — NEP 2020 vs Karnataka SEP 2025, see
  `/docs/product/academic-curriculum-prd.md`).
- Configure localized RBAC — assign Tier 2/3 roles (Principal, HOD, Teacher, Accountant, HR,
  Transport/Hostel/Library operators) to specific staff accounts.
- Generate legal audit log extractions scoped strictly to their own tenant (RLS-enforced).

## Common Tasks
- Adding a new campus mid-year.
- Rotating a compromised staff account's credentials.
- Reviewing DSAR requests routed to their institution.
