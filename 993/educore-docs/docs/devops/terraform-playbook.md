# Terraform Cloud Environments Playbook

## Region
AWS ap-south-1 (Mumbai) — data residency alignment with Indian compliance requirements.

## Network Segmentation
- Isolated VPC subnets per environment (dev/staging/prod).
- Private subnets for database and internal service tiers; public subnets only for the
  ingress/gateway layer.

## Compute
- EKS Fargate for baseline (10K DAU) deployments — avoids node-management overhead.
- Multi-region active-active EKS clusters introduced only past the 100K+ DAU threshold
  (see `CONTEXT.md`-referenced scale table in the source architecture doc).

## Secrets Bootstrap
HashiCorp Vault deployed as part of Phase 1 foundations, before any application service —
nothing else in the stack should hard-code a credential while waiting on Vault.

## Change Control
Deployment Agent may draft Terraform changes, but `terraform apply` requires a human admin's
cryptographic signature (Absolute Law, see `AGENTS.md`).
