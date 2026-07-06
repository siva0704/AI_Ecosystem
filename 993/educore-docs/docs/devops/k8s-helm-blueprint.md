# Kubernetes Orchestration & Helm/Kustomize Blueprint

## Namespace Convention
- `core` — gateway, auth, shared services.
- `academic`, `finance`, `transport`, `hostel`, `library`, `hr`, `compliance` — one namespace
  per bounded context, matching the domain model.
- `ml` — NER inference, Feast, predictive models.

## Autoscaling
Horizontal Pod Autoscaler (HPA) profiles per microservice, tuned per observed load —
NER-Service and Finance-Service get dedicated CPU-based HPA thresholds distinct from
low-traffic services like HR.

## Helm/Kustomize Split
- Helm charts for third-party components (Linkerd, Kong, EventStoreDB, Redis/Valkey).
- Kustomize overlays for first-party microservices, layered dev → staging → prod.

## Migration Hook
Database migrations run as pre-deployment hooks via Drizzle ORM — if a migration fails, the
deployment aborts before any pod receives new traffic, preventing runtime schema mismatches.
