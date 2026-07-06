# Human-In-The-Loop Clearance Portal Manual

## Purpose
Operational instructions for administrators reviewing AI-generated artifacts before they go
live — the human checkpoint required by `AGENTS.md` for Security Architect findings,
Deployment Agent Terraform drafts, and any agent-drafted communication.

## Review Queue Types
| Queue | Reviewer | Example |
|---|---|---|
| Financial script review | Accountant + Security Architect (human) | Hand-coded fee calc change |
| Migration review | Institution/Platform Admin | Drizzle migration draft |
| Communication draft review | Institution Admin/HR | Parent-facing notice draft |
| Infra change review | Platform Admin (crypto signature) | Terraform apply request |

## Workflow
1. Agent submits artifact to the clearance queue with its reasoning trace attached.
2. Reviewer inspects diff/output against the relevant `CONTEXT.md` Absolute Law.
3. Approve → artifact proceeds to merge/deploy. Reject → artifact returns to the agent with
   the rejection reason attached for correction.
4. All decisions are logged with reviewer identity and timestamp — this log is itself an
   audit artifact under the DPDP compliance guide.
