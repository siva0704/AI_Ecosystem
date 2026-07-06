# High-Velocity Telemetry PRD

## Purpose
Functional spec for the high-frequency ingest domains: Transport GPS, Library transactions,
Hostel allocations.

## Transport GPS
- `gps_telemetry` ingested into memory (Valkey), batch-processed, flushed to
  time-partitioned PostgreSQL tables — avoids per-event I/O against the OLTP core.
- Target KPI (Parent persona): time to locate school bus < 10 seconds.
- Retention: rotated out of hot storage after 12 months (behavioral telemetry rule).

## Library Transactions
- `library_transactions` writes directly to Valkey for high-velocity checkout/return events,
  asynchronously projected to PostgreSQL for durable storage and to ClickHouse for analytics.

## Hostel Allotments
- `hostel_allotments` follows the same write-behind pattern as Library.
- Allocation conflicts (double-booking a bed) must be resolved at the Valkey layer with
  optimistic locking before the durable write.

## Non-Functional Requirements
- No telemetry write path may block the primary PostgreSQL OLTP core.
- All three domains publish async events consumed by Analytics/AI Knowledge nodes — never
  synchronous cross-domain calls (bounded-context law).
