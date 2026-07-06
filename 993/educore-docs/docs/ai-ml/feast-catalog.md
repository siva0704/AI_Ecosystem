# Feast Feature Store Catalog

## Architecture
- **Registry:** SQL-backed (PostgreSQL) — `educore_intelligence` project.
- **Online store:** Redis (`redis://redis-online-ha.core.svc.cluster.local:6379/0`, SSL on).
- **Offline/historical features:** computed from PostgreSQL for training; only latest values
  materialized to Redis for low-latency online lookups (`pull_latest_features: true`).
- Materialization writes in batches of 10,000 rows to prevent memory exhaustion.

## Feature Data Dictionary (initial set)
| Feature | Type | Source | Consumer |
|---|---|---|---|
| `attendance_rate_30d` | numerical | attendance_daily | Dropout-risk model |
| `fee_payment_delay_days` | numerical | fee_transactions | Default-risk model |
| `assignment_completion_rate` | numerical | homework/LMS events | Dropout-risk model |
| `gps_route_deviation_flag` | categorical | gps_telemetry | Transport anomaly model |

## Versioning
- Feature snapshots tracked via DVC.
- Model versions tracked via MLflow, linked back to the exact feature-set version used for
  training to guarantee reproducibility during audits.
