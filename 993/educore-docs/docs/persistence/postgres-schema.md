# PostgreSQL 17 OLTP Core Relational Schema

## Connection Pooling
PgBouncer in **transaction mode** — prevents exhausting connection limits across thousands
of isolated tenant schemas.

## Tenant Context Wrapping
Every transaction sets tenant context before any query runs:
```sql
SET LOCAL app.current_tenant_id = '550e8400-e29b-41d4-a716-446655440000';
```

## Core Tables (reference DDL)
```sql
CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name VARCHAR(255) NOT NULL UNIQUE,
  kms_dek_arn VARCHAR(512) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fee_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  amount_paise BIGINT NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN
    ('PENDING','INITIATED','PROCESSING','CAPTURED','FAILED','REFUNDED')),
  audit_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE RULE deny_update_fee_transactions AS ON UPDATE TO fee_transactions DO INSTEAD NOTHING;
CREATE RULE deny_delete_fee_transactions AS ON DELETE TO fee_transactions DO INSTEAD NOTHING;
```

## GIN Index Strategy
| Operator class | Use case | Index footprint |
|---|---|---|
| `jsonb_ops` (default) | Volatile schemas, arbitrary key existence (`?`) | 60–80% of table size |
| `jsonb_path_ops` | Stable schemas, containment queries (`@>`) | 20–30% of table size (2–3x smaller) |

Rule of thumb: use `jsonb_path_ops` for `extracted_entities.attributes` (containment search
on NER metadata); use default `jsonb_ops` only where flexible key-existence checks are a
hard requirement.

## RLS Policy Pattern
```sql
ALTER TABLE fee_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_transactions_isolation_policy ON fee_transactions
  AS RESTRICTIVE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
```
Every tenant-facing table follows this exact pattern — no exceptions (Absolute Law #4).
