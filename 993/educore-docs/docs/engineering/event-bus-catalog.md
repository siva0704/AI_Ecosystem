# Asynchronous Event & Message Bus Catalog

## Backbone
EventStoreDB for domain events; Kafka/RabbitMQ where higher-throughput generic messaging is
needed (e.g., NER extraction fan-out).

## Mandatory Envelope Fields
Every message carries a **Correlation ID** for distributed tracing across service hops and
Saga steps — no message ships without one.

## Core Event Types (initial catalog)
| Event | Producer | Consumers |
|---|---|---|
| `DocumentSubmitted` | Compliance/Academic services | NER-Service |
| `EntitiesExtracted` | NER-Service | Analytics, Compliance |
| `PaymentInitiated` | Finance-Service | Analytics, Notification-Service |
| `PaymentCaptured` | Finance-Service | Academic (fee-cleared status), Notification |
| `ConcessionApplied` | Finance-Service | Analytics |
| `PromotionConfirmed` | Academic-Service | Finance-Service (fee restructure trigger) |

## Saga Orchestration
Multi-step workflows (e.g., Student Admission: profile creation → fee capture → resource
allocation) run as Temporal.io workflows. On failure, compensating actions execute in
**reverse order** (see code reference in `CONTEXT.md`-linked source spec). Compensation
failures are logged as `CRITICAL` and require manual operator intervention — this failure
path is NOT currently automated and should be treated as an incident (see
`/docs/qa/tenant-isolation-test-matrix.md` sibling doc `/docs/devops/observability-runbook.md`
for alerting hooks).
