# ML Evaluation Framework & Baseline Benchmarks

## Metrics
```
Precision = TP / (TP + FP)
Recall    = TP / (TP + FN)
F1        = 2 · (Precision · Recall) / (Precision + Recall)
```

## Baseline Benchmarks (NER)
| Model | F1 |
|---|---|
| RoBERTa-Base (Quantized ONNX) | ~91.2% |
| BERT-Base-Uncased | ~89.5% |
| DistilBERT-Base | ~86.8% |
| GPT-4 (zero-shot) | ~93.4% |

## Release Gate
A new fine-tuned model version may not replace the production model unless its exact-span
F1 on the held-out test set is ≥ the current production model's F1, with no more than a
1-point regression on any individual entity class.

## Ownership
Testing Agent generates the harness; Compliance Agent and a human ML engineer jointly sign
off on any threshold change.
