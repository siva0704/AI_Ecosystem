# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x-alpha | ✅ Active development |

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

Contact the security team at: **security@educore.dev** (placeholder for dev phase)

Include:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment
4. (Optional) Suggested fix

We will acknowledge within 48 hours and aim to patch critical vulnerabilities within 7 days.

## Security Baseline

EduCore is governed by:
- **NIST CSF 2.0** — Identify, Protect, Detect, Respond, Recover
- **DPDP Rules 2025** — Indian Digital Personal Data Protection
- **OWASP GenAI Security Project** — LLM06 Excessive Agency mitigation

## Developer Security Requirements

All contributors must:
1. Never commit secrets, tokens, or credentials to Git
2. Use `SECURITY.md` reported flows for vulnerabilities
3. Ensure all new tables include RLS policies
4. Never add UPDATE/DELETE on `fee_transactions`
5. All financial arithmetic must be hand-coded, 95%+ test coverage
6. Run `npm audit` before pushing; resolve Critical/High severity

## Secret Management
- Development: `.env.local` (gitignored)
- Production: HashiCorp Vault + AWS KMS (DEK per tenant)
- Never use `.env` committed to repo
