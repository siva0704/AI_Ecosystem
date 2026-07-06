# Static & Dynamic Application Security Testing (SAST/DAST) Log

## SAST
Semgrep runs on every merge to main. Rule sets target:
- Hard-coded secrets/credentials.
- Missing RLS policy on new tables (custom rule tied to `CONTEXT.md` Absolute Law #4).
- Direct SQL string concatenation (injection risk).

## DAST
OWASP ZAP runs against staging on a scheduled basis and before major releases, probing:
- Auth bypass on tenant-scoped endpoints.
- JWT tampering / signature bypass attempts.
- Rate-limit evasion at the Kong gateway layer.

## Log Format
Each finding is logged with: severity, affected service, exploit scenario, remediation
status, and the Security Architect sign-off timestamp (mandatory human-in-the-loop gate —
`AGENTS.md`).
