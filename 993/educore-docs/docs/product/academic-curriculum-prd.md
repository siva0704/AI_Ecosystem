# Academic & Curriculum Master Blueprint (PRD)

## Purpose
Defines the pedagogical framework tracking domain, handling structural differences between
national and state curriculum policies within the same tenant hierarchy.

## Scope
- **NEP 2020 structure:** 5+3+3+4 stage model (Foundational, Preparatory, Middle, Secondary).
- **Karnataka SEP 2025 structure:** 2+8+4 stage model.
- Both must be representable simultaneously across tenants without schema forking — modeled
  as configurable `academic_stage_policy` nodes attached at the Institution level in the
  knowledge graph (see `/docs/persistence/graph-ontology.md`).

## Functional Requirements
1. Institution admin selects one governing policy (NEP or state variant) at onboarding.
2. Class/Section/Subject nodes inherit stage-boundaries from the selected policy — changing
   policy mid-year requires an explicit migration workflow, not a silent schema change.
3. Promotion logic (student moving Class N → N+1) validates against the active policy's
   stage boundaries before writing to the Academic domain.
4. Cross-domain guard: an incorrect promotion status must **not** be able to trigger Finance
   domain fee-structure regeneration synchronously — this crossing happens only via an
   asynchronous `PromotionConfirmed` event (bounded-context law, see `CONTEXT.md` §1.5).

## Out of Scope
- Fee arithmetic itself (see `financial-ledger-prd.md`).
- UI screen layout (see `screen-inventory.md`).

## Open Questions
- Exact mapping table between NEP stage names and Karnataka SEP stage names — pending
  Compliance Agent sign-off against the regulatory knowledge graph.
