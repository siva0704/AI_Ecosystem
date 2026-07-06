# Platform Super Admin Operations Guide

## Scope (Tier 0)
Full system access across all tenants — global billing, global feature-flag configuration,
emergency failover protocols.

## Responsibilities
- Onboard new institution tenants (provisions `tenants` row, KMS DEK, initial RLS context).
- Manage global feature flags — rollout of new modules (e.g., new NER model version) behind
  a flag before full tenant-wide release.
- Emergency failover: documented runbook for promoting a read-replica or failing over to a
  secondary region if the primary EKS cluster becomes unavailable.

## Guardrails
Even Tier 0 access does not bypass RLS at the database engine level — cross-tenant queries
for legitimate platform operations use an explicit, logged "platform context" elevation, not
a silent superuser bypass.
