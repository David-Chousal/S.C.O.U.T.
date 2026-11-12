# Test Assembly 10 (Printed Float)

> **Summary** — Fusion 360 model of the printed float, copied from Test Assembly 9 on 2026-11-11 and reworked so it
> fits a Bambu Lab P1S plate: a single-cone wall with the bottom radii brought in, a 0.20 in shorter wall, four hanging
> loops rotated to 45 degrees, a 5.25 in housing compartment (5.0 in housing plus 0.25 in clearance), and a waterline scale to 3.5 in. All numbers come from
> the Fusion model and a mesh export. **Not printed, not weighed, stability not re-run in the full solver.**
>
> Part of [floatation](README.md). Earlier hull study: [hull hydrodynamics](../../simulations/hull-hydrodynamics/README.md).

---

## What changed from Test Assembly 9

| Item | Test Assembly 9 | Test Assembly 10 |
|---|---|---|
| Overall width with fins | 10.16 in (does not fit the plate) | **9.79 in**, set by the top wide radius |
| Printer plate | n/a | Bambu Lab P1S, 256 x 256 mm (10.08 in); 0.15 in spare per side |
| Bottom face radius | 3.50 in | 3.29 in |
| Bottom wide radius | 4.50 in | 4.29 in |
| Top wide radius | 4.89 in | 4.89 in (unchanged) |
| Wall | three cone faces after the first edit, 5 degree flare | **one cone face**, about 8 degrees |
| Fin tips | 5.08 in radius | 4.88 in radius; same fin shape, size and count (8, 1.97 in wide) |
| Overall height, keel to loop top | 7.85 in | 7.48 in |
| Wall shortened | none | 0.20 in, taken out above the lettering |
| Housing compartment | 5.5 in deep at first, 5.3 in after the wall was shortened | **5.25 in deep** (5.0 in housing plus 0.25 in clearance below it); floor 1.05 in above the keel, top 6.3 in above the keel |
| Loops | 4, at 0, 90, 180, 270 degrees | 4, at **45, 135, 225, 315 degrees**; same eye (0.83 in outer radius, 0.43 in hole radius), top 0.33 in above the cap |
| Waterline scale | 1 to 3 in | 1 to 3.5 in, re-cut on the new wall |
| Cap underside | half-pipe groove | groove filled flush |
| Cap holes | none | **three through-holes, 0.75 in diameter, straight up in a triangle** (1.15 in between centres, one apex toward +Y, centred on the cap); 0.30 in deep merged recess from the inside leaves a **0.05 in** wall around them. Diameter and wall copied from Test Assembly 7, where the three holes are in a line on the side of the cap |

Other edits: the loop base is one smooth curve with a 0.12 in blend into the float and 0.08 in edge fillets, the
S.C.O.U.T. lettering is re-engraved 0.05 in deep on one side only, and the housing and cap move down with the wall.

## Behaviour (estimate only)

Draft about 2.93 in and GM about 1.30 in (Test Assembly 9 solver result: 2.71 in and 1.33 in). The estimate is a
hand integration of the new outer profile with the same centre of gravity, calibrated against the solver on
Test Assembly 9. It does not account for the mass and centre of gravity changes from the shorter wall and the
bore floor. Re-run [buoy-stability](../../simulations/buoy-stability/README.md) before relying on it.

## Open items

- The 3.5 in scale tick touches the bottom of the "O" on the lettering face. Remove the tick or raise the lettering 0.2 in.
- Whether the housing's 5 in includes its flange is not recorded; the clearance below the housing is 0.25 in if it does not and about 0.6 in if it does. Confirm against the printed housing.
- The CAD float solid is about 5,089 cm3; the slicer weight is not measured.
- Fusion history keeps earlier warnings from Test Assembly 8 (Extrude8, Extrude19, Sketch27); they pre-date this work.
- Waterline scale pass band: the loaded buoy floats at about 2.9 in, not the 2.0 in mark from the raw float tub test.
