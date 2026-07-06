# Data & Model Drift Monitoring Runbook

## Signal
Real-time extraction confidence scores from the NER-Service are tracked as a time series.
A sustained drop in mean confidence, or a rise in low-confidence span rate, indicates the
live document distribution has drifted from the original training set.

## Thresholds
- Alert if 7-day rolling mean confidence drops more than 5 points below the training-set
  baseline.
- Alert if low-confidence span rate (<0.5 confidence) exceeds 15% of extractions in any
  24-hour window.

## Response
On alert, the Compliance/Data Science team pulls a sample of recent low-confidence
extractions for manual review, and decides whether to trigger a re-fine-tuning cycle (see
`/docs/ai-ml/transformer-finetuning-spec.md`) using newly labeled data via the active
learning pipeline.
