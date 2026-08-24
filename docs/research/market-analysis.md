# Market Analysis

> **Summary** — Is there a real market for S.C.O.U.T. beyond the capstone, in scientific ocean
> observing or in defence/maritime domain awareness? **Both markets are real. S.C.O.U.T. as
> currently built is well-positioned for neither.** The scientific market is small, grant-funded,
> and already served at our exact price point from both directions — a commercial buoy sells for
> under $5,000 and an open-source equivalent for ~$110. The defence market is large and growing
> fast, but the comparable companies needed roughly $30 M to field 35 units, and the cheap-acoustic
> niche is a sole-source Navy programme shipping 200,000+ units a year. **The defensible asset is
> not the buoy — it is the bioacoustic analysis pipeline, which is software.**
>
> Researched 2026-08-24. Sources are in [`hub/research/sources.md § Market & commercial
> landscape`](../hub/research/sources.md#market--commercial-landscape). This is a market
> assessment, not a decision — see
> [Open Research Questions](../hub/research/open-questions.md).

---

## Method, and what was deliberately excluded

Every figure below comes from one of: US government appropriations and Congressional Research
Service summaries, SEC filings, GAO reports, disclosed funding rounds, published list prices, or
peer-reviewed work.

**Commissioned market-research reports were excluded on purpose.** Searches for this topic return
a large number of "Ocean Observation Instruments Market, 2025–2034, 8.1% CAGR" reports from firms
that publish the same template across hundreds of unrelated industries. Their numbers are
extrapolations sold as findings and none of them is verifiable. Nothing in this document rests on
one. Where a market-size figure is used at all (sonobuoys, aquaculture), it is flagged as a
sizing estimate rather than treated as fact, and the argument is built so it does not depend on
the precise value.

---

## 1. The scientific market: real, small, and almost entirely grant-funded

| What | Amount | Period | Source |
|---|---|---|---|
| **IOOS — the entire US Integrated Ocean Observing System** | **$56 M** | FY2026 enacted | [CRS IF13024](https://www.congress.gov/crs-product/IF13024) |
| NOAA Coral Reef Conservation Program — appropriations | ~$33 M/yr | FY2021–23 | [GAO-24-106692](https://www.gao.gov/products/gao-24-106692) |
| NOAA CRCP — grants actually awarded to outside partners | ~$9 M/yr | recent | [NOAA CRCP](https://coralreef.noaa.gov/conservation/funded_projects.html) |
| Teledyne Marine segment revenue (category leader) | >$1.1 B | FY2025 | [Teledyne 10-K](https://www.sec.gov/Archives/edgar/data/1094285/000109428526000017/tdy-20251228.htm) |

The first row is the one that matters. Every buoy, glider, HF radar array, and regional
association in the United States operates on **$56 million a year in total**. That is not a market
in the venture sense; it is a single federal line item. It is also politically fragile: the FY2026
budget request proposed eliminating IOOS outright, and the FY2025 request proposed a 76% cut, the
lowest since the programme began in 2008. Congress restored and increased it both times
([AGU](https://thebridge.agu.org/2025/08/08/appropriations-update-nasa-noaa-and-nsf/),
[Ocean Conservancy](https://oceanconservancy.org/blog/2025/07/09/fy26-federal-budget-threatens-ocean/)),
and a five-year reauthorisation passed the House in March 2026 — but a company whose addressable
market survives at the pleasure of an appropriations markup is carrying political risk it cannot
price or hedge.

Teledyne's $1.1 B looks like a large market until it is decomposed. That segment is sonar,
subsea imaging, ADCPs, and defence subsystems — not $5,000 environmental buoys.

### The best available benchmark for "affordable ocean buoy company"

**Sofar Ocean** is the closest thing to a proof of concept for this business, and the numbers are
sobering:

| Metric | Value |
|---|---|
| Founded | 2016 (as Spoondrift) |
| Total raised | **$75.2 M** across 6 rounds, latest a Series B extension Dec 2024 |
| Spotter buoys deployed | **1,000+** |
| Estimated revenue | ~$18 M (2025), 123 staff |

The revenue figure is a **third-party estimate and should be treated as directional only** — the
same source also states Sofar has raised $0 and is bootstrapped, which is demonstrably false. But
even as an order of magnitude: a decade and $75 M of venture capital, as the acknowledged category
leader, to reach roughly $18 M of revenue.

That is the realistic ceiling of the scientific ocean-buoy business, not a floor to build from.

---

## 2. The $5,000 target price is already occupied — from both directions

This is the finding that most directly challenges the project's own framing.
[`facts.md`](../hub/facts.md) records **total system cost < $5,000** as the practical ceiling
named by the researchers in our
[stakeholder interviews](stakeholder-interviews.md). That figure is accurate as a report of what
they said. It is not a defensible market position.

| Option available to our stated customer today | Unit cost | What they get |
|---|---|---|
| [OLB open-source LoRa buoy](https://arxiv.org/html/2601.05615v1) (Univ. of Oslo, Norwegian Met Institute, NTNU — Jan 2026) | **$100–115** in bulk (5–50 units); base station ~$213 | GPS, thermometer(s), SD logging, I²C/SPI/serial/analog expansion, LoRa 1.2–5.3 km over water. Open source, free to copy |
| **S.C.O.U.T.** | target < $5,000 | Temperature, turbidity, hydrophone, 82-byte daily packet, own analysis pipeline |
| [Sofar Spotter (2nd gen)](https://maritime-executive.com/article/small-cheap-metocean-buoys-expand-coverage-of-high-res-wave-data) | **under $5,000**, volume discounts | Shipping product, 1,000+ deployed, dashboard + API, Smart Mooring modules for temperature, currents, water quality, and an [AI-enabled hydrophone](https://www.sofarocean.com/sem/underwater-sound-acoustics) |
| [Aqualink](https://www.sofarocean.com/posts/how-aqualink-uses-smart-mooring-to-monitor-ocean-climate-change) | **free** | Philanthropically funded; **donates** Sofar Smart Mooring buoys to volunteers, tour operators, researchers, and citizen scientists specifically for coral reef heat-stress monitoring |

Three things follow, and none of them is comfortable:

1. **Our target price is a competitor's list price.** Sofar reaches under $5,000 with ten years of
   manufacturing scale behind it. A capstone BOM plus low-volume printed parts does not beat that
   on cost, and would not beat it at 100× our volume either.
2. **The architecture is already published for free.** OLB is a solar-independent drifter rather
   than a moored platform, so it is not a like-for-like substitute — but it is LoRa, sub-GHz,
   microcontroller-plus-SD, sensor-extensible, and $110. Anyone evaluating "cheap DIY buoy" will
   find it, and it was published by three national research institutions three months before our
   Phase 1.
3. **In our exact application, the alternative is free.** Aqualink gives away a better-supported
   buoy to precisely the users we identified as the customer.

There is no gap between $115 and $5,000 for us to occupy.

---

## 3. We optimised the cost that is not binding

The stakeholder interviews produced a capital-cost ceiling, and the project optimised against it.
The published operations literature says capital cost is not where the money goes.

- The **Alliance for Coastal Technologies estimates up to 50% of operational budgets are
  attributable to biofouling**, depending on site and season
  ([review of antifouling strategies for water-monitoring sensors](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7827029/)).
- Research vessel time runs **$20,000–50,000 per day**; even shallow-water diver operations cost
  thousands per day with hard safety limits.
- Heavy fouling measurably degrades nearshore buoy performance and forces shortened deployment
  intervals ([Sciencedirect, nearshore heave-pitch-roll buoy](https://www.sciencedirect.com/science/article/abs/pii/S0141118720310592)).

Work the arithmetic. A programme spending $10,000 on an instrument and $8,000 a year servicing it
saves less than one service trip by halving the instrument price. **Cutting capex is close to
irrelevant to that programme's budget.** The researchers who named $5,000 were describing their
grant's equipment line, not their cost of ownership.

The inversion is the useful part: **a buoy that genuinely survived 18 months unattended would be
worth more than $5,000, not less.** The team has already done the
[antifouling coatings research](biofouling-antifouling-coatings.md) and built a
[drift screen](../analysis/telemetry-methodology.md) for fouling-induced sensor drift — that work
is aimed at the right problem. It has simply never been connected to the commercial thesis, which
is still a cost-reduction story.

---

## 4. The defence market: large, growing fast, and a different company

Here the money is unambiguous.

| Signal | Figure |
|---|---|
| Blue-economy startup funding | $5.6 B (2025); $8.2 B in the first 7 months of 2026 |
| Share to drones and surface/subsea robots | ~70% |
| What raises money now | Maritime superiority, undersea domain awareness, distributed sensing |

Source: [Dealroom Blue Economy deep dive](https://dealroom.co/guides/blue-economy).

### Direct comparables for "distributed passive-acoustic buoys"

| Company | Raised | Traction |
|---|---|---|
| [Andrenam](https://andrenam.com/news/andrenam-announces-18-million-series-a-to-expand-persistent-undersea-awareness) | $30 M total ($18 M Series A, 2026) | PEARL passive-sonar buoys + OBSIDIAN AI classifier; **35 buoys built**, 4,500 in-water hours, two Navy contracts |
| [Triton Depth](https://defence-industry.eu/triton-depth-raises-e1-million-pre-seed-round-to-develop-passive-acoustic-sensor-network-for-europes-underwater-security-and-maritime-intelligence/) | €1 M pre-seed (2026) | Seabed passive-acoustic network; pitched on Baltic subsea-cable sabotage |
| [Saildrone](https://sacra.com/c/saildrone/) | $345 M total | $37 M revenue (2025); $16.3 M Navy counter-narcotics task order; [$50 M strategic investment from Lockheed Martin](https://news.lockheedmartin.com/2025-10-29-Lockheed-Martin-Invests-50M-in-Saildrone-to-Advance-Unmanned-Surface-Vehicle-Capabilities-for-US-Navy) |

**Andrenam is the number to internalise: $30 million to field thirty-five buoys.** That is the
capital curve for defence-grade underwater acoustics, and it is roughly 400× the capstone budget.

### The cheap-disposable-acoustic-sensor niche is already sole-sourced

The sonobuoy market is estimated at roughly $510–550 M/yr (a sizing estimate — treat it as an
order of magnitude). The relevant fact is not the size but the structure: the US Navy procures on the order
of **200,000–500,000 units annually** through **ERAPSCO**, a joint venture of Ultra Electronics
and Sparton holding an exclusive production contract
([Naval Technology](https://www.naval-technology.com/news/erapsco-wins-contract-to-produce-sonobuoys-for-us-navy/)).
Entering here means displacing a sole-source incumbent at six-figure annual unit volumes.

### The entry path exists, and is still not viable for us

A June 2026 Secretary of Defense memorandum made **DIU the designated commercial entry point for
all unmanned and autonomous systems** — including sensors and components that go into them
([Spencer Fane](https://www.spencerfane.com/insight/defense-innovation-unit-the-pentagons-front-door-for-unmanned-systems-technology-companies/)).
Commercial Solutions Openings and Other Transaction Authority sit outside the FAR, and
[SWAP-USV](https://www.diu.mil/work-with-us/submit-solution/PROJ00687) has $200 M budgeted for
prototype and follow-on production agreements.

Against that: hydrophones fall under ITAR or EAR depending on specification, the work requires
cleared personnel, DIU's current direction narrows to technologies fieldable within three years,
and the capital requirement is the Andrenam number. **This is a second company with different
founders, not a continuation of this one.**

---

## 5. What is actually differentiated

An honest inventory.

| Asset | Defensible? | Why |
|---|---|---|
| Buoy electronics (Feather M0 + RFM95 + DS18B20 + SEN0189) | **No** | Well-trodden hobbyist stack; [ADR-0001](../decisions/0001-mcu-and-radio-selection.md) chose it for availability, correctly, and availability is the opposite of scarcity |
| Printed PETG wedge hull | **No** | Good engineering, reproducible by anyone with a printer and the drawings |
| 82-byte daily packet + duty-cycled scheduler | **No** | Disciplined, but standard practice for LPWAN telemetry |
| **Reef bioacoustic pipeline** | **Plausibly yes** | See below |

The [bioacoustic methodology](../analysis/coral-bioacoustic-methodology.md) contains real domain
knowledge that is not obvious and not freely available:

- The **three-zone frequency model** that carves out a 200–1000 Hz mixed band and excludes it from
  NDSI, because the conventional two-way biophony/anthrophony split misclassifies reef-fish
  choruses as anthropogenic noise.
- The **abiotic contamination filter** and median aggregation that keep indices robust against
  wind- and rain-affected recordings at shallow depth.
- **Session-scoped PCA** for health scoring with a separate global PCA for longitudinal trends —
  an explicit, defensible answer to a real comparability trap.
- Validation against a published reef dataset (Sesoko Island, Okinawa; eight monthly sessions).

This is **software**. It requires no factory, no bill of materials, no inventory, and no
manufacturing capital. It is also the part of the project a competitor cannot copy from a photo.

---

## 6. Conclusion and recommended path

**Ranked, with the reasoning stated.**

### (a) Recommended — build the analysis layer, not the buoy

Sell or license reef-health analytics that run on **other people's hardware**. Sofar already ships
a hydrophone module, and **Bristlemouth is an open hardware standard explicitly designed so third
parties can plug in**. Being the reef-bioacoustics intelligence layer on a fleet of 1,000+ already
deployed units inverts the strongest competitor into a distribution channel, requires no
manufacturing capital, and is the only option here that plays to what the team actually built that
is scarce.

### (b) If hardware, sell to a buyer whose revenue depends on the data

Grant-funded science buys once, slowly, at the bottom of the market. Commercial operators buy
repeatedly because the data protects revenue:

- **Aquaculture water-quality monitoring** — roughly $481 M (2024) within a larger aquaculture
  monitoring and automation market; a reported 68% of commercial facilities already prioritise
  continuous monitoring ([GMInsights](https://www.gminsights.com/industry-analysis/aquaculture-monitoring-and-automation-systems-market) — sizing estimate, directional only). The relevant point is
  structural, not numerical: a fish kill costs more than a sensor, so the buyer has a real budget
  and a real urgency that a grant-funded MPA manager does not.
- **Parametric reef insurance** is a genuine emerging buyer of trigger-quality reef data —
  [Swiss Re / TNC in Quintana Roo](https://www.swissre.com/our-business/public-sector-solutions/case-studies/mexico-windstorm-cover.html),
  [MAR Fund's first payout in Belize](https://icriforum.org/first-reef-insurance-payout-belize/), and
  sea-surface-temperature-triggered products in development with Indonesia and UNDP. But total
  payouts to date are $175,000–$850,000 per event. **This is a design partner, not a market.**

### (c) Not recommended — defence

Not with this team, not from this capstone, not on this timeline. Revisit in five years with
cleared staff, ITAR counsel, and $10 M+ of patient capital.

---

## 7. Three cheap tests that would settle this before graduation

These are deliberately small, and each one is falsifiable.

1. **Ask the researchers we already interviewed one further question:** *what fraction of your
   monitoring budget is instrument purchase, versus boat time and servicing?* If capex is under
   ~30%, the $5,000 thesis is dead as a commercial position, and it is far better to learn that
   now than after incorporating. This is one email to contacts we already have
   ([stakeholder interviews](stakeholder-interviews.md)).
2. **Build a 3-year total-cost-of-ownership comparison, not a unit-price one:** our BOM versus a
   Sofar Spotter with a Smart Mooring temperature string versus an SBE 56 array, with servicing
   intervals and biofouling maintenance included. Whatever the result, that document is a
   contribution in its own right and belongs in `docs/research/`.
3. **Apply for SBIR on the pipeline, not the platform.** NSF SBIR Phase I is up to $305 K (Project
   Pitch is open); NOAA SBIR Phase I is up to $190 K over six months and lists uncrewed systems
   and AI as priority areas. Both are non-dilutive.
   [VentureWell's Ocean Enterprise Accelerator](https://venturewell.org/spring-2026-stage-2-ocean-enterprise-accelerator-cohort/)
   exists for exactly this stage.

---

## What this does not change

**None of this is an argument against the capstone.** The engineering is sound, the methodology is
defensible, and the deliverable is a working end-to-end system. This document answers a different
question — *could this become a company as currently scoped* — and the answer is no without a
change of product. The change of product it points to (analysis layer, not platform) uses more of
the team's actual work, not less.

The `< $5,000` figure in [`facts.md`](../hub/facts.md) stays as recorded. It is a faithful record
of what the researchers said, and it remains the right **engineering** target for the capstone. It
is only its use as a *commercial* differentiator that this analysis rejects.
