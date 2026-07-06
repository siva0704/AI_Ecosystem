# OpenTelemetry Observability & Alerting Runbook

## Stack
OpenTelemetry collectors → Prometheus (metrics) + Grafana (dashboards) + Grafana Loki (logs,
with PII redaction applied inline before write — see
`/docs/security/siem-logging-policy.md`).

## SLOs (initial set)
| Service | SLO |
|---|---|
| API Gateway | p99 latency < 300ms |
| NER Inference | p99 latency < 200ms per 500 tokens |
| Fee payment flow | End-to-end < 2 minutes (matches Parent persona KPI) |
| Attendance submission | < 3 interactions, offline-tolerant |

## Alert Policy
- Saga compensation `CRITICAL` failures page on-call immediately (no batching).
- Payment state machine bypass attempts alert security on-call immediately.
- Token-budget exhaustion on any agent halts execution and notifies the responsible engineer
  — not a silent retry.

## Correlation
Every alert should be traceable back to a Correlation ID from
`/docs/engineering/event-bus-catalog.md`, enabling full request-to-resolution tracing.
