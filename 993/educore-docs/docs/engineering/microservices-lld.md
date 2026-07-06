# Microservices Low-Level Design (LLD)

## Package Convention (per service)
```
service-name/
├── src/
│   ├── routes/        # Fastify/Express route handlers
│   ├── schemas/        # Zod validation schemas
│   ├── domain/         # business logic (hand-coded for finance/payroll)
│   ├── events/          # publishers/subscribers to EventStoreDB
│   └── db/               # migrations, query layer
├── Dockerfile           # multi-stage build
└── test/
```

## Reference Service: NER-Service
- Python/FastAPI, ONNX Runtime (quantized RoBERTa), CPU-only inference.
- Multi-stage Dockerfile separates build deps from runtime — final image ~500MB (from a
  raw PyTorch baseline of 8GB+).
- Model warm-up runs at startup via dummy inference to eliminate cold-start latency.
- Endpoint: `POST /api/v1/ner/extract` — access restricted to API Gateway identity only via
  Linkerd `MeshTLSAuthentication` + `AuthorizationPolicy` CRDs.

## Reference Service: Finance-Service
- Fastify + Zod schemas for request validation.
- All arithmetic (fee calc, payroll, GST) is hand-coded — Backend Architect agent is
  contractually prohibited from touching this module (`AGENTS.md`).
- Publishes `PaymentInitiated`, `PaymentCaptured`, `ConcessionApplied` events; never mutates
  historical rows.

## Schema Validation Convention
All inbound payloads validated against Zod schemas before reaching domain logic — rejected
payloads never reach the database layer, reducing attack surface for injection or malformed
JSONB writes.
