# Prototype Coating Alternatives Analysis (Weighted Matrix)

> **Summary** — A weighted alternatives matrix for the waterproof coating on the S.C.O.U.T. printed floats
> (prototype dock and boat tests of one to two months): eight options, nine criteria, rank-order-centroid weights,
> an independent blind scoring from a fixed rubric, and a sensitivity check. **Status: in progress. The evidence is
> incomplete and the result does not pick a winner.** Built 2026-11-02 with John Ryan Myrdal for the thesis
> alternatives analysis ([SCO-149](https://linear.app/scout1/issue/SCO-149), [SCO-207](https://linear.app/scout1/issue/SCO-207))
> and the coating choice ([SCO-246](https://linear.app/scout1/issue/SCO-246)). Resume here.
>
> Part of [`docs/engineering/`](..). Tracking issue: [SCO-295](https://linear.app/scout1/issue/SCO-295). Data: [`scores.csv`](scores.csv). Re-run: [`compute_totals.py`](compute_totals.py).

---

## How to resume

1. **Get the missing data sheets** (list in [Missing evidence](#missing-evidence)). Home Depot and Rust-Oleum block automated
   fetches (HTTP 403), so open them in a browser and save the PDFs or paste the text.
2. **Rescore only the cells marked "no evidence"** in [`scores.csv`](scores.csv) using the [rubric](#rubric-fixed-before-scoring),
   citing the document for each change.
3. Run `python3 compute_totals.py` for totals, weighting sensitivity and the robustness check.
4. Compare with the 2-week sanded-coupon soak that [SCO-246](https://linear.app/scout1/issue/SCO-246) already requires.
5. When the assignment arrives, turn this into the thesis alternatives analysis (see [Thesis use](#thesis-use)).

## Decision and scope

**Decision:** which waterproof coating to put on the printed PETG floats (mushroom 702 g, regular 1148 g) for dock and
boat tests lasting one to two months, hung by rope through the floatation holes in salt water. This is not the year-long
deployment coating or the antifouling choice.

**Already logged:** the provisional pick is Rust-Oleum Stops Rust LeakSeal Black spray, one thick coat over sanded PETG
([decision log, 2026-10-31](../../hub/decision-log.md)). It stays provisional until a sanded coupon survives a 2-week soak.

## Alternatives

| Label | Alternative | Product (link) | Note |
|---|---|---|---|
| A | LeakSeal flexible rubber spray | [Rust-Oleum Stops Rust LeakSeal Black, 15 oz](https://www.homedepot.com/p/Rust-Oleum-Stops-Rust-15-oz-LeakSeal-Black-Flexible-Rubber-Coating-Spray-Paint-351903/312887769) | Current provisional pick |
| B | Marine topside paint | [Rust-Oleum Marine topside paint, 1 qt](https://homedepot.com/p/Rust-Oleum-Marine-1-qt-Gloss-White-Topside-Paint-206999/100130040) | Above the waterline only |
| C | Marine spar varnish | [Rust-Oleum Marine spar varnish, 1 qt](https://homedepot.com/p/Rust-Oleum-Marine-1-qt-Clear-Gloss-Spar-Varnish-Coatings-207008/202520882) | Above the waterline only |
| D | Clear coat spray | [Stops Rust Protective Enamel gloss crystal clear, 12 oz](https://www.homedepot.com/p/questions/Rust-Oleum-Stops-Rust-12-oz-Protective-Enamel-Gloss-Crystal-Clear-Spray-Paint-7701830/100176222/2) | Home Depot support says it will not adhere to plastic |
| E | Plastic primer spray | [Rust-Oleum Specialty Plastic Primer, 12 oz](https://homedepot.com/p/Rust-Oleum-Specialty-12-oz-Plastic-Primer-Spray-6-Pack-209460/202058455) | Primer only |
| F | Primer then clear coat | E, then D | Scored as a two-step system |
| H | Do Nothing | Uncoated sanded PETG | Baseline required by the assignment rubric; added 2026-11-02 |
| G | Industrial bottom paint | [Sea Hawk Smart Solution](https://defender.com/en_us/sea-hawk-smart-solution-antifouling-paint) | Copper-free, biocide-containing; specialty order. Stands in for "another industrial buoy solution"; swap if another product is meant |

Not used: Interlux [Trilux 33 aerosol](https://defender.com/en_us/interlux-trilux-33-aerosol-antifouling-paint) and
[Micron](https://defender.com/en_us/interlux-micron-66-antifouling-bottom-paint) were found but not scored; their biocides were
not checked against the reef-safe rule ([ADR-0004](../../decisions/0004-reef-safe-anchoring-and-mooring.md)).

## Criteria and weights

Weights use the **rank-order centroid** method: rank the criteria by what a failure costs, then
weight = (1/n) × Σ from the rank to n of 1/k. It is standard and reproducible, so the weights are not picked by feel.
The ranking was set before any scoring. **Reef safety was moved from rank 4 to rank 2 at John's request** (his
reasoning: it must carry a higher weight). **Cost was then moved from rank 8 to rank 4** (the budget is limited), and **ease
of sourcing was added as C9 at rank 5, just below cost** (John, 2026-11-03). The ranking is set by project constraints, not by
which option it favors; the earlier ranking is kept as a sensitivity row in [Results](#results).

| Rank | Criterion | Weight (%) | Why it ranks here |
|---|---|---|---|
| 1 (C1) | Waterproofing when submerged | 31.4 | A leak ruins the test; the coating's whole job |
| 2 (C2) | Reef safety | 20.3 | Debris or leachate in a sanctuary during tests; the team's reef-safe principle (ADR-0004) |
| 3 (C3) | Seals layer lines and seams | 14.8 | Printed PETG is porous along layer lines |
| 4 (C8) | Cost | 11.1 | Limited project budget |
| 5 (C9) | Ease of sourcing | 8.3 | Walk into a store vs shipping time and delays; the coating window is Nov 9 to 13 |
| 6 (C4) | PETG adhesion and solvent compatibility | 6.1 | Delamination exposes the porous print |
| 7 (C5) | Flexibility and abrasion | 4.2 | Rope harness at the holes, dock handling |
| 8 (C6) | Application (thickness, cure time, ease) | 2.6 | Schedule only; coating goes on before Nov 13 |
| 9 (C7) | Added mass | 1.2 | Measurable and recordable; the floats are light |

**Feasibility gate (John, 2026-11-03):** before scoring, an option must be on hand for the Nov 9 to 13 coating window; an option that
cannot be sourced by then is excluded whatever its score and shown for comparison only. G (specialty order, C9 = 1) fails the gate; its lead time
with the supplier is not yet confirmed. Among options that pass, A ranks first under the main weights, reef safety first, rank-sum weights and the
earlier ranking; equal weights favor Do Nothing, which contradicts the coating's purpose.

Considered and not scored: safety and ventilation (screen: all are solvent
products, the hazard form requires ventilated work), reparability (low priority).

## Rubric (fixed before scoring)

Score each criterion 1 to 5 (5 best). **If the documents do not address it, score 2 and write "no evidence", identically for
every option.** Facts from a related product version, a retailer listing or a review are allowed but must be named as such.
Systems (F): waterproofing and flexibility = lower of the components; reef safety = worse; seams = sum of film builds;
adhesion = the layer touching the plastic if topcoats are accepted; application = all steps; mass and cost = sum.

| Criterion | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|
| C1 Waterproofing | Rated for continuous immersion, months or more | Rated for immersion or underwater use (shorter, intermittent, bottom paint) | Documented waterproof or watertight film, no immersion rating | Water-resistant only, or no evidence | States not for immersion, or not below the waterline |
| C2 Reef safety | Free of biocides and metals, no aquatic hazard on the safety data sheet | No biocide or metals and no aquatic hazard stated | No biocide listed, data sheet silent on aquatic hazard | No evidence, or solvent/resin aquatic hazard stated | Intentional biocide, copper or metals, or very toxic to aquatic life |
| C3 Seams (film build) | High-build or filler, 4+ mils per coat | High-build or 2 to 4 mils per coat | Standard, about 1 to 2 mils | Under 1 mil, or no evidence | Thin or not meant to build |
| C4 PETG adhesion | Lists PETG or bonds to printed plastic | Bonds to or prepares plastic generally | General substrates, with a sanding or primer route | No plastic mentioned, or no evidence | States it will not adhere to plastic |
| C5 Flexibility | Flexible film plus abrasion statement | Documented flexible film | Tough or abrasion-resistant film | No statement | Brittle or hard only |
| C6 Application | One spray product, touch and recoat within 1 h, dry in 24 h, no primer | Spray with one short wait | Needs a primer or 24 h+ recoat, or brush with short cure | Brush with long cure, specialty, or no evidence | Specialist or multi-day cure with mixing |
| C7 Added mass (total dry film) | 2 mils or less | Over 2 to 4 | Over 4 to 8 | Over 8, or no evidence | Over 12 |
| C8 Cost, two floats once | Under $15 | $15 to 30 | Over $30 to 60 | Over $60 to 120, or no price | Over $120 |
| C9 Ease of sourcing | Sold at a local store (Home Depot or similar), same day | Local store, but order or pick-up needed | Online order, a few days of shipping | Online, a week or more, or no source found | Specialty order that cannot arrive before the Nov 9 to 13 coating window |

## Evidence (fact sheets given to the scorer)

The scorer saw only these labelled facts, without brand names or any hint of the current pick.

| Label | Facts and source type |
|---|---|
| A | **Related brush-on version, maker data sheet** ([Rust-Oleum Canada RLS-09](https://www.rustoleum.ca/-/media/DigitalEncyclopedia/Documents/RustoleumCA/TDS/2023-tds-update/LeakSeal/RLS09-LeakSeal-Flexible-Rubber-SealantTDS-Canada.pdf), 946 mL can; the spray's own sheet was not found): rubberized, high-build, water-tight flexible seal; suitable for metal, aluminum, galvanized metal, PVC, concrete, masonry, asphalt roofing, vinyl siding, fiberglass; **"not intended for water immersion"**; 2 to 4 mils dry film per coat, several light coats better than one heavy; touch 15 to 30 min, recoat 30 to 60 min, dry 24 h; VOC under 550 g/L; xylene solvent. **Spray safety data sheet (2023)** ([search result](https://www.rustoleum.com/MSDS/techdocs/nz/SDS/en/279229.pdf)): lists ethylbenzene, n-heptane, titanium dioxide, with flammability, aspiration, suspected-carcinogen and organ hazard codes; no aquatic code seen in the excerpt. Retailer listings: PVC and uPVC among surfaces. No price found. |
| B | **Maker data sheet** ([TDS](https://www.rustoleum.com/-/media/CBB8CD1D958D464F93F444C21669D03A.pdf), seen via search): oil-based alkyd, above the waterline only, do not use below it; about 100 sq ft per quart; bare steel needs a metal primer. Retailer case price $52.29 for two quarts (another color). No dry film, recoat, VOC or aquatic data found. |
| C | **Retailer and maker listing:** protects boat exteriors from salt, UV, mildew; flexible top coat; above the waterline; brush-applied; coverage 75 to 150 sq ft; touch 2 h; recoat guideline about 8 h (a reviewer needed about 30 h); about $20 to $27 per quart at third-party retailers. No dry film, VOC or aquatic data found. |
| D | **Home Depot support** (Q&A page above): suitable for metal, wood, fiberglass; will not properly adhere to glass or plastic; protects against rust, corrosion, tarnish, chipping; a matching base can be topcoated within 1 h or after 48 h. **Third-party listings:** dry 240 min, recoat 1 h, about 12 sq ft per can, VOC listed as 0 and as 606 g/L, about $14. No immersion statement, no aquatic data. |
| E | **Maker data sheet** (SPC-26, via search): modified alkyd; prepares plastic for topcoating with any of the maker's finishes; bonds directly to plastic; hard-to-paint surfaces. **Third party:** bare rigid plastic only. Retailer: recoat 30 min; Proposition 65 warning. Primer only; no immersion statement; no single-can price. |
| F | The system E then D. |
| G | **Maker data sheet** ([Sea Hawk Smart Solution, 2018](https://defender.ca/assets/pdf/sea-hawk/smartsolution_tech_data.pdf)): metal-free, copper-free, biocide-containing ablative bottom paint for below the waterline; slick film in salt water; 3.78 mils dry per coat, 3 coats recommended; 63% volume solids; VOC 328 g/L; touch 2 h at 73 F, minimum recoat 6 h, launch 12 h; substrates: fiberglass, wood, aluminum (epoxy primer), steel (as a system), previously painted; plastics not mentioned. **Third-party listing:** 2.9% of a metal-free biocide ([Pettit bulletin](https://www.pettitpaint.com/media/4774/pettit-paint-econea-copper-free-biocide_technical-bulletin.pdf), a competitor's marketing). Quarts and pints from marine suppliers; no price found. |

## Independent scoring

Scored by a separate reviewer from the fact sheets and rubric above, with no knowledge of the current pick or the weights.
The full table, with the scorer's reasons condensed:

| Option | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 |
|---|---|---|---|---|---|---|---|---|---|
| A | 1 (related data sheet: not for immersion) | 3 (no biocide, no aquatic code seen; TiO2 listed) | 4 (high-build, 2 to 4 mils) | 3 (PVC, fiberglass listed; no plastics claim) | 4 (flexible; no abrasion statement) | 4 (touch 15 to 30 min, recoat 30 to 60 min; several coats; spray sheet not found) | 3 (2 to 4 mils, several coats) | 2 (no price) | 5 (Home Depot listing) |
| B | 1 (not below the waterline) | 2 (no evidence) | 2 (no evidence) | 2 (no plastic mentioned) | 3 (hard, durable) | 2 (no evidence) | 2 (no evidence) | 3 (case price only) | 5 (Home Depot listing) |
| C | 2 (above the waterline only) | 2 (no evidence) | 2 (no evidence) | 2 (no plastic mentioned) | 4 (flexible top coat) | 3 (brush, touch 2 h, recoat about 8 h) | 2 (no evidence) | 4 (about $20 to $27) | 5 (Home Depot listing) |
| D | 2 (no evidence) | 2 (no evidence) | 2 (no evidence) | 1 (will not adhere to plastic) | 3 (chip protection) | 4 (spray, recoat 1 h) | 2 (no evidence) | 5 (about $14; one can assumed) | 5 (Home Depot listing) |
| E | 2 (primer only) | 2 (no evidence) | 2 (no evidence) | 4 (bonds directly to plastic) | 2 (no evidence) | 4 (spray, recoat 30 min) | 2 (no evidence) | 2 (no price) | 5 (Home Depot listing) |
| F | 2 (lower of E, D) | 2 (worse of E, D) | 2 (no build stated) | 4 (E touches the plastic) | 2 (lower of E, D) | 3 (two products) | 2 (no evidence) | 2 (E price missing) | 5 (E and D, both Home Depot) |
| G | 4 (below the waterline) | 1 (contains a biocide) | 4 (3.78 mils per coat) | 3 (general substrates; plastics not mentioned) | 2 (no evidence) | 3 (3 coats, recoat 6 h) | 2 (about 11.3 mils over 3 coats) | 2 (no price) | 1 (specialty order from a marine supplier) |

**H (Do Nothing) was scored afterward by John's session, not blind**, from repo evidence: C1 1 (a low-quality PETG print leaked in RR-03; printed parts are porous along layer lines, decision log 2026-08-17), C2 2 (no evidence: filament safety data sheet not collected), C3 1 (no film), C4 5 (no coating to fail), C5 2 (no evidence), C6 5, C7 5, C8 5, C9 5 (nothing to buy).

The scorer's judgment calls to recheck: A on C4, C6 and C7; B on C5; C on C1 (the facts say "above the waterline," not a ban
below it); B on C8 (case price only); D on C8 (one can assumed). **C9 was scored 2026-11-03 from the retailer listings and not blind; store stock has not been checked.** Cost matters more now (11.1%), but the C8 cells for A, E, F and G still rest on "no price," so the total is only as good as those prices.

## Results

Totals out of 5 under five weightings, with H (Do Nothing) included (reproduce with `compute_totals.py`):

| Weighting | Ranking |
|---|---|
| Main: reef safety 2nd, cost 4th, sourcing 5th | G 2.72, A 2.64, D 2.61, C 2.58, E 2.42, H 2.42, F 2.40, B 2.09 |
| Reef safety ranked 1st | A 2.86, D 2.61, C 2.58, H 2.53, E 2.42, F 2.40, G 2.39, B 2.20 |
| Rank-sum weights, same order | A 2.96, H 2.84, D 2.80, C 2.78, E 2.60, F 2.56, G 2.56, B 2.33 |
| Earlier ranking (cost 8th, sourcing 9th) | G 2.88, A 2.66, E 2.38, F 2.32, C 2.32, H 2.29, D 2.21, B 1.83 |
| Equal weights | H 3.44, A 3.22, then C and D 2.89, E 2.78, F 2.67, B and G 2.44 |

Under equal weights Do Nothing ranks first because cost, sourcing and added mass count as much as waterproofing; that contradicts the coating's purpose, so equal weights are not a fair test here.
The top four under the main weights (G, A, D, C) lie within 0.14 of each other, so the order among them is weak evidence. D and C stay
in the running only on cost and sourcing: D is documented as not adhering to plastic (C4 = 1) and C is rated for above the waterline only (C1 = 2).

**Robustness to missing evidence:** letting every "no evidence" cell be anything from 1 to 4 (20,000 draws, main weights),
the first place goes to D 33%, E 25%, F 23%, C 10%, G 6%, A 1%, H 1%, B 0%. This spreads over the options with the most missing cells and does not
mean they are better: A wins rarely because it has one missing cell (cost) and a documented low immersion score; D, E and F have many missing cells and
random draws lift them. It confirms that the missing data sheets and prices matter more than the exact weights.

**Reading:** the matrix does not confirm the provisional LeakSeal pick on its own. G leads under the main weights, but A leads when
reef safety is ranked first and under rank-sum weights. Both leaders carry a documented problem: A is "not intended for water
immersion," G contains a biocide by design (and is a specialty order, C9 = 1). The 2-week coupon soak decides.

## Decision (John, 2026-11-02, individual assignment; criteria updated 2026-11-03)

**Selected: A, LeakSeal Black spray**, one thick coat over sanded PETG, the option already chosen provisionally. It ranks second
under the main weighting (2.64, behind G 2.72) and first when reef safety is ranked first and under rank-sum weights. G is excluded as
a feasibility judgment, not a score: it contains a biocide (conflicts with the reef-safe principle, ADR-0004) and is a specialty order
that cannot be on hand for the Nov 9 to 13 coating window. Do Nothing fails the purpose (leaks, porous layer lines). The decision
stays provisional until the 2-week sanded-coupon soak in SCO-246; fallback is E then D (plastic primer plus clear coat). The
assignment deliverable (Word file with the one-page matrix and the rationale paragraph) is built from this decision.
**Limit to state in the write-up:** if the filament safety data sheet shows no aquatic hazard, Do Nothing's C2 rises to 4 and its
total rises by 0.41 (to 2.83), above G (2.72) and A (2.64), so Do Nothing would lead the matrix even though it fails C1 and C3 (the
coating's purpose). With cost now weighted 11%, a pass/fail gate on waterproofing and seam sealing is the defensible way to read the matrix.

## Bias check (read this before reusing earlier versions)

An earlier version of this matrix, built before this rubric, scored A too generously: submersion 3 (instead of 1 or 2), seam
sealing 3 (assumed), adhesion 3 (unproven), flexibility 5 (maker claim only) and it added criteria (seam sealing, flexibility)
that favor rubber coatings. John asked for a version completely free of that bias. The earlier numbers were **discarded**; the
procedure here is: fix the rubric first, use documented facts only, give "no evidence" the same score everywhere, have an
independent reviewer score from anonymized fact sheets, and test the result against other weightings and missing-data
assumptions. LeakSeal winning again would have been acceptable; it did not win under the main weighting.

## Missing evidence

Open these in a browser (the sites block automated access) and save or paste them. Rescore the affected cells only.

- LeakSeal **spray** (15 oz, product 266784) technical data sheet and safety data sheet, to replace the brush-version sheet
  for A (immersion, substrates, film build, aquatic hazard).
- Rust-Oleum Specialty Plastic Primer technical data sheet SPC-26 and the safety data sheet (D, E, F: substrates, film, recoat, aquatic).
- Rust-Oleum Marine Spar Varnish technical data sheet MAR-01 (C: dry film, VOC, recoat).
- Rust-Oleum Stops Rust Protective Enamel clear technical data sheet SRT-35 and safety data sheet (D: recoat, coverage, VOC, aquatic).
- Rust-Oleum Marine topside paint technical data sheet and safety data sheet (B: dry film, VOC, aquatic).
- Store stock for A, B, C, D and E at the Home Depot nearest campus (C9 was scored from listings only), and single-can or single-quart prices at Home Depot for A, B, C, D, E (cost), and the Sea Hawk Smart Solution price and its safety data sheet (G).
- Whether G is the product John means by "another industrial buoy solution for bottom paint."

## Thesis use

For the thesis alternatives analysis, this file gives: the decision and scope, the alternatives, the criteria and the
weighting method with its rationale, the scoring rubric, the evidence, the scores, the sensitivity analysis, and a
documented bias check. The template John pasted had four criteria columns and three alternative rows; this matrix extends it
to nine criteria and eight alternatives. Trim to the criteria and alternatives the assignment asks for, keeping the
method and the evidence table.

## Related records

[SCO-246](https://linear.app/scout1/issue/SCO-246) (coating choice), [SCO-247](https://linear.app/scout1/issue/SCO-247)
(apply and cure), the 2026-10-31 decision-log row, [RR-19](../../../mechanical/test/rr-19-petg-water-absorption-soak-2026-10-21.md)
(PETG absorption soak), and the [source registry](../../hub/research/sources.md) entries for the data sheets used.
