# ClickHouse OLAP Projection Specification

## Purpose
Offload analytical, multi-join, cross-millions-of-rows queries from the OLTP core to prevent
operational database exhaustion.

## Sync Mechanism
Change Data Capture (CDC) via Debezium streams Postgres WAL changes into ClickHouse
projections — asynchronous, never blocking the OLTP write path.

## Projection Candidates
- Attendance patterns (Level 4: Behavior in the analytical hierarchy).
- Payment cadence / default-risk features (Level 5: Prediction).
- Campus-vs-campus executive KPIs (Level 8: Intel).

## Consistency Model
Macro-analytical dashboards accept eventual consistency (projection lag tolerated).
Transactional boundaries (e.g., current fee balance shown to a parent) always read
synchronously from Postgres, never from the ClickHouse projection.
