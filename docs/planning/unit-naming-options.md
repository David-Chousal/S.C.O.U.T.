# Unit Naming Options

> **Summary** — Options for giving each S.C.O.U.T. buoy its own name, the way ships are named
> rather than numbered. **Nothing here is decided.** Every name list below is an option for the
> team to choose from ([SCO-121](https://linear.app/scout1/issue/SCO-121), raised at the
> 2026-09-24 SCOUT Weekly). The name is only cheap to add while the housings are still being
> designed, so it is worth settling before the next print.
>
> Part of the [planning docs](team-timeline.md).

---

## Format (David's preferred option, not decided)

Keep **S.C.O.U.T.** as the fleet name and give each unit a number plus a name:

```
SCOUT-01: MANTA
```

The number is the unit's `buoy_id`, written with two digits. The name comes from whichever list
the team picks. This keeps the project name on every unit and still gives each one a name people
can say out loud.

## Name lists (options, none chosen)

| Option | `buoy_id` 1 | 2 | 3 | 4 | 5 | Notes |
|---|---|---|---|---|---|---|
| A. Ocean and exploration words (David's favorite) | MANTA | NAUTILUS | ATLAS | CORAL | SENTINEL | Proposed by David 2026-11-16 together with the `SCOUT-NN` format |
| B. Hawaiian reef species | HUMUHUMU | HONU | UHU | MANINI | — | Ties to the Hawaii deployment and the reef application. A fifth name is still needed |
| C. Star Trek ships | ENTERPRISE | DEFIANT | VOYAGER | — | — | The suggestion at the 2026-09-24 weekly. These are franchise names, so check whether they suit a public capstone before choosing |

## Still to decide

| Question | Options | Constraint found |
|---|---|---|
| Which list? | A, B, C, or another | — |
| Is the `SCOUT-NN: NAME` format used? | Yes, or the name alone | — |
| Where does the name go on the unit? | Decal on the side, engraved on the side, or both (John Ryan mentioned a side decal and an engraved lid) | **The lid is full.** It already carries the four-line engraving set on 2026-09-08 (see the [decision log](../hub/decision-log.md)) and the FCC ID label engraved on 2026-10-16. The FCC ID has to stay legible, so the name goes on the side, not the lid |
| Does the name map to `buoy_id` in the data? | Fixed to `buoy_id` and shown in the console, or cosmetic only | The console already stores a per-buoy `label` next to `buoy_id` (`console/migrations/0001-init.sql`). Mapping names to IDs would need no packet or schema change, only each buoy's label set to its name. If chosen, record the mapping in [`facts.md`](../hub/facts.md) |
