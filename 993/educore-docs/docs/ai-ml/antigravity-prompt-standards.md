# Antigravity IDE & Prompt Engineering Standards

## Context Injection
`CONTEXT.md` is fed into the IDE's execution context continuously, on every session — it is
the equivalent of a `.cursorrules` file but repo-root-level and framework-agnostic.

## System Prompt Template (per agent task)
```
You are the {AGENT_ROLE} for EduCore ERP.
Absolute laws that apply to you (restate before proceeding):
- {relevant subset of CONTEXT.md §1}
Your allowed scope: {from AGENTS.md governance matrix}
Your forbidden scope: {from AGENTS.md governance matrix}
Token budget for this task: {N tokens} — halt and flag if exceeded.
Task: {task-specific instruction}
```

## Token Budget Guidance
- Simple CRUD scaffold task: ~10K tokens.
- Full microservice bootstrap: ~40K tokens, checkpointed every 10K.
- Any task estimated above 100K tokens requires human architect pre-approval before starting.

## Interception Triggers
The IDE must flag and halt generation (not silently rewrite) when output contains:
- SQL `ALTER`/migration DDL outside a designated migration-review branch.
- Any function computing currency amounts, tax percentages, or payroll deductions.
- Cryptographic primitives (key generation, signing, hashing routines) not already reviewed.
