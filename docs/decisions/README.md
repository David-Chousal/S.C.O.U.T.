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
| [0001](0001-mcu-and-radio-selection.md) | Microcontroller and LoRa radio selection | 🟢 Accepted |
| [0002](0002-lifepo4-charging-path.md) | LiFePO₄ charging path on the Feather M0 | 🟡 Open |
| [0003](0003-single-point-sensing.md) | Single-point sensing per modality (multi-depth deferred) | 🟢 Accepted |
| [0004](0004-reef-safe-anchoring-and-mooring.md) | Reef-safe anchoring and mooring approach | 🟢 Accepted |
| [0005](0005-v1-sensing-payload.md) | V1 sensing payload — temperature, turbidity, hydrophone; DO excluded | 🟢 Accepted |
| [0006](0006-rev-a-battery-chemistry.md) | Rev A prototype battery chemistry and power path (LiPo + external bq25185) | 🟢 Accepted — Rev A scope only; deployment chemistry still open in 0002 |

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
