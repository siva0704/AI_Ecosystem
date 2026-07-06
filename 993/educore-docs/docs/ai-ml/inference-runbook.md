# Predictive & NER Inference Microservice Runbook

## NER Inference (FastAPI + ONNX Runtime)
- Multi-stage Docker build: builder stage compiles deps via `uv`; runtime stage copies only
  compiled artifacts + quantized `.onnx` model — final image ≈500MB vs 8GB+ raw PyTorch.
- Non-root container user (`useradd -u 8888 appuser`).
- Model warm-up on startup (`@app.on_event("startup")`) runs a dummy inference pass to avoid
  cold-start latency on first real request.
- Endpoint: `POST /api/v1/ner/extract` — request validated via Pydantic (`min_length=2,
  max_length=5000`), returns `entity_class`, `text`, `confidence` spans.
- Session options: `intra_op_num_threads=2`, `ExecutionMode.ORT_SEQUENTIAL`,
  `CPUExecutionProvider` only — no GPU dependency.

## Predictive Inference (Dropout / Default Risk)
- Python FastAPI services running XGBoost/Scikit-learn models.
- Consumes features exclusively from Feast online store (Redis) — never computes features
  ad hoc at request time (training-serving skew prevention).

## Access Control
Both services sit behind the Linkerd `AuthorizationPolicy` restricting callers to the API
Gateway identity only (see `/docs/engineering/service-mesh-runbook.md`).
