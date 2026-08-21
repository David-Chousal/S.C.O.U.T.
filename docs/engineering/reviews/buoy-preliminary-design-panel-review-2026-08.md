# Buoy Preliminary Design Panel Review

> **Summary** — A simulated multidisciplinary panel review of the buoy's flotation, structural
> chassis, mooring, sealing, manufacturing, and field-reliability architecture, facilitated by
> Claude and conducted 2026-08-21. Panel recommendation: **proceed to detailed design**, no
> concept redesign — see [§12 Review Conclusion](#12-review-conclusion). Fourteen prioritized
> follow-up actions are in [§9](#9-prioritized-and-weighted-action-register).
>
> **Source document** — `buoy-preliminary-design-panel-review-2026-08.pdf` (John Ryan, dated
> 21 August 2026), committed alongside this file in
> [`docs/engineering/reviews/`](README.md). This is a full transcription, not a summary.
>
> ⚠️ **Status, verbatim from the source PDF:** *"This document records a simulated expert-panel
> exercise and is not a professional engineering certification, stamped design review, or
> substitute for physical testing."* Every reviewer below is a simulated persona in one
> facilitated exercise, not an independent human expert. Treat findings as engineering planning
> guidance to weigh, not as verified fact.
>
> Part of the [Knowledge Hub](../../hub/README.md)'s supporting engineering docs. Related to
> [Buoy Structural Load Framework](../buoy-structural-load-framework.md) (the U-bolt/mooring
> load-path math this review's Action A1/A2 call for) and the floatation CAD history in
> [`mechanical/cad/floatation/README.md`](../../../mechanical/cad/floatation/README.md).

---

## 1. Purpose and thought experiment

This report documents an interactive design-review thought experiment for the SCOUT
shallow-water research buoy. The assistant served as review facilitator and simulated the
questions and viewpoints that would reasonably arise from a multidisciplinary panel of marine
researchers and engineers. The objective was not to search for faults merely to produce
criticism. Each reviewer was instructed, in effect, to identify genuine strengths, distinguish
unresolved engineering from actual design defects, and raise concerns only where the stated
architecture, environment, or failure modes justified them.

The exercise focused on the flotation and primary structural architecture shown in the supplied
CAD images. The review is intentionally preliminary: several dimensions, final mass properties,
hardware selections, environmental design loads, and detailed seal geometry remain undefined.

## 2. Methodology

The review proceeded in three stages. First, the designer presented the concept and CAD images.
Second, simulated discipline reviewers asked clarification questions before criticizing the
design, preventing assumptions from being treated as facts. Third, the designer supplied
additional design intent and the panel produced discipline-specific assessments.

| Stage | Method | Purpose |
|---|---|---|
| 1 — Concept presentation | Designer described geometry, materials, assembly, flotation, electronics access, and mooring | Establish the intended architecture |
| 2 — Clarification | Marine/mechanical, mooring, flotation, materials, sealing, field, and failure-mode questions were posed | Avoid critiques based on missing or invented assumptions |
| 3 — Panel review | Each simulated specialist evaluated the clarified design independently, followed by synthesis | Separate strengths, verification needs, recommended changes, and critical risks |

## 3. Design basis provided during the conversation

| Parameter | Current design basis |
|---|---|
| Overall geometry | Approximately 18 in overall radius (~36 in diameter, subject to confirmation) and 12 in tall |
| Architecture | Central hollow PETG chassis is the primary structural member. Six hollow flotation wedges surround it |
| Printing | 0.20 mm layer height; currently considering 3–4 walls and ~15% gyroid infill |
| Fasteners | M4 fasteners. Heat-set inserts are used in printed holes; wedge inserts are additionally epoxied |
| Wedge attachment | Each wedge uses six bolts, three per side. Bottom cap uses three bolts to the chassis |
| Flotation | Each wedge is filled after assembly with closed-cell polyurethane marine flotation foam. Excess is trimmed; a wedge cap is press-fit and epoxied |
| Exterior protection | Entire exterior is intended to receive marine epoxy/sealing paint |
| Central access | Bolted top lid uses an axially compressed O-ring face seal |
| Top penetrations | Solar mount and sensor-string exit originate from the chassis top. Cable gland/feedthrough selection awaits cable dimensions |
| Mooring | Stainless U-bolt passes through the bottom of the chassis; threaded legs extend inside and are sealed with epoxy. A base/backing plate is intended. Mooring load is carried by the chassis, not the wedges |
| Environment | Shallow water, approximately 2–8 m and more commonly 2–3 m; moderate-to-low wave conditions; significant UV exposure |
| Service interval | Target is one year without service |
| Serviceability | Electronics housing is intended to be readily removable during deployment |
| Failure philosophy | A cracked wedge should retain useful buoyancy because of closed-cell foam. Central-chassis flooding should not sink the buoy |
| Mass/freeboard | Final mass and hardware weight are not yet known. Designer expects mass >1 kg and wants reasonable freeboard |

## 4. Clarification questions raised by the panel

**Marine / Mechanical reviewer** — Overall diameter/height; chassis OD/ID and wall thickness;
wedge wall thickness; assembled mass; print settings/orientation; fastener size and insert
depth; whether wedges are structural.

**Mooring / Structures reviewer** — Exact U-bolt attachment; hardware size; load path; water
depth; waves/current; mooring-line and anchor arrangement.

**Flotation / Stability reviewer** — Displacement/freeboard target; component mass; vertical
location of battery/heavy items; intended upright orientation; acceptable heel; symmetry of
wedge filling.

**Materials / Manufacturing reviewer** — Exact foam type; whether PETG is the permanent marine
surface; protective coating; whether foam is buoyancy-only or structural.

**Waterproofing / Reliability reviewer** — Face-seal configuration; O-ring material/size/
compression; whether fasteners penetrate the sealed boundary; cable glands; whether chassis or
inner housing is the actual waterproof electronics barrier.

**Field / Research reviewer** — Deployment duration; biofouling/UV/contact exposure; retrieval
strategy; whether electronics can be removed without dismantling flotation.

**Failure Modes reviewer** — Consequences of one flooded/damaged wedge; expected water uptake;
whether the buoy remains positively buoyant if the chassis floods.

## 5. Individual reviewer responses

### Marine Structures Engineer

The basic architecture is good. Separating the system into a primary structural central chassis
and non-primary foam flotation wedges produces a clear load path and prevents the wedge joints
from becoming necessary to mooring survival. The reviewer would keep this architecture.

The unresolved concern is the structural definition of the PETG chassis. With a typical 0.4 mm
nozzle, 3–4 perimeters may represent only roughly 1.2–1.6 mm of printed shell thickness. That
should not yet be accepted as the final one-year mooring structure, especially around the U-bolt
attachment. General 15% gyroid infill is less valuable than purposeful perimeters, ribs, local
solid sections, generous fillets, and load-spreading geometry.

Recommended direction: increase effective wall thickness, reinforce the U-bolt region, use a
large backing plate, add ribs/webs that transfer load into the cylindrical chassis, and verify
the final structure by analysis and destructive/proof testing. The reviewer is not rejecting
PETG; the point is that the structural chassis must be deliberately engineered rather than
treated as an ordinary printed enclosure.

**Verdict:** architecture good; structural chassis requires detailed development.

### Mooring / Ocean Engineer

The reviewer strongly supports excluding the flotation wedges from the primary mooring load
path. A damaged or missing wedge should not interrupt the connection between the anchor/mooring
and the central structure.

The mooring attachment should be conceived as: mooring line → stainless U-bolt → substantial
stainless backing/load-spreading structure → reinforced PETG chassis. The backing structure
should distribute bearing load rather than allowing two U-bolt legs to create severe local
stresses in thin printed material.

Later structural evaluation should include steady-current drag, wave-induced horizontal and
vertical loading, mooring pretension, and an appropriate dynamic factor. A standard drag
starting point is `F_D = 0.5 * rho * C_D * A * V^2`. For the stated shallow, moderate/low-wave
environment, the architecture does not appear inherently unreasonable. Repeated cyclic loading,
fatigue, creep, and rocking over a one-year deployment may be more important than a single large
static force.

### Flotation Engineer

The six foam-filled wedges provide useful compartmentalization and fault tolerance. Because
closed-cell marine foam supplies buoyancy even if a printed shell is breached, the PETG skin is
not the sole flotation barrier.

The reviewer recommends formalizing two requirements: (1) complete loss or flooding of one wedge
must not cause loss of the buoy, and (2) flooding of the central chassis should still leave the
system positively buoyant and recoverable.

If the stated ~18 in dimension is truly radius, a 36 in diameter by 12 in tall full cylindrical
envelope is about 12,215 in³, or about 200 L. The actual buoy is less because of its center,
chamfers, gaps, and geometry, but this indicates that the likely problem is not simply achieving
positive buoyancy. The design task is to control waterline, freeboard, center of buoyancy,
stability, and solar-panel attitude. The panel recommends calculating required displacement
after obtaining a realistic mass budget rather than maximizing foam volume without a target.

### Naval Architecture / Stability Reviewer

The buoy is very wide relative to its height, which generally supports strong initial stability.
However, solar hardware and other above-water equipment can shift the center of gravity and add
wind/wave overturning moments.

The reviewer recommends determining center of gravity (CG), center of buoyancy (CB), and
righting behavior as the buoy heels. Heavy components, especially the battery, should be placed
low in the chassis where practical. CAD hydrostatics plus a physical tilt/righting test should
be sufficient for this development stage. The architecture also preserves the option to add low
ballast if testing shows insufficient self-righting behavior.

### Manufacturing Engineer

The proposed sequence — print shell, bolt wedge to chassis, fill with foam, allow expansion,
trim excess, install cap, epoxy, then coat — is sensible. Filling after mechanical attachment
helps avoid distorting mating geometry before assembly.

The key manufacturing risk is foam expansion pressure. Two-part polyurethane foam can deform a
thin printed shell if expansion is constrained. Leaving the wedge open during expansion and
trimming afterward is therefore a good choice. The reviewer recommends sacrificial wedge trials
to establish foam quantity, expansion behavior, fill completeness, shell distortion, and final
density before committing to the production process.

### Additive Manufacturing Reviewer

PETG shell + closed-cell foam + protective marine coating is a reasonable prototype strategy for
the flotation wedges because the foam preserves buoyancy if the printed shell is damaged.

The central chassis deserves a different standard because it carries the mooring load. Layer
orientation, local wall direction, ribs, and interlayer loading should be deliberately
controlled. The reviewer would prefer thick walls/perimeters, structural ribs, local solid
regions, and modest infill over a generic 3–4 wall / 15% gyroid recipe. The primary structure
should be treated as a designed FDM structural member rather than simply a housing.

### Fasteners / Inserts Reviewer

M4 fasteners and heat-set inserts are reasonable for retaining non-primary flotation modules,
subject to verification of insert engagement, printed wall geometry, and loosening resistance.
Epoxy around wedge inserts can add retention, but it should not substitute for sound insert
geometry.

The reviewer agrees that heat-set inserts should not carry the primary mooring load. The
through-bolted U-bolt and backing structure are the correct direction. Marine-compatible
stainless hardware and a deliberate anti-loosening strategy are recommended. Galvanic
compatibility should be revisited if aluminum or other metals are later introduced.

### Waterproofing Engineer

A bolted O-ring face seal is an appropriate top-access concept. The main concern is that the
current fasteners are described as being inside the O-ring perimeter. If those penetrations
communicate with the dry volume, every fastener becomes an additional leak path.

Preferred architecture: place lid fasteners outside the O-ring/dry sealing boundary so the
O-ring is the single primary lid seal. Rubber/bonded sealing washers can help when fasteners
must penetrate the boundary, but they create multiple secondary seals and should be treated as
a fallback rather than the cleanest configuration.

The reviewer therefore recommends revisiting the lid geometry while CAD changes are still
inexpensive.

### O-ring / Seal Reviewer

A static axial face O-ring is well suited to a shallow 2–8 m deployment. The O-ring should be
selected from the actual sealing diameter and available gland geometry rather than from bolt
size. The design should use a continuous groove, smooth sealing surface, radiused/non-damaging
edges, controlled squeeze, and adequate groove volume.

A preliminary static axial squeeze target of roughly 20–30% can be used as a starting design
range, but the final gland must be based on the selected standard O-ring and material data.
EPDM is a reasonable candidate for seawater exposure. Final O-ring size and gland dimensions
remain an action item once chassis OD, sealing diameter, groove width, and available depth are
fixed.

### Electronics / Field-Service Reviewer

The ability to remove the electronics housing while the flotation and mooring structure remain
deployed is a significant strength. It separates the long-life marine structure from the
serviceable electronics package.

The reviewer recommends preserving that modularity in the wiring design. Cable glands,
connectors, and feedthroughs should allow actual field removal without requiring the operator to
dismantle the flotation body or disturb permanent potted connections unnecessarily.

### Marine Scientist / Deployment Reviewer

The six-wedge architecture is justified by available manufacturing methods, modular assembly,
compartmentalized flotation, development replaceability, and foam redundancy. The reviewer would
not replace it with a single giant printed shell merely for geometric simplicity.

A one-year field unit must tolerate UV, biofouling, fishing line, debris, incidental handling,
and marine growth. The design should continue to work when dirty. Small drainage features,
exposed friction fits, or delicate features should not be assumed to remain clean or free-moving
throughout deployment.

### Materials Reviewer

A marine coating over PETG is sensible as environmental and UV protection, but it should not
automatically be counted as structural reinforcement. PETG-to-epoxy adhesion depends on surface
preparation and coating chemistry.

Unless a laminate system is deliberately characterized, structural analysis should conservatively
assign the primary structural load to the printed chassis. The reviewer recommends coated PETG
test coupons using the exact planned surface preparation, followed by soak/UV exposure where
practical and simple adhesion/peel/scratch evaluation.

### Failure-Mode Reviewer

The design has a sensible redundancy philosophy: a wedge-shell crack should not remove its foam
buoyancy; one compromised wedge should not sink the system; an electronics leak should not make
the buoy unrecoverable; and central-chassis flooding should still leave positive buoyancy.

The most important single-point failure is the mooring attachment. If the U-bolt, backing
structure, local chassis region, or mooring connection fails, the complete buoy can be lost.
Consequently, this subsystem deserves disproportionate analysis, safety factor, inspection, and
proof testing relative to non-primary wedge hardware.

## 6. Failure-mode snapshot

| Failure | Intended outcome | Assessment | Priority |
|---|---|---|---|
| One wedge shell cracks | Foam continues to provide buoyancy | Good design philosophy; test water uptake | Medium |
| One wedge fully compromised | Remaining wedges maintain buoyancy | Must verify quantitatively | High |
| Exterior coating damaged | PETG/foam remain functional | Acceptable if coating is not structural | Medium |
| Electronics enclosure leaks | Electronics may fail; buoy remains recoverable | Desired system-level behavior | Medium |
| Central chassis floods | Foam keeps buoy positively buoyant | Must verify with worst-case mass | High |
| One wedge fastener loosens | Remaining fasteners retain module | Likely acceptable; use anti-loosening strategy | Medium |
| Multiple wedge fasteners loosen | Module can move/detach | Verify retention and inspectability | High |
| Top O-ring fails | Central region can flood | Recoverability requirement mitigates consequence | Medium |
| U-bolt/load-path failure | Complete buoy can be lost | Critical single-point failure | **Critical** |

## 7. Panel summary

Panel consensus is to continue the current architecture into detailed design rather than perform
a major concept redesign. The separation of structural chassis from flotation, six independent
foam-filled flotation modules, serviceable electronics, direct through-bolted mooring concept,
and static face-sealed top access are all defensible choices.

The largest gap is not a flawed overall concept; it is that the primary structural and sealing
details have not yet been engineered to the same level as the architecture. The U-bolt/
backing-plate/chassis load path is the most consequential single-point system. The next most
important work is mass/displacement/stability definition, chassis print structure, and
simplification of the lid sealing boundary.

## 8. Preliminary panel ratings

| Area | Score / 10 | Interpretation |
|---|---|---|
| Overall architecture | 8.0 | Positive — retain concept |
| Flotation philosophy | 9.0 | Strong redundancy concept |
| Serviceability | 8.5 | Strong; preserve wiring modularity |
| Waterproofing concept | 7.0 | Good basis; seal-layout refinement recommended |
| Structural definition | 5.0 | Incomplete rather than fundamentally poor |
| Readiness to enter detailed design | 8.0 | Yes, with priority actions below |

## 9. Prioritized and weighted action register

Weights below are a planning aid, not a formal risk calculation. Score = Severity (1–5) ×
Likelihood/uncertainty (1–5) × Mission leverage (1–5). Higher scores should be addressed
earlier. Tasks that remove major uncertainty are intentionally weighted highly.

| ID | Task | S | U | L | Score | Deliverable / acceptance intent | Timing |
|---|---|---|---|---|---|---|---|
| A1 | Engineer U-bolt/backing-plate/chassis load path | 5 | 4 | 5 | 100 | Define U-bolt size/material, backing plate, local wall thickness, ribs/fillets, nut retention, sealing, and load path. Analyze and proof-test | Before structural design freeze |
| A2 | Establish environmental design loads and mooring model | 5 | 4 | 5 | 100 | Define current/wave design cases, drag area/Cd assumptions, mooring geometry, pretension, anchor, and dynamic amplification basis | Before FEA |
| A3 | Create realistic mass budget + displacement/freeboard model | 4 | 5 | 5 | 100 | Estimate every component, foam, coating, fasteners, battery, electronics and solar hardware; calculate waterline and one-wedge/chassis-flood cases | Before final flotation geometry |
| A4 | Redesign/verify primary PETG chassis print structure | 5 | 4 | 4 | 80 | Choose nozzle/perimeters/effective wall thickness, print orientation, ribs, local solid regions and fillets based on load path; do not rely on generic infill | Before final chassis print |
| A5 | Refine lid O-ring/fastener sealing boundary | 4 | 4 | 4 | 64 | Prefer bolts outside dry O-ring boundary. If impossible, design and test secondary fastener seals | Before lid design freeze |
| A6 | Select O-ring and design gland | 4 | 3 | 4 | 48 | Once sealing diameter is fixed, select standard EPDM O-ring and calculate gland width/depth, squeeze, fill, tolerances and surface finish | Before waterproof test |
| A7 | Quantify stability and component vertical placement | 4 | 3 | 4 | 48 | Determine CG/CB, place battery low, model heel/righting, and define ballast provision if needed | Before field prototype |
| A8 | Run foam-fill manufacturing trials | 3 | 4 | 4 | 48 | Use sacrificial wedge(s) to determine pour quantity, expansion pressure, distortion, completeness, trimming and cap process | Before producing six final wedges |
| A9 | Verify damaged/flooded buoyancy cases | 4 | 3 | 4 | 48 | Demonstrate positive buoyancy with one wedge lost/compromised and with central chassis flooded at worst-case assembled mass | Before deployment |
| A10 | Define marine fastener and anti-loosening strategy | 3 | 3 | 4 | 36 | Select stainless grade, washers/nuts/thread-locking strategy, insert engagement and inspection method; review galvanic compatibility | Before final assembly |
| A12 | Finalize cable glands/feedthroughs for serviceability | 4 | 3 | 3 | 36 | Select after cable dimensions are known; maintain removable electronics and minimize leak paths | When cable set is frozen |
| A11 | Validate coating adhesion and UV/water durability | 3 | 3 | 3 | 27 | Prepare PETG coupons with exact surface prep/coating; perform soak and adhesion checks; UV exposure where practical | Before one-year deployment |
| A13 | Plan biofouling/field handling features | 3 | 3 | 3 | 27 | Review drainage, snag points, cleanability, retrieval, labels/inspection access, and behavior under marine growth | Before field deployment |
| A14 | Conduct integrated waterproof/proof/tilt tests | 5 | 3 | 5 | 75 | Pressure/submersion test sealing, structural proof-load mooring attachment, heel/righting test, and deliberate flood/damage recovery tests | Final gate before deployment |

*(Table order follows the source PDF's presentation order, not a strict score sort — A14 at 75
sits below several 48-scored rows in the source; scores are reproduced as given.)*

## 10. Recommended immediate sequence

1. Confirm whether 18 in is radius or diameter and lock the current outer envelope.
2. Build a first-pass mass budget and hydrostatic/freeboard spreadsheet/CAD model.
3. Define the mooring environment and conservative design load cases.
4. Detail the U-bolt, backing plate, reinforced chassis bottom, and load-transfer ribs.
5. Select a structural print strategy for the chassis and run FEA/hand checks using the defined
   loads.
6. Rework the top lid so the O-ring is the clean primary seal, then select the actual O-ring/
   gland.
7. Print sacrificial structural and flotation coupons/components for proof, foam-expansion,
   coating, and sealing tests.
8. Only after those results, freeze the six-wedge production geometry and integrated prototype.

## 11. Open data needed for the next review

- Central chassis OD, ID, final wall/rib geometry, and print orientation.
- Exact interpretation of the 18 in overall dimension.
- Final component mass estimate and vertical component locations.
- U-bolt size, stainless grade, backing-plate geometry, mooring line, anchor and expected
  pretension.
- Representative current velocity and wave design condition for the intended site.
- Top-lid sealing diameter and available O-ring gland envelope.
- Solar panel/mount dimensions and mass.
- Sensor-string cable diameters and required connectors/feedthroughs.
- Exact flotation foam product and expansion ratio.
- Exact marine coating/epoxy system and PETG surface preparation.

## 12. Review conclusion

The simulated panel's current recommendation is **PROCEED TO DETAILED DESIGN WITH ACTIONS**. No
reviewer identified a reason to abandon the central-chassis / six-foam-wedge concept. The
architecture is strongest where it deliberately separates flotation, structural load transfer,
and serviceable electronics. The next review should concentrate on the isolated central chassis,
especially the bottom U-bolt/backing structure and the top lid/O-ring region, followed by
quantitative hydrostatics and environmental load definition.

Because this is a thought experiment based on a conversational design description and two CAD
views, all ratings and action weights should be treated as engineering planning guidance. Final
deployment decisions should be supported by dimensions, calculations, material/process data, and
physical tests.
