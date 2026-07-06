# GitOps CI/CD Delivery Pipeline Manual

## Pipeline Stages
```
[Git Commit] -> [Semgrep SAST] -> [Build+Trivy scan] -> [Drizzle migration pre-deploy hook]
             -> [Deploy to EKS] -> [OpenTelemetry trace verification]
```

## Stage Detail
1. **Semgrep** — static analysis on every merge to main; blocks merge on high-severity find.
2. **Trivy** — container image vulnerability scan post-build; blocks deploy on critical CVEs.
3. **Drizzle ORM migration hook** — runs before pod rollout; failure aborts deployment.
4. **EKS deploy** — GitOps-driven (declarative manifests as source of truth, not manual
   `kubectl apply`).

## Testing Agent Integration
Testing Agent generates unit/integration test coverage as part of the PR pipeline, capped by
its configured token budget to prevent runaway generation loops (`AGENTS.md`).

## Rollback
Any failed migration or failed post-deploy health check triggers automatic rollback to the
last known-good GitOps revision — no manual `kubectl rollout undo` should be required in the
common case.
