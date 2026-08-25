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

## Native source

All CAD in this tree is built in **Onshape**, which has no downloadable native file — the
document only exists live in the cloud. Per
[CONVENTIONS.md § File formats](../../docs/CONVENTIONS.md#file-formats), the native-source
reference for cloud CAD tools is a share link, not a repo file:

**[S.C.O.U.T. mechanical — Onshape document](https://cad.onshape.com/documents/dde7d770a7f2e84b52bc9fb5/w/ae73f9a2c15a69a24bbaec2a/e/c10fd1132e8b0e9eb908d70b)**

This one document holds the whole project — floatation, sensor housing, electronics housing,
all of it — not a separate document per subsystem. Internal tab/part naming inside it doesn't
always match this repo's file names (Onshape's auto-generated "Copy 1 Copy 2" naming); the
`README.md` in each subsystem folder here is the clearer map of what each STEP export is.

**Flagged, not reconciled (2026-08-24):** John mentioned switching primary CAD modeling work to
**Fusion 360** in the [2026-08-24 SCOUT Weekly](../../docs/planning/meeting-notes.md#2026-08-24--scout-weekly)
("because it's just better"). Fusion is already the documented tool for FEA studies (see
[`mechanical/test/README.md`](../test/README.md)), so this may just be that — but it wasn't
explicit, and if general CAD modeling is actually moving off Onshape, this section is wrong and
needs updating, not just this note added. Left open rather than guessed at.
