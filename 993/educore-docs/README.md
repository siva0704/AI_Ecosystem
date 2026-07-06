# EduCore ERP — Documentation Root

This directory is the engineering source of truth for the EduCore ERP platform.

## Read Order for Agents and New Engineers
1. **`CONTEXT.md`** — absolute laws, tech stack pins, agent boundaries. Read first, always.
2. **`AGENTS.md`** — full per-agent operating contract and escalation rules.
3. **`/docs/<track>/`** — deep-dive specs, only after the two files above are loaded.

## Directory Layout
```
educore-docs/
├── CONTEXT.md              ← master context (read first)
├── README.md               ← this file
├── AGENTS.md                ← agent governance contract
└── docs/
    ├── product/            ← functional PRDs, UX/persona specs
    ├── engineering/         ← HLAD, LLD, API & event contracts, service mesh
    ├── persistence/         ← Postgres, Neo4j, ClickHouse, search
    ├── ai-ml/               ← NER model, Feast, agent guardrails, prompt standards
    ├── security/            ← crypto/KMS, RLS, DPDP compliance, SIEM/logging
    ├── devops/              ← Terraform, Kubernetes, CI/CD, observability
    ├── qa/                  ← SAST/DAST, tenant isolation tests, ML eval, drift
    └── operations/          ← admin guides, HITL manual, persona operational guides
```

## Ownership Convention
Every doc under `/docs` maps to exactly one track owner:

| Track | Owner |
|---|---|
| product | Product / UX |
| engineering | Platform Engineering |
| persistence | Database Engineering |
| ai-ml | Data Science / ML Eng |
| security | Security & Compliance |
| devops | DevOps / SRE |
| qa | QA / Test Engineering |
| operations | Customer Success / Support |

## Update Discipline
- `CONTEXT.md` changes require sign-off from a human architect — never edit it via an
  autonomous agent pass.
- Any new microservice, table, or agent role must be reflected in `CONTEXT.md` §2–4
  in the same PR that introduces it.
