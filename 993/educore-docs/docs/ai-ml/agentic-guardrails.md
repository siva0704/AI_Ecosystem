# Agentic Boundaries & Guardrail Catalog

## Governing Framework
OWASP GenAI Security Project — specifically mitigating **Excessive Agency (LLM06)**.

## Hard Prohibitions (see also `CONTEXT.md` §1 and `AGENTS.md`)
- No agent generates fee calculation, payroll deduction, or tax arithmetic logic.
- No agent executes a database migration without human sign-off.
- No agent bypasses the Security Architect's mandatory human-in-the-loop review.

## Denial-of-Wallet (DoW) Defense
Every agent execution has a configured token budget. Crossing the threshold halts execution
and requires a human operator to investigate before authorizing more compute — this stops
malicious prompts or runaway loops from silently burning cloud spend.

## Prompt-Injection / Context-Poisoning Defense
The Agent Communication Protocol cryptographically signs all inter-agent messages. Payloads
are structurally validated to confirm no executable commands are embedded inside semantic
text transfers before one agent's output is consumed by another.

## Enforcement Point
Antigravity IDE intercepts any agent output that attempts a migration or a cryptographic
routine and flags it for manual developer intervention — this is a runtime gate, not just a
documented policy.
