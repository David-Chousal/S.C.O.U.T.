# Mooring and Structural Load-Case FEA, LC2–LC9 plus Service, 2026-08-29

## One-page summary

|  |  |
|---|---|
| **Test ID / status** | RR-04 · Pass |
| **Date, duration, who** | 2026-08-29, one study per case, John Ryan Myrdal |
| **Requirement tested** | Hull survives mooring, wave, current and snap loads (benchmark provisional, SF ≥ 4) |
| **Tracking issue** | [SCO-73](https://linear.app/scout1/issue/SCO-73) |
| **Record kind** | Retroactive (source: [fea-mooring-load-cases.md](fea-mooring-load-cases.md) and the per-case HTML reports) |

**Question.** Does the buoy structure survive the derived mooring, wave, current, hydrostatic and snap load cases? Retires the risk that the hull fails under those loads.

**What we measured and the pass mark.**

| Parameter (unit) | Instrument | Pass if | Measured | Verdict |
|---|---|---|---|---|
| Safety factor (min, buoy) | Autodesk Fusion static stress | SF ≥ 4 | 10–1450 per the register; 30–1450 per the tracker summary | Pass (see inconsistency) |
| LC6/LC9 local SF | Fusion | SF ≥ 4 | 1.5–1.7 at the stand-in ring contact | Read as artifact |

**How.** Fusion static stress, custom PETG profile, a McMaster `3076T33` ring as the pad-eye stand-in, at the proposed environmental design set, nine load cases (LC2–LC9 plus a service case).

**Result.** The buoy structure passes every case. LC6/LC9 low SF (1.5–1.7) are contact-edge artifacts on the stand-in ring's bonded interface, confirmed by John. The final 316 pad-eye still needs its own re-run.

**Does not establish.**

- The final 316 pad-eye and its real mounted interface.
- A signed-off environmental design set (the loads were 'proposed' when run).
- A physical load test.

**Decision.** Good enough for now. Next: pad-eye re-run before deployment ([SCO-69](https://linear.app/scout1/issue/SCO-69), [SCO-73](https://linear.app/scout1/issue/SCO-73)).

---

## Part A — Plan

_Retroactive record: this plan was reconstructed from the sources named above, not locked before the run. Fields marked `Not recorded` were never written down._

### A1. Purpose and risk retired
Check the hull against the load cases derived from first principles, replacing the 300 N placeholder of RR-01.

### A2. Hypothesis
If the hull is loaded with the derived LC2–LC9 cases, then the buoy PETG keeps SF ≥ 4 everywhere, because the wedge, chassis and boss geometry carries the loads with margin.

### A3. Parameters measured

| Parameter | Unit | Instrument / method | Resolution | Uncertainty | Calibrated / checked (date) |
|---|---|---|---|---|---|
| Safety factor | dimensionless | Fusion static stress | Mesh-limited | Not recorded | Not recorded |
| Displacement | mm | Fusion | Mesh-limited | Not recorded | Not recorded |

### A4. Variables

| Kind | Variable | Value or range |
|---|---|---|
| Varied (independent) | Load case (LC2–LC9, service) | See tracker table |
| Held fixed (controlled) | Geometry, custom PETG profile, constraint set, stand-in ring | See source |
| Measured (dependent) | SF, stress, displacement per case | See C1 |

### A5. Success metric (locked)

| # | Metric | Pass if | Why this number | Source |
|---|---|---|---|---|
| M1 | Minimum SF in the buoy PETG per case | SF ≥ 4 | Study-only placeholder | Provisional, pending [SCO-139](https://linear.app/scout1/issue/SCO-139) |

Locked on: Not recorded (retroactive record)

### A6. Article, setup and sampling

| Item | Value |
|---|---|
| Tool | Autodesk Fusion, static stress |
| Material | Custom PETG profile (yield 35 MPa) |
| Loads | Proposed set: LC2 uplift 322 N, LC5 wave+current ~440 N, LC8 hydrostatic 50.3 kPa, LC9 snap ~810 N |
| Pad-eye | McMaster 3076T33 steel tie-down ring as a stand-in |
| Sample size | One study per case |
| Safety | None (computation) |

### A7. Procedure

| Step | Action | Record | Done |
|---|---|---|---|
| 1 | Define each load case per the structural load framework. | Load vectors | Not recorded |
| 2 | Apply constraints and the stand-in ring. | Settings | Not recorded |
| 3 | Solve each case. | Min SF, displacement | Not recorded |
| 4 | Examine local low-SF spots. | Cause | Not recorded |

### A8. Analysis plan
Report minimum SF per case on the buoy PETG, separating the stand-in ring's contact artifacts.

### A9. Curve required

None, analysis. No physical load test exists to validate the model against.

## Part B — Execution log

### B1. Run record

| Item | Value |
|---|---|
| Run date | 2026-08-29 |
| Operator | John Ryan Myrdal |
| Software | Autodesk Fusion |
| Reports | Per-case HTML files in `mechanical/test/` |

### B2. Raw data

Per-case results are in the tracker table of [fea-mooring-load-cases.md](fea-mooring-load-cases.md); LC2 is summarised in [fea-mooring-lc2-vertical-uplift-2026-08-29.md](fea-mooring-lc2-vertical-uplift-2026-08-29.md).

### B3. Deviations

LC6/LC9 gave SF 1.5–1.7 at the stand-in ring; examined and judged mesh/contact artifacts.

## Part C — Results and decision

### C1. Result against the metric

| Metric (from A5) | Measured | Margin | Verdict |
|---|---|---|---|
| M1 SF ≥ 4 on the buoy PETG | 10–1450 (register); 30–1450 (tracker summary) | At least 2.5× over the bar | Pass |

**Overall:** Pass on the buoy structure. **Inconsistency to resolve:** the register says min SF 10–1450 and the tracker summary says 30–1450.

### C2. Curve and analysis
The stand-in ring's contact edges, not the buoy, limit LC6 and LC9. Final 316 pad-eye re-run owed.

### C3. Validity and limits

- Sources of error: stand-in ring, proposed (unsigned) loads, no mesh convergence.
- Does establish: the buoy PETG is not the limiter in any case.
- Does not establish: the final pad-eye or a physical load margin.
- Not recorded: mesh convergence.

### C4. Decision

| Question | Answer |
|---|---|
| Good enough to stop redesigning? | Yes for the hull; no for the pad-eye |
| Design change driven by this test | None |
| Re-run needed? | Pad-eye and LC7 moment before deployment |
| Next test | RR-09 (v5), pad-eye re-run |
| Issues filed | [SCO-69](https://linear.app/scout1/issue/SCO-69), [SCO-73](https://linear.app/scout1/issue/SCO-73) |

### C5. Evidence and traceability

- Tracker and results: [fea-mooring-load-cases.md](fea-mooring-load-cases.md)
- LC2: [fea-mooring-lc2-vertical-uplift-2026-08-29.md](fea-mooring-lc2-vertical-uplift-2026-08-29.md)
- HTML reports: `fea-mooring-lc*-2026-08-29.html`

Format: [Test Record Template](../../docs/engineering/test-record-template.md). Index: [risk-reduction register](risk-reduction-register.md).
