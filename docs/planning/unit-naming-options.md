# Unit Naming Options

> **Summary** — How each S.C.O.U.T. buoy is named ([SCO-121](https://linear.app/scout1/issue/SCO-121),
> raised at the 2026-09-24 SCOUT Weekly). **Decided 2026-11-16 (David):** S.C.O.U.T. stays the fleet
> name, and each unit gets its own name, written `SCOUT-NN: NAME`. **Still open:** which names to
> use. The lists below are options to pick from, none chosen. The name is only cheap to add while the
> housings are still being designed, so the rest is worth settling before the next print.
>
> Part of the [planning docs](team-timeline.md).

---

## Format (decided)

S.C.O.U.T. is the fleet name. Each unit is named after it with a number and its own name:

```
SCOUT-01: MANTA
```

The number is the unit's `buoy_id`, written with two digits. The name can come from any theme.

## Name lists (options, none chosen)

Any theme works. These are the candidates raised so far:

| Option | Example names | Notes |
|---|---|---|
| Ocean and exploration words | MANTA, NAUTILUS, ATLAS, CORAL, SENTINEL | Proposed by David 2026-11-16 |
| Hawaiian reef species | HUMUHUMU, HONU, UHU, MANINI | Ties to the Hawaii deployment and the reef application |
| Star Trek ships | ENTERPRISE, DEFIANT, VOYAGER | The suggestion at the 2026-09-24 weekly. These are franchise names, so check whether they suit a public capstone before choosing |
| Animals | — | Raised by David 2026-11-16; no names listed yet |

## Still to decide

| Question | Options | Constraint found |
|---|---|---|
| Which names? | Any of the lists above, or another theme | — |
| Where does the name go on the unit? | Decal on the side, engraved on the side, or both (John Ryan mentioned a side decal and an engraved lid) | **The lid is full.** It already carries the four-line engraving set on 2026-09-08 (see the [decision log](../hub/decision-log.md)) and the FCC ID label engraved on 2026-10-16. The FCC ID has to stay legible, so the name goes on the side, not the lid |
| Does the name map to `buoy_id` in the data? | Fixed to `buoy_id` and shown in the console, or cosmetic only | The console already stores a per-buoy `label` next to `buoy_id` (`console/migrations/0001-init.sql`). Mapping names to IDs would need no packet or schema change, only each buoy's label set to its name. If chosen, record the mapping in [`facts.md`](../hub/facts.md) |
