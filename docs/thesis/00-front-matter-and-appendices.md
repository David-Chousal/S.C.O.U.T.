# Front Matter, References and Appendices

> **Summary** — Working draft of the thesis front matter, references and appendix index. Appendices are a file folder with their
> own table of contents; the story and impact belong in the chapters.

---

## Abstract (250 words or fewer)

_Draft here._

## Acknowledgments

_Draft here._

## List of Abbreviations and Symbols

_Draft here._

## References (IEEE)

_Add references as numbered entries._

## Appendices

The appendices are a file folder with their own table of contents. The chapters carry the story (concept, context,
iteration, result, impact); the appendices carry the evidence. Status key: **Drafted** (first draft in the repo),
**Source exists** (the material is in the repo but not yet assembled), **Not started**.

### Appendix table of contents

| App. | Title | Contents | Status | Source |
|---|---|---|---|---|
| A | Bill of Materials and Budget | Parts, suppliers, costs, budget against plan | Source exists | [`hardware/`](../../hardware/), budget in [`docs/planning/`](../planning/) |
| B | Engineering Drawings | Dimensioned drawings of float, electronics housing, sensor housing and full assembly (see the figure list below) | Source exists | [`mechanical/cad/`](../../mechanical/cad/) |
| C | Calculations, Models and Simulations | C.1 design environment and loads; C.2 finite-element runs; C.3 strength, buckling, impact; C.4 buoyancy, mass, freeboard; C.5 stability; C.6 seals and packing; C.7 software tools; C.8 what each analysis changed; C.9 worked examples | Drafted | [`appendix-c-calculations.md`](appendix-c-calculations.md) |
| D | Test Procedures, Logs and Raw Data | D.1 strategy; D.2 standard procedures; D.3 test log RR-01 to RR-18; D.4 detailed records; D.5 raw data; D.6 stages still to run; D.7 lessons | Drafted (log stops at RR-18; RR-19 to RR-30 still to add; RR-30 is the sensor-pod fit test supporting R-12) | [`appendix-d-test-procedures-and-logs.md`](appendix-d-test-procedures-and-logs.md), [register](../../mechanical/test/risk-reduction-register.md) |
| E | Source Code and Repository | Firmware, shore station, console, analytics pipeline | Source exists | [`firmware/`](../../firmware/), [`analytics/`](../../analytics/), [`console/`](../../console/) |
| F | Hazard Assessment Form | Safety and hazard analysis | Not started | |
| G | Stakeholder Interview Records | Advisor, host and agency correspondence, including the permitting replies | Not started | [Hawaii permitting](../research/hawaii-deployment-permitting.md), [Monterey permitting](../research/monterey-bay-sanctuary-permitting.md) |
| H | User and Deployment Manual | Assembly, deployment and retrieval procedure | Not started | [Integration runbook](../engineering/integration-runbook.md) |

### Representative CAD and diagrams

Not every iteration is shown. These were chosen because each one is the clearest picture of a design decision explained in
the chapters. The full set stays in [`mechanical/cad/`](../../mechanical/cad/) and `assets/diagrams/`.

| Figure | File | Used in | Why this one |
|---|---|---|---|
| Assembled buoy with cable routing (wedge design) | [`buoy-assembly-cable-routing-2026-09-21.png`](../../assets/diagrams/buoy-assembly-cable-routing-2026-09-21.png) | 5.1 | The one image of the whole assembled buoy the load and buckling analyses were run on |
| Current float geometry, Test Assembly 10 | [`test-assembly-10.md`](../../mechanical/cad/floatation/test-assembly-10.md) | 5.1.1 | The current float, with its dimensions |
| Float drawings A and B | [`float-a-dfm-assembly-3-drawing-2026-10-28.pdf`](../../mechanical/cad/floatation/float-a-dfm-assembly-3-drawing-2026-10-28.pdf), [`float-b-dfm-assembly-4-drawing-2026-10-28.pdf`](../../mechanical/cad/floatation/float-b-dfm-assembly-4-drawing-2026-10-28.pdf) | Appendix B | The two printed-float candidates drawn side by side |
| Electronics housing flange on chassis | [`electronics-housing-flange-on-chassis-2026-10-06.jpg`](../../mechanical/cad/electronics-housing/electronics-housing-flange-on-chassis-2026-10-06.jpg) | 5.1.3 | Shows the flange and groove geometry the seal tests refer to |
| Electronics housing and cap drawings | [`electronics-housing-dfm-assembly-3-drawing-2026-10-28.pdf`](../../mechanical/cad/electronics-housing/electronics-housing-dfm-assembly-3-drawing-2026-10-28.pdf), [`electronics-housing-cap-dfm-assembly-3-drawing-2026-10-28.pdf`](../../mechanical/cad/electronics-housing/electronics-housing-cap-dfm-assembly-3-drawing-2026-10-28.pdf) | Appendix B | Dimensioned drawings of the sealed housing |
| Electronics housing packing diagram | [`electronics-housing-packing-diagram.svg`](../../assets/diagrams/electronics-housing-packing-diagram.svg) | 5.1.3 | Why the housing is 4.4 in by 5 in |
| Righting-arm (GZ) curve, printed float | [`gz-curve.png`](../../mechanical/simulations/buoy-stability/printed-float-tip-explorer/gz-curve.png) | 5.1.4 | The stability result behind the printed-float decision |
| System block diagram | [`system-block-diagram-2026-10-14.svg`](../../assets/diagrams/system-block-diagram-2026-10-14.svg) | 4.4 | One picture of the whole system |
| Interactive models | [`buoy-viewer.html`](../../mechanical/simulations/buoy-viewer/buoy-viewer.html), [`printed-float-tip-explorer.html`](../../mechanical/simulations/buoy-stability/printed-float-tip-explorer/printed-float-tip-explorer.html) | Appendix B, C | For the defense and the digital copy, not the printed thesis |
