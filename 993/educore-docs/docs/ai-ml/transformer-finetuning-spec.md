# Transformer Fine-Tuning Specification

## Model Candidates
| Model | F1 | Model size | Latency/500 tok | Infra |
|---|---|---|---|---|
| RoBERTa-Base (Quantized ONNX) | ~91.2% | ~120 MB | ~14 ms | Minimal CPU |
| BERT-Base-Uncased | ~89.5% | ~440 MB | ~45 ms | Standard CPU / minimal GPU |
| DistilBERT-Base | ~86.8% | ~260 MB | ~8 ms | Ultra-lightweight CPU |
| GPT-4 (zero-shot API) | ~93.4% | N/A (cloud) | ~1200+ ms | External API dependency |

**Selected:** RoBERTa-Base, quantized to ONNX — best accuracy/latency/infra-cost balance for
production CPU serving.

## Annotation Scheme
BIO/BILOU tagging for span-level entity extraction (student names, subjects, dates, policy
references) sourced from curriculum docs, student notes, and compliance documents.

## Training Data Strategy
Active learning pipelines combined with deterministic gazetteers (known subject names, known
policy terms) to mitigate training-data scarcity risk flagged in the implementation roadmap
Phase 3.

## Export
Fine-tuned model exported to ONNX format, quantized for CPU inference — see
`inference-runbook.md` for the serving contract.
