# Distributed Saga Implementation Workflow

When automating complex, multi-step business logic (such as Student Admissions or Payroll generation), agents MUST implement the Saga Pattern using Temporal.io to ensure distributed data consistency across bounded contexts.

## The Saga Protocol

### 1. Identify Transaction Boundaries
- Map the workflow into discrete activities (e.g., `CreateProfile`, `ChargeFee`, `AllocateResource`).
- Ensure no single activity spans multiple domain microservices.

### 2. Define Compensating Transactions
- For every activity that modifies state, you MUST define an inverse compensating transaction (e.g., `ReverseFee`, `DeallocateResource`).
- Compensating transactions must be idempotent (safe to retry multiple times).

### 3. Orchestration Logic (Temporal Workflow)
- Use Python with the `temporalio` SDK to define the Workflow class.
- Wrap activity executions in a `try/except` block.
- On `Exception`, iterate backward through the sequence of successfully completed activities and execute their compensating transactions.
- Never write orchestrator logic that attempts to "fix" the failure—only roll it back.

### 4. Human Approval Gate
- Sagas dealing with financial asset transfers (fees, payroll) require the orchestrator to pause and await an external signal (`approve_transfer`) from a Tier 2+ human persona before proceeding to the final `Commit` activity.
