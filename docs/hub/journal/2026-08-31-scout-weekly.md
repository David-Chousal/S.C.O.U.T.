# State Snapshot — 2026-08-31 (SCOUT Weekly)

> **Summary** — Dated snapshot of where S.C.O.U.T. stood on this day. Snapshots are append-only
> history; the always-current view is [`status.md`](../status.md).
>
> Part of the [Knowledge Hub](README.md).

---

**Phase:** 0 — Kickoff

## Where the project stands

Two of the three tracks reported themselves essentially finished for this stage of the project,
and the third was absent.

**Mechanical is done in the sense that mattered for this meeting.** John Ryan ran a full-panel
FEA covering every critical force scenario the team could construct — anchor strike, whale
impact, low-probability twist cases — and the headline result is that the **metal shackle fails
before the buoy does**. The structure is significantly overbuilt. He also rebuilt the turbidity
pod housing from scratch to industrial marine standards after the earlier leak: standardized to
O-ring sizes with a proper static face seal, engraved with the team's initials, "SCOUT",
"Electronics Housing", and the rated depth.

**Software is complete for Phase 1 and parts-limited.** Analytics and pipeline work is tested
against dummy data; firmware drivers and the real LoRa receiver are written and waiting on
hardware. Only two items on David's plate are not hardware-blocked: measurement units
([SCO-13](https://linear.app/scout1/issue/SCO-13)) and the chat assistant rename
([SCO-65](https://linear.app/scout1/issue/SCO-65)).

**Electrical is the critical path, and Isabella was not on the call.** Her open hardware
decisions — charging path, hydrophone part, base-station architecture — plus the component list
and dimensions ([SCO-70](https://linear.app/scout1/issue/SCO-70)) now gate seven blocked
mechanical issues, the Tier III mass on [SCO-74](https://linear.app/scout1/issue/SCO-74), the
parts order, and potentially the chassis print. The team's response was structural: skip the
2026-09-07 meeting and reconvene 2026-09-14, creating a deliberate two-week window for those
decisions to land and parts to arrive and be bench-tested.

Target on the table: **hardware assembled and buoy ready by October.**

## Changed today

- **Mechanical**: full-panel FEA complete; shackle identified as the weakest link. Turbidity pod
  housing remodelled around standard O-ring sizes with a static face seal
  ([SCO-91](https://linear.app/scout1/issue/SCO-91), moved to `In Progress` and given an
  assignee and project — it had neither).
- **Closed**: [SCO-69](https://linear.app/scout1/issue/SCO-69) mooring/sensor-string attachment
  point.
- **Reopened**: [SCO-74](https://linear.app/scout1/issue/SCO-74) moved back from `In Review` to
  `In Progress` and marked blocked by [SCO-70](https://linear.app/scout1/issue/SCO-70) — the
  mass budget, buoyancy numbers and freeboard model are done, but Tier III mass needs the
  electronics.
- **Five issues created**: corrosion strategy
  ([SCO-92](https://linear.app/scout1/issue/SCO-92)), Labor Day chassis print
  ([SCO-93](https://linear.app/scout1/issue/SCO-93)), pause-print threaded inserts
  ([SCO-94](https://linear.app/scout1/issue/SCO-94)), patent strategy
  ([SCO-95](https://linear.app/scout1/issue/SCO-95)), shore-to-site distance measurement
  ([SCO-96](https://linear.app/scout1/issue/SCO-96)).
- **Decisions recorded**: patent the system as a whole; defense applications declined; paid
  public API + fleet dashboard as the commercial direction; all-stainless hardware with poured
  bolt-head plugs for salt exclusion; meeting cadence moved to 2026-09-14.

## Open at end of day

- **The biofouling decision may be reversed and nobody ratified it.**
  [SCO-15](https://linear.app/scout1/issue/SCO-15) is closed with the Sea Hawk Smart Solution
  coating chosen, and `status.md` says so; the meeting ruled out anti-barnacle paint as
  reef-hostile and favoured natural growth. The coating is on the purchase list, so this needs
  settling rather than sitting. Flagged on the issue, in
  [`decision-log.md`](../decision-log.md) pending decisions, and in
  [`open-questions.md`](../research/open-questions.md) — `status.md` deliberately left alone
  until a human decides which way it goes.
- **Phase 0's end date was never actually decided.** Asked directly, John Ryan said the
  extension to 2026-09-20 was unintentional. [PR #116](https://github.com/David-Chousal/S.C.O.U.T./pull/116)
  mirrors it into the docs; resetting Linear to Sep 4 is equally defensible. Sep 20 overlaps
  Phase 1, which starts Sep 7.
- **The printed-O-ring vs [SCO-55](https://linear.app/scout1/issue/SCO-55) question has now been
  flagged in three consecutive meetings** without getting its own conversation. The housing
  remodel around off-the-shelf O-ring sizes arguably settles it in practice, but nobody said so.
- Sharp-impact and projectile cases were not modelled in the FEA panel
  ([SCO-71](https://linear.app/scout1/issue/SCO-71)).
