# Senior Design Thesis Outline

> **Summary** — The **current running outline** of the S.C.O.U.T. senior design thesis: every
> chapter and subsection heading, the required formatting, and where the working Word file lives.
> This page is the source of truth for the thesis *structure*. Update it in the same PR whenever
> a heading is added, renamed, or removed.
>
> **Status: CURRENT — v3, 2026-10-01.** Built for the ENGR 194 "Thesis Outline" assignment
> against the [SCU Engineering Thesis Guide](#sources) (11/18/2025 edition).
>
> **Source document** — `SCOUT-Thesis-Outline-Final.docx` (kept outside the repo; `.docx` is
> never committed, per [CONVENTIONS.md](../CONVENTIONS.md)).

---

## Where the working file is

The Word file is `SCOUT-Thesis-Outline-Final.docx`. It is not in the repo, because Word files
are binary and can't be diffed. ⚠️ **It currently exists only on John's machine.** Move it to a
shared team location and record the link here.

Before submitting any version: open it in Word, press **Cmd+A**, then **F9**, so every Table of
Contents, List of Figures, List of Tables, caption, and page number is recalculated, then save.

ECEN and CSEN teammates may be required to write in Overleaf (LaTeX). If so, mirror this outline
as `\chapter`/`\section` headings with `\tableofcontents`, `\listoffigures`, and
`\listoftables`, and keep this page as the single structure both files follow.

## Formatting requirements

| Item | Requirement |
|---|---|
| Page | 8.5 × 11 in, 1 in margins on all sides |
| Font | Times New Roman 12 pt |
| Line spacing | 1.5 |
| Headings | Native Heading 1 / 2 / 3 styles (16 / 14 / 12 pt bold), so the Table of Contents builds automatically |
| Captions | Numbered with caption fields. **Figure captions go below the figure, table captions above the table** |
| Equations | Typeset, variables defined, numbered consecutively |
| Page numbers | Bottom center. Signature and title pages are unnumbered; front matter uses lowercase roman numerals starting at iii; Chapter 1 starts at page 1 |
| Length | 50–80 pages including figures |
| References | IEEE, through a reference manager (Zotero, Mendeley, or EndNote); no footnote references |

## Outline

**Front matter:** Signature Page · Title Page · Abstract (≤ 250 words) · Acknowledgments ·
Table of Contents · List of Figures · List of Tables · List of Abbreviations and Symbols

- **1 Introduction**
  - 1.1 Problem and Motivation
  - 1.2 Technical and Societal Significance
  - 1.3 Project Objectives
  - 1.4 Scope: MVP, Target, and Stretch Goals
  - 1.5 Thesis Organization
- **2 Background and Literature Review**
  - 2.1 Coral Reef Health and Nearshore Monitoring
  - 2.2 Governing Scientific and Engineering Principles
  - 2.3 Existing Platforms, Patents, and Competitor Analysis · *Table: Comparison of existing nearshore monitoring platforms*
  - 2.4 Coral Reef Bioacoustics
  - 2.5 Low-Power Wireless Telemetry
  - 2.6 Additive Manufacturing for Marine Structures
  - 2.7 Gaps Addressed and Contributions of This Project
- **3 Requirements and Specifications**
  - 3.1 Stakeholders and Needs
  - 3.2 System Requirements and Specifications · *Table: Requirements, specifications, and verification methods*
  - 3.3 Design Environment and Load Definition
  - 3.4 Constraints
    - 3.4.1 Technical and Economic Constraints
    - 3.4.2 Environmental and Regulatory Constraints
    - 3.4.3 Ethical and Social Constraints
- **4 Concept Development and Design Approach**
  - 4.1 Concept Generation
  - 4.2 Trade Studies and Selected Concept · *Table: Decision matrix for the flotation concept*
    - 4.2.1 Microcontroller and Radio
    - 4.2.2 Power System
    - 4.2.3 Flotation and Hull
    - 4.2.4 Sensing Payload
  - 4.3 Concept of Operations · *Figure: Concept of operations*
  - 4.4 System-Level Architecture · *Figure: System-level block diagram*
  - 4.5 Risk Assessment · *Table: Risk register and mitigations*
- **5 Detailed Design and Implementation**
  - 5.1 Mechanical Design · *Equation: F_b = ρ g V* · *Figure: Full buoy assembly (CAD)*
    - 5.1.1 Flotation and Hull Structure
    - 5.1.2 Chassis, Load Path, and Mooring
    - 5.1.3 Electronics Housing, Sensor Pod, and Sealing
    - 5.1.4 Stability and Self-Righting Ballast
  - 5.2 Electrical and Power Design · *Figure: Electrical schematic* · *Table: Daily energy budget by subsystem*
    - 5.2.1 Schematic and Sensor Interfaces
    - 5.2.2 Power Chain and Energy Budget
  - 5.3 Firmware · *Figure: Firmware state diagram*
    - 5.3.1 State Machine, Drivers, and Scheduling
    - 5.3.2 Low-Power Sleep and Fault Recovery
  - 5.4 Communications and Shore Station
    - 5.4.1 LoRa Link Budget and Regulatory Compliance
    - 5.4.2 Packet and Protocol Design
    - 5.4.3 Shore Station and Data Backend
  - 5.5 Data Analytics and Dashboard
  - 5.6 Subsystem and Interdisciplinary Integration · *Figure: Subsystem interface diagram*
- **6 Methods and Testing**
  - 6.1 Verification and Validation Strategy · *Figure: Test progression from bench to field*
  - 6.2 Analysis and Simulation Methods
  - 6.3 Standards Applied
  - 6.4 Bench and Subsystem Testing
    - 6.4.1 Sensor and Power Validation
    - 6.4.2 RF Range Testing
  - 6.5 Waterproofing and Risk-Reduction Testing
  - 6.6 Integrated Tank, Pool, and Soak Testing
  - 6.7 Field Deployment Procedure
- **7 Results**
  - 7.1 Mechanical and Structural Results · *Figure: Structural and stability results*
  - 7.2 Electrical and Power Results
  - 7.3 Communications and Data Results
  - 7.4 Summary of Findings and Requirements Verification · *Table: Requirements verification summary*
- **8 Discussion**
  - 8.1 Results Against Requirements
  - 8.2 Performance Compared with Existing Platforms
  - 8.3 Trade-offs and Limitations
  - 8.4 Lessons Learned
  - 8.5 Teamwork and Professionalism
  - 8.6 Ethical, Legal, and Societal Implications
- **9 Professional Issues and Societal Impact**
  - 9.1 Ethics
  - 9.2 Safety
  - 9.3 Sustainability and Life-Cycle Impact
  - 9.4 Equity, Accessibility, and Usability
  - 9.5 Economic Impact and Manufacturability
  - 9.6 Legal and Regulatory Compliance
  - 9.7 Broader Societal and Global Impact
  - 9.8 Alignment with SCU Jesuit Values
- **10 Project Management**
  - 10.1 Timeline and Milestones · *Figure: Project timeline*
  - 10.2 Budget
  - 10.3 Team Roles and Contributions
- **11 Conclusions and Future Work**
  - 11.1 Summary of Contributions
  - 11.2 Requirements Met
  - 11.3 Lessons Learned and Skills Gained
  - 11.4 Future Work and Recommendations
  - 11.5 Personal and Professional Growth
- **References** (IEEE)
- **Appendices**
  - Appendix A: Bill of Materials and Budget
  - Appendix B: Engineering Drawings
  - Appendix C: Calculations (Mass, Freeboard, Stability, Loads)
  - Appendix D: Test Procedures, Logs, and Raw Data
  - Appendix E: Source Code and Repository
  - Appendix F: Hazard Assessment Form
  - Appendix G: Stakeholder Interview Records
  - Appendix H: User and Deployment Manual

**Placeholders in the skeleton:** 9 figures, 6 tables, and 1 equation (listed inline above).
Every heading carries Lorem Ipsum placeholder text.

## Coverage against the guide

Every recommended section in the guide's annotated outline (Appendix 5) maps to a heading above.
Three additions go beyond the guide, each because reviewers or past SCU theses expected it:

- **4.5 Risk Assessment.** A risk register with mitigations.
- **Chapter 10, Project Management.** Timeline, budget, and team roles. This is evidence for the
  ABET teamwork outcome, and past SCU marine theses include it.
- **List of Abbreviations and Symbols**, in the front matter.

## Version history

| Version | Date | Change |
|---|---|---|
| v1 | 2026-10-01 | First skeleton from the guide's annotated outline, tailored to S.C.O.U.T. |
| v2 | 2026-10-01 | Five simulated reviewers averaged 9.2/10 against the assignment rubric. Fixes applied: pre-filled TOC and figure/table lists, correct caption numbering, department lines filled in, guide notes removed, risk / project-management / methods / load-definition / ECEN sections added, over-split subsections merged |
| v3 | 2026-10-01 | Added every remaining recommended section: governing principles, patents, interdisciplinary integration, summary of findings, teamwork, ethical/legal/societal implications, equity and accessibility, global impact, lessons learned and skills gained, raw data, and user manual |

## Benchmark theses

Three past SCU senior design theses (2022–2026) were used as structure benchmarks: [`scu-iris-2026`](../hub/research/sources.md#senior-design-thesis-references),
[`scu-mantaray-2026`](../hub/research/sources.md#senior-design-thesis-references), and
[`scu-marine-robot-2022`](../hub/research/sources.md#senior-design-thesis-references). Their main
text runs about 73–80 pages. The strongest of them (IRIS) reports every requirement as
validated, untested, or incomplete.

## Sources

- SCU School of Engineering, *A Guide to Writing a Senior Design Thesis in Engineering*, 2025–2026 edition — [`scu-thesis-guide-2025`](../hub/research/sources.md#senior-design-thesis-references)
