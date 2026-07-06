# Security Audit, SIEM & Logging Interceptor Policy

## PII Redaction
Logging interceptors run regex-based redaction before any log stream reaches durable
storage (Grafana Loki) — masking Aadhaar numbers, phone numbers, and financial details.
This runs inline in the OpenTelemetry collection path, not as a post-hoc cleanup job.

## Tracing
OpenTelemetry aggregates spans, metrics, and logs into a centralized dashboard
(Prometheus/Grafana + Loki). Every event/message carries a Correlation ID (see
`/docs/engineering/event-bus-catalog.md`) enabling full request-to-Saga-step tracing.

## Anomaly Alerts
- Any attempt to bypass the payment state machine (e.g., PENDING→CAPTURED directly)
  generates an immediate security event log entry and alert.
- Saga compensation failures (`CRITICAL` log level) must page a human operator — currently
  the only automated recovery path is manual, see `/docs/engineering/event-bus-catalog.md`.

## Audit Export
Institutional System Administrators can generate legal audit log extractions scoped to
their own tenant only, enforced via the same RLS boundary as all other tenant data access.
