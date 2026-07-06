# Cryptographic Control & Key Management Plan

## Encryption at Rest
Student PII encrypted using AES-256-GCM. Each tenant has its own Data Encryption Key (DEK),
referenced in `tenants.kms_dek_arn`, managed centrally in AWS KMS.

## Key Injection
HashiCorp Vault injects DEKs and other secrets into running services at runtime — no secret
is ever baked into a container image or committed to source control.

## Key Rotation
- DEKs rotated on a scheduled cadence (per compliance requirement) and immediately on
  suspected compromise.
- Rotation must not require re-encrypting the full historical ledger synchronously — use
  envelope encryption so only the DEK wrapping changes, not every row.

## Signing
- JWTs: RS256 asymmetric signing.
- Inter-agent messages: cryptographically signed per `AGENTS.md` §2.
- Deployment Agent output: requires a human admin's cryptographic signature before any
  Terraform apply.
