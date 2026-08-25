# CAD

Source CAD models and exported STEP/STL, organized by subsystem.

| Folder | Contents |
|---|---|
| [floatation/](floatation/) | Hull, float, and buoyancy structure |
| [electronics-housing/](electronics-housing/) | Sealed electronics bay enclosure |
| [sensor-housing/](sensor-housing/) | Sensor mounting and housing |
| [stem/](stem/) | Structural member carrying the sensor pod underwater |
| [solar-mount/](solar-mount/) | Solar panel mounting bracket |

Versioned filenames only for physical artifacts (`part-name-v2.step`) — see
[CONVENTIONS.md § Versions](../../docs/CONVENTIONS.md#versions).

## Native source — split across two tools

**Resolved 2026-08-25** (was flagged 2026-08-24 below): CAD work is deliberately split by tool,
not migrating wholesale off Onshape.

- **Part geometry — Onshape.** Individual part modeling (wedges, chassis, housings, all of it)
  continues in Onshape, same as always.
- **Assembly — moving to Fusion 360.** John is gradually shifting assembly work (fitting parts
  together, checking clearances/interferences, the whole-buoy view) to Fusion 360. This is a
  slow, ongoing move, not a cutover — expect both tools in active use for a while.
- **FEA — Fusion 360**, unchanged and already documented in
  [`mechanical/test/README.md`](../test/README.md).

Per [CONVENTIONS.md § File formats](../../docs/CONVENTIONS.md#file-formats), the native-source
reference for cloud CAD tools is a share link, not a repo file. For part geometry, that's still:

**[S.C.O.U.T. mechanical — Onshape document](https://cad.onshape.com/documents/dde7d770a7f2e84b52bc9fb5/w/ae73f9a2c15a69a24bbaec2a/e/c10fd1132e8b0e9eb908d70b)**

This one Onshape document holds the whole project's part geometry — floatation, sensor housing,
electronics housing, all of it — not a separate document per subsystem. Internal tab/part
naming inside it doesn't always match this repo's file names (Onshape's auto-generated "Copy 1
Copy 2" naming); the `README.md` in each subsystem folder here is the clearer map of what each
STEP export is. Fusion assembly files aren't yet tracked with their own share link here — add
one once the assembly move is far enough along to be the thing a teammate should actually open.

<details>
<summary>Flagged 2026-08-24, resolved 2026-08-25 (kept for the record)</summary>

John mentioned switching primary CAD modeling work to Fusion 360 in the
[2026-08-24 SCOUT Weekly](../../docs/planning/meeting-notes.md#2026-08-24--scout-weekly)
("because it's just better"), without saying whether that meant all modeling or just FEA (Fusion
was already the documented FEA tool). Left open rather than guessed at. Clarified 2026-08-25:
part geometry stays in Onshape; only assembly is moving to Fusion, gradually.

</details>
