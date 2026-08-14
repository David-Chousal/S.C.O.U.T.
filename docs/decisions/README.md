# Architecture Decision Records

Significant, hard-to-reverse decisions are recorded here as ADRs — one file per decision,
numbered sequentially and never deleted.

## Why

Project documents currently disagree with each other on several points (see ADR-0001). An
ADR makes the reasoning behind a choice durable, so that six months later the team can see
not just *what* was decided but *why*, and what alternatives were rejected.

Routine choices belong in the
[Systems Decision Matrix](../research/systems-decision-matrix.md). Write an ADR when the
decision is expensive to reverse, contested between documents or people, or constrains
multiple subsystems.

## Index

| ID | Decision | Status |
|---|---|---|
| [0001](0001-mcu-and-radio-selection.md) | Microcontroller and LoRa radio selection | 🟡 Open |

**Status values:** 🟡 Open · 🟢 Accepted · 🔵 Superseded · ⚪ Deprecated

## Format

Copy this skeleton for new records:

```markdown
# ADR-NNNN — Short title

- **Status:** 🟡 Open
- **Date raised:** YYYY-MM-DD
- **Owners:** who decides
- **Blocks:** what cannot proceed until this resolves

## Context
What situation forces a decision. Cite the conflicting sources.

## Options
Each option with honest pros and cons.

## Decision
The call, once made — or "Not yet made."

## Consequences
What follows, including the costs accepted.

## References
Links to the documents and data behind the decision.
```
