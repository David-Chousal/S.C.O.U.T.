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
> **[§8](#8-if-the-goal-is-a-profitable-company-here-is-the-actual-sequence) is the operational
> answer:** what to actually do, in order, to turn that into a profitable company — starting with
> the ownership question SCU's patent policy raises, and pivoting the buyer from reef science
> (grant-funded, ~$9 M/yr nationally) to **mandated offshore-wind noise compliance**, where BOEM
> *requires* passive acoustic monitoring and lessees pay for it as a condition of building.
>
> Researched 2026-08-24. Sources are in [`hub/research/sources.md § Market & commercial
> landscape`](../hub/research/sources.md#market--commercial-landscape). This is a market
> assessment, not a decision — see
> [Open Research Questions](../hub/research/open-questions.md). §8.6 contains the only modelled
> (unsourced) figures in the document and is marked as such.

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

## 8. If the goal is a profitable company, here is the actual sequence

Sections 1–7 answer *is there a market*. This section answers a different question — *what would
we actually do* — and it changes the answer, because **"profitable" and "fundable" are not the
same target and they pull in opposite directions.**

### 8.1 First, decide which company you are building

| | **A profitable small company** | **A venture-scale company** |
|---|---|---|
| Revenue goal | $1–3 M/yr, 3–6 people | $100 M+/yr eventually |
| Funded by | Customer revenue + non-dilutive grants | $10 M+ of equity, several rounds |
| Sells | Analysis, mostly as a service at first | A product, at scale |
| Founders keep | Most of it | A minority, after dilution |
| Fails if | Nobody pays for the first three jobs | Growth stalls at any round |
| Realistic for this team | **Yes** | No — see the Andrenam and Sofar numbers in §1 and §4 |

The evidence in this document argues hard against the second column. Sofar took a decade and
$75.2 M to reach an estimated ~$18 M of revenue as the category leader; Andrenam needed $30 M to
field 35 buoys. Neither is a path available to three graduating seniors, and both describe
businesses that are *funded*, not *profitable*.

The first column is genuinely reachable. **The rest of this section assumes that is the goal.**
If the team later wants the second column, everything below still works as the first two years of
it — services revenue is the cheapest possible way to find out whether the product is real.

### 8.2 The gate that comes before everything else: who owns this

**Do this before incorporating, before a customer conversation, before a pitch.**

Santa Clara University's patent policy (Faculty Handbook §3.7.5–3.7.6) defines an *Inventor* to
include **students** who "use University funds, facilities or other resources, or participate in
University-administered research." Where the University owns an invention, net royalties are split
**50/50** between the inventors and a University fund
([SCU Intellectual Property](https://www.scu.edu/provost/research/research-compliance-and-integrity/intellectual-property/),
[Policy 313 — Patent Policy](https://www.scu.edu/hr/employee-resources/policies-and-guidelines/staff-policy-manual/policy-313---patent-policy/)).

A senior design capstone uses university lab space, university advisors, and in most cases
university funds. **On a plain reading, that is squarely inside the policy.** This is not a
technicality to be worked around later — a company whose core asset is IP the university may own
is unsellable, unfundable, and unlicensable, and the problem gets *harder* the more revenue it has.

The action is small and specific:

1. Email **patents@scu.edu** (or call 408-554-4408) and ask for a written determination on
   ownership of the S.C.O.U.T. analysis software and design files, naming the capstone explicitly.
2. If the University claims ownership, ask what a licence back to the founders looks like.
   Universities do this routinely; it is a conversation, not a refusal.
3. Use the [Entrepreneurs' Law Clinic](https://law.scu.edu/) at SCU Law — free legal work for SCU
   startups, including IP licensing, by law students under supervision. It exists for exactly this.
4. The [Bronco Venture Accelerator](https://santaclaraventures.com/santa-clara-university) is the
   other on-campus resource worth using while still enrolled and it costs nothing.

**Until this is answered in writing, everything below is on hold.** It is also the single cheapest
item on the list: one email, and the answer is free.

### 8.3 The wedge: sell to mandated noise compliance, not to reef conservation

This is the most important finding in this section, and it was not visible from the reef-science
framing.

**BOEM requires offshore wind lessees to conduct long-term passive acoustic monitoring (PAM) on
their lease areas** — measuring sound levels and monitoring for vocalising marine species. NOAA
Fisheries and BOEM have published minimum recommendations for how it must be done
([NOAA Fisheries](https://www.fisheries.noaa.gov/feature-story/new-passive-acoustic-monitoring-framework-help-safeguard-marine-resources-during),
[Frontiers in Marine Science](https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2021.760840/full)).

BOEM additionally runs **POWERON** (Partnership for an Offshore Wind Energy Regional Observation
Network), where lessees make **annual contributions** and approved third parties fulfil the PAM
obligation on their behalf. It was seeded with $5.8 M from the Inflation Reduction Act, and
Revolution Wind, South Fork Wind (Ørsted) and Coastal Virginia Offshore Wind (Dominion) have opted
in ([BOEM](https://www.boem.gov/newsroom/press-releases/boem-announces-poweron-acoustic-monitoring-program-offshore-wind-projects)).

Compare the two buyers side by side:

| | Reef science (current framing) | Offshore wind noise compliance |
|---|---|---|
| Why they buy | Curiosity, mission, a grant they won | **Legal obligation** — they cannot build without it |
| Budget source | Competitive federal grants ~$9 M/yr across all of NOAA CRCP (§1) | Project capex on multi-billion-dollar developments |
| Buying cycle | 12–18 months, tied to grant calendar | Tied to construction schedule; delay costs them more than the service |
| Price sensitivity | Extreme — $5,000 was named as a ceiling | Low — compliance failure halts piling |
| What they need | A cheap instrument | **Defensible analysis a regulator will accept** |

**It is the same core competency.** Hydrophone data in, defensible acoustic indices out, with the
methodology documented well enough to survive review — which is exactly what
[the bioacoustic methodology](../analysis/coral-bioacoustic-methodology.md) already is. The
three-zone frequency model exists because the naive band split misclassifies biological sound as
anthropogenic; that is *literally the failure mode a noise-compliance regulator cares about.*

Two honest caveats:

- **The incumbent is real.** [JASCO Applied Sciences](https://www.jasco.com/wind) has done
  underwater sound science since 1981 and is already the contractor on Ørsted's South Fork Wind.
  You will not beat JASCO at whole-programme PAM and should not try. You need one analysis niche
  they treat as low-margin overflow work.
- **Sofar already markets Spotter Sound for "noise compliance, marine mammal detection."** Read
  that as validation that the pull is real, and as a reason to be the analysis layer on their
  hardware rather than a competitor to it (§6a).

### 8.4 Services first, product second

Three people, no capital, no inventory, and a real analytical skill. There is one business model
that fits that shape, and it is not a product company.

1. **Sell the analysis as a service.** Take somebody's existing hydrophone recordings and deliver
   a reviewed report. Bills from day one, needs no manufacturing, no inventory, no fundraising,
   and — critically — **the customer tells you what the product should be while paying you to
   learn it.**
2. **Productise only what repeats.** After three or four jobs, the parts that are identical every
   time become software. That software is defensible precisely because it was shaped by paying
   customers rather than guessed at.
3. **Never build hardware until a customer has pre-paid for it.** §2 and §3 explain why: the
   hardware is neither differentiated nor the binding cost.

The margin difference is the whole argument, and it does not depend on any market-size estimate:

| | Analysis services | Analysis software | Buoy hardware |
|---|---|---|---|
| Gross margin | 50–70% (your time) | 80%+ once written | 20–40%, before field support |
| Capital needed to start | ~$0 | ~$0 | BOM × inventory + certification |
| Revenue on day one | Yes | No | No |
| What breaks it | You run out of hours | Nothing, if it is used | One bad batch, or a recall |

### 8.5 A 24-month sequence, with gates

Each phase has a **gate**: if the gate is not met, the next phase does not start. This is what
makes it a plan rather than a hope.

| Phase | Months | Do | Gate to continue |
|---|---|---|---|
| **0 · Clear the title** | 0–2 | Written IP determination from SCU; licence terms if needed. Run test 1 from §7 in parallel (it is free) | **A written answer on ownership.** No answer, no company |
| **1 · One paid job** | 2–6 | Find one customer with existing hydrophone data and a report they need. Charge for it. Offshore wind consultancies, POWERON-adjacent bodies, port authorities, aquaculture, an NGO with a grant already awarded | **One invoice paid.** Not a letter of intent — a payment |
| **2 · Three paid jobs + non-dilutive capital** | 6–12 | Two more paid analyses. Submit **NSF SBIR Phase I** (up to $305 K) or **NOAA SBIR Phase I** (up to $190 K) on the *pipeline*, not the platform. Apply to [VentureWell's Ocean Enterprise Accelerator](https://venturewell.org/spring-2026-stage-2-ocean-enterprise-accelerator-cohort/) | **Three paying customers and at least one grant submitted.** Three is where you can tell a pattern from a coincidence |
| **3 · Productise the repeat** | 12–18 | Turn the identical 80% into software. Talk to Sofar about running on [Bristlemouth](https://www.sofarocean.com/products/spotter) — their open hardware standard is the distribution channel (§6a). SBIR Phase II if Phase I landed | **Second sale of the same thing** without bespoke work. That is the moment services becomes product |
| **4 · Choose the company** | 18–24 | Decide deliberately between the two columns in §8.1 | Revenue covering the founders' salaries, or a clear reason to raise |

### 8.6 What "profitable" actually looks like, numerically

**⚠️ The figures in this subsection are an illustrative model, not research.** They are arithmetic
on assumptions, included so the target is concrete and so the assumptions can be argued with.
Everything else in this document is sourced; this is not, and it is marked so it never gets quoted
as though it were.

Three founders at a modest post-graduation salary, plus tooling, insurance, and an accountant, is
on the order of **$350–450 K/yr** of cost. Working backwards at services margins:

| | Model |
|---|---|
| Fully loaded cost, 3 founders | ~$400 K/yr |
| Needed revenue at 60% gross margin | **~$670 K/yr** |
| Jobs per year at $50 K per engagement | ~13 |
| Or: jobs at $100 K per engagement | ~7 |

**Seven to thirteen engagements a year makes three people profitable.** That is a comprehensible,
non-heroic number, and it is the actual difference between this and the venture path: nobody needs
to find a billion-dollar market for it to work. One SBIR Phase I award covers roughly half a year
of that cost on its own, without dilution.

The corresponding hardware model is the reason not to do hardware. At a $5,000 unit price and 30%
gross margin, the same $400 K of cost needs **~270 buoys sold per year** — against a category
leader who has deployed 1,000 units *in total* across a decade (§1), while a philanthropy gives
comparable buoys away for free (§2).

### 8.7 What to do with the buoy: open-source it

Counterintuitive, and it is the right call.

The hardware is not defensible (§5), it is out-competed on price from both directions (§2), and
maintaining it costs the team time it should be selling. Publishing the full design — as the
[OLB authors](https://arxiv.org/html/2601.05615v1) did in January 2026 — converts a liability into
four assets:

- **Credibility.** A published, reproducible platform is a far better calling card to a compliance
  buyer than a private prototype nobody can inspect.
- **Distribution.** Every group that builds one is a candidate customer for the analysis, which is
  the thing being sold.
- **A cleaner IP conversation.** It is materially easier to ask SCU to release or license *software*
  when the hardware is going out under an open licence anyway (§8.2).
- **An academic output.** A capstone-to-publication path the advisors can support, which the
  spin-out conversation alone does not give them.

Keep the analysis pipeline closed, or source-available with commercial terms. **Give away the part
that is already free elsewhere; keep the part nobody else has.**

### 8.8 Kill criteria

Written now, while nobody is emotionally invested, because that is the only time they are useful.

- **No written IP answer from SCU within 3 months of asking** → stop and finish the capstone. Do
  not build a company on unresolved title.
- **No paying customer within 6 months of starting to look** → the compliance wedge is wrong, or
  the team cannot sell. Either is fatal and both are cheap to discover.
- **Three paid jobs with no repeatable 80%** → it is a consultancy, not a company. That is a
  legitimate outcome, but it should be chosen knowingly rather than drifted into.
- **Anyone proposes manufacturing buoys before a customer has pre-paid** → re-read §2, §3 and §8.6.

### 8.9 What to do in the next two weeks

Ranked by cost. The first three are free.

1. **Email patents@scu.edu** asking for a written ownership determination (§8.2). One paragraph.
2. **Email the researchers already interviewed** with test 1 from §7 — capex versus opex split.
   One question, and it either confirms or kills the current positioning.
3. **Read the NOAA/BOEM minimum PAM recommendations** and honestly assess how far the existing
   pipeline is from meeting them. That gap *is* the product roadmap.
4. **Book a meeting with the Entrepreneurs' Law Clinic** while still enrolled and it is free.
5. **Find one organisation sitting on unanalysed hydrophone recordings** and offer to analyse a
   sample at cost. Not free — at cost. A customer who will not pay $1 will not pay $50,000.

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
