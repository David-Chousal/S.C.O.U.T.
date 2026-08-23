# Force Budget

> **Summary** — **Living document.** Tracks the actual computed values for each FEA load case
> defined in the [Buoy Structural Load Framework](buoy-structural-load-framework.md), as the
> inputs each one needs become available. The framework holds the equations and their
> derivations; this doc is where real numbers get plugged in and kept current. Right now most
> cases are still blocked — this file exists so the moment an input lands (environmental design
> values, mooring hardware, component masses), the next case to compute is obvious.
>
> Part of the [Knowledge Hub](../hub/README.md)'s supporting engineering docs. Tracks
> [SCO-73](https://linear.app/scout1/issue/SCO-73).

## How to update this document

1. When an input listed as blocking a case becomes available (a decision, a measurement, a
   chosen environmental value), compute that load case using the framework's equations.
2. Fill in that case's row below with the result, the date, and a link to the calculation
   (a commit, a spreadsheet, or inline here if short).
3. Update the case's status in the table and re-check whether any *other* case is now
   unblocked as a result.
4. If a computed load changes a structural conclusion, log it in
   [`design-notes.md`](../hub/design-notes.md) and, if significant, add a
   [`decision-log.md`](../hub/decision-log.md) row.

---

## What today's mass/buoyancy work unlocked

[Buoy Mass and Buoyancy Budget](buoy-mass-and-buoyancy-budget.md) supplies the printed shell's
`m_b` (part of it) and `V_disp` — real progress on inputs the framework's §1 table had marked
`[M]` "not yet available until parts are finalized." **This does not fully resolve `m_b`** —
electronics, battery, solar mount, and mooring hardware mass are still outside those five
drawings, blocked on [SCO-70](https://linear.app/scout1/issue/SCO-70). Treat every case below
that depends on `m_b` as using a **shell-only placeholder**, not the final buoy mass, until that
lands.

## Load case status

Mirrors the [Buoy Structural Load Framework §10](buoy-structural-load-framework.md#10-corrected-fea-load-cases)
table exactly — same case numbering, same primary checks.

| Case | Load | Status | Blocking input(s) | Result |
|---|---|---|---|---|
| LC1 | Slack-mooring calm-water catenary tension | **Blocked** | Mooring scope `S`, line unit weight `w_m` — depends on mooring hardware CAD ([SCO-69](https://linear.app/scout1/issue/SCO-69)) | — |
| LC2 | Upper-bound taut-line vertical tension (`F_B − W`) | **Partially unblocked** — shell-only `m_b`/`V_disp` now exist, but the *complete* deployed mass doesn't | Complete `m_b` ([SCO-70](https://linear.app/scout1/issue/SCO-70)) | Not yet computed — would be misleading with shell-only mass |
| LC3 | Current-only lateral load | Blocked | Design current `U_c` [E], `C_D` from Reynolds number | — |
| LC4 | Wave drag + inertia, phase-swept | Blocked | Design wave `H`, `T`, `d` [E]; breaking-limit check (framework §4.1) | — |
| LC5 | Wave + current, aligned, phase-swept | Blocked | Same as LC4 | — |
| LC6 | Resultant `F_H`, `F_V` at shackle | Blocked | LC2–LC5 resolved first | — |
| LC7 | `F_H` + overturning moment, per-component lever arms | Blocked | Chassis/shackle geometry ([SCO-49](https://linear.app/scout1/issue/SCO-49)); `r_CP,i` per component | — |
| LC8 | Hydrostatic pressure | **Blocked** | Submerged height/draft `h_s` — needs the *complete* `m_b` to find the true floating equilibrium, not just shell mass | — |
| LC9 | Amplified combined case | Blocked | Run last, after LC2–LC7 | — |

## Why LC2 isn't computed yet, even though `m_b`/`V_disp` partly exist

It would be easy to plug today's shell-only numbers (`m_b` ≈ 4.0 kg, `V_disp` ≈ 38.9 L) into
`F_net ≈ F_B − W` and get a number. That number would be **wrong in a misleading way** — it
excludes electronics, battery, solar mount, and mooring hardware, all of which add weight
without adding meaningful displacement, so a shell-only calculation would overstate the buoy's
true net buoyancy and understate the load the shackle actually sees. Per
[`facts.md`](../hub/facts.md)'s own rule ("a number with no source is a number someone will
build a power budget on"), this stays blank until the real inputs exist rather than publish a
number that looks final but isn't.

## Open items (mirrors the framework's §12)

1. **Mooring scope `S` and line unit weight `w_m`** — [SCO-69](https://linear.app/scout1/issue/SCO-69).
2. **Complete deployed mass `m_b`** — electronics, battery, solar mount, mooring hardware — [SCO-70](https://linear.app/scout1/issue/SCO-70).
3. **Design wave `H`, `T`** — not yet chosen.
4. **Design current `U_c`, wind `U_wind`** — not yet chosen.
5. **Final `C_D`, `C_M`, `C_A`** — needs Reynolds/Keulegan–Carpenter numbers computed from the
   above, then pulled from DNV-RP-C205, not assumed.
6. **Per-component lever arms `r_CP,i`** — needs chassis/shackle geometry finalized ([SCO-49](https://linear.app/scout1/issue/SCO-49)).
