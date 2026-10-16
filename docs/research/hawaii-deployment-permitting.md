# Hawaii Deployment Permitting — Options, Routes, and Paperwork

> **Summary** — What it takes to put S.C.O.U.T. in the water in Kāneʻohe Bay, from the lightest
> legitimate option (sensors lowered from a boat for a few hours) to a semi-permanent moored
> buoy. Eleven agencies can touch this; which ones actually do depends almost entirely on **how
> long it stays, whether anything touches the bottom, and whose structure or authorization it
> hangs from**. Two routes need little or no permitting of our own: **(a) attended, anchor-free
> tests** and **(b) piggybacking on a site someone already holds authorization for** (UH/NOAA's
> CRIMP2 mooring, HIMB, He'eia NERR). Everything else needs a permit set that starts with the
> Corps. Includes every form we have found, a question bank to get determinations **in
> writing**, and a backward schedule from the 2027-03-22 deployment.
>
> **Not legal advice.** This is a student team's reading of public rules, and it is incomplete:
> several agencies' current rules could not be retrieved (marked ❓ below). "What can we do with
> the least permitting" is answered by getting each agency to say so in writing, not by
> guessing. Confirm everything with the named agency before relying on it.
>
> Context: Hannah Barkley's 2026-10 email (quoted in [§2](#2-what-hannah-said)); open
> permitting items on [SCO-136](https://linear.app/scout1/issue/SCO-136),
> [SCO-164](https://linear.app/scout1/issue/SCO-164), [SCO-163](https://linear.app/scout1/issue/SCO-163).
> Researched 2026-10-08.

---

## 0. How to read this document

Every regulatory claim is tagged with how well it is established:

| Mark | Meaning |
|---|---|
| ✅ | Read in the primary source (rule text, agency page, or Federal Register) during this research |
| ⚠️ | From a secondary summary, a precedent or example, or inferred from similar cases; **verify before relying** |
| ❓ | Could not be found or retrieved; **ask the agency** (the [question bank](#10-question-bank-get-it-in-writing) has the wording) |

**Bottom line up front**

1. **Nobody on the team holds a permit that covers this.** Hannah says her group has none that
   could ([§2](#2-what-hannah-said)).
2. The lightest *lawful* options are **O2–O3** ([§5](#5-deployment-options-lightest-to-heaviest)):
   sensors on a line from an attended boat, retrieved the same day, nothing touching the
   bottom. They are not guaranteed permit-free (see the gray zones), but they are the cheapest
   place to start asking.
3. Anything **anchored to the seabed** or **left in the water more than a few days** moves into
   the Corps of Engineers' jurisdiction (Rivers and Harbors Act §10), and almost certainly the
   state's too (DLNR's OCCL and Land Division). Hannah's advice is the same: "start with the
   USACE process."
4. The best route for the **live Mar–May 2027 deployment** is probably **O6: connect to an
   existing, already-authorized site** (the same idea as ADR-0004's "marked sites"), because the
   host's authorization can cover it or shorten ours. That needs a yes from the host, not a
   permit from us.
5. There is **no design approval** for a scientific buoy in any process we found. Regulators
   review the footprint, the anchor, what is in the water, the marking and the removal plan, not
   an engineering certification ([§8](#8-does-the-buoy-design-need-approval)).
6. Permit lead times are weeks to months, so paperwork has to start **by 2026-12-01** for a
   2027-03-22 deployment ([§9](#9-schedule-and-owners)).

---

## 1. What we would be putting in the water

| Item | Value | Source |
|---|---|---|
| Platform | Six foam-filled printed wedges around a central chassis; sensor pod hangs below; self-righting ballast stem about 24 in below the keel (about 2.6 kg lead) | [facts.md](../hub/facts.md), [SCO-125](https://linear.app/scout1/issue/SCO-125) |
| Mass / size | About 7.6 kg (v5 estimate); 8.5 in chassis; about 5 in freeboard | [facts.md](../hub/facts.md) |
| Deployment depth | **2–8 m** | [facts.md](../hub/facts.md), [SCO-6](https://linear.app/scout1/issue/SCO-6) |
| Attachment | **Marked site:** line to an existing pile or mooring. **Unmarked site:** one mushroom anchor placed next to (never on) coral. 3-strand twisted nylon, 3/8 in | [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md) |
| Radio | 915 MHz LoRa, 30 B once a day, no license needed in the band; FCC modular grant | [FCC 915 MHz Compliance](fcc-915-mhz-compliance.md) |
| Battery | Two lithium D cells (prototype), sealed in the housing | [SCO-70](https://linear.app/scout1/issue/SCO-70), [SCO-163](https://linear.app/scout1/issue/SCO-163) |
| Ballast | Lead, which the reef permit may restrict | [SCO-136](https://linear.app/scout1/issue/SCO-136) |
| Antifouling | Sea Hawk Smart Solution (copper-free, Econea biocide) | [facts.md](../hub/facts.md) |
| Dates | Hawaii live deployment 2027-03-22 to 2027-05-28; deployment window and backup site still to lock | [SCO-164](https://linear.app/scout1/issue/SCO-164) |

Anything below that depends on a number from this table (footprint, line, ballast, battery) is
what an agency will ask us for. Keep the table current.

---

## 2. What Hannah said

Hannah Barkley's reply, summarized (full text in the 2026-10 email thread):

- A test deployment somewhere in **Kāneʻohe Bay** works; the bay is protected. There is an
  existing **UH pCO₂ mooring** and a **NOAA fixed coral reef monitoring site off Heʻeia
  (CRIMP2)**. Contact **Chris Sabine (csabine@hawaii.edu) first** so we do not interfere with
  that mooring or its data.
- Her group holds **no permit that could cover us.**
- For a permanent or semi-permanent mooring in Hawaii they typically get a **DLNR Special
  Activity Permit**, **OCCL site plan approval**, and a **US Army Corps of Engineers permit**,
  plus possible **NOAA consultations** (Endangered Species Act and Essential Fish Habitat).
  **"I'd start with the USACE process."**
- What is needed depends on **anchor type and length of stay.** A few hours in the water
  **without an anchor** might not need all of that; a **heavy anchor on the bottom** and/or **more
  than a few days** probably does.

That matches what the rules say. The rest of this document is the detail behind it.

---

## 3. The agencies, in one table

| # | Agency / office | Authority | What it controls for us | Needed when | Section |
|---|---|---|---|---|---|
| 1 | **US Army Corps of Engineers**, Honolulu District Regulatory Branch | Rivers and Harbors Act §10; Clean Water Act §404 | Any structure or work in navigable waters, which includes a moored buoy and anchor | Anything moored or anchored; gray zone for temporary items | [§6.1](#61-us-army-corps-of-engineers) |
| 2 | **Hawaii DOH Clean Water Branch** | CWA §401 | Water-quality certification for the federal permit | Automatic under the Corps' nationwide permit; individual otherwise | [§6.2](#62-section-401-water-quality-certification-hawaii-doh) |
| 3 | **NOAA Fisheries PIRO** (through the Corps) | Endangered Species Act §7; Magnuson-Stevens (EFH); Marine Mammal Protection Act | Protected species and fish habitat | Consultation is triggered by the Corps permit | [§6.3](#63-esa-efh-and-mmpa-noaa-fisheries) |
| 4 | **Hawaii Office of Planning** (CZM program) | Coastal Zone Management Act | Federal consistency review of the Corps permit | With the Corps permit | [§6.4](#64-coastal-zone-management-federal-consistency) |
| 5 | **DLNR State Historic Preservation Division** | NHPA §106; HRS §6E | Historic and cultural resources | With the Corps permit and with state land use | [§6.5](#65-historic-and-cultural-resources) |
| 6 | **DLNR OCCL** (Office of Conservation and Coastal Lands) | HRS Ch. 183C; HAR 13-5 | Anything on state submerged lands (the Conservation District) | Anything fixed or moored | [§6.6](#66-dlnr-occl-conservation-district) |
| 7 | **DLNR Land Division** | HRS Ch. 171 | Right of entry or permit to use state submerged land | Anything occupying the bay bottom or water column for a period | [§6.7](#67-dlnr-land-division-right-of-entry-and-revocable-permit) |
| 8 | **DLNR Division of Aquatic Resources** | HRS §187A-6 | Special Activity Permit for research in regulated areas, with regulated gear, or taking aquatic life | Mainly if the site is in a managed area; we take nothing | [§6.8](#68-dlnr-dar-special-activity-permit) |
| 9 | **DLNR Division of Boating and Ocean Recreation (DOBOR)** | HRS Ch. 200; HAR 13-235, 13-256 | Anchoring, mooring and activity in Kāneʻohe Bay | Any vessel anchoring or any mooring in the bay | [§6.9](#69-dlnr-dobor-boating-and-mooring-rules) |
| 10 | **US Coast Guard District 14** | 33 CFR Part 66; 14 U.S.C. 83 | Private aids to navigation; notices to mariners | Any buoy that could be taken for, or obstruct, navigation | [§6.10](#610-us-coast-guard) |
| 11 | **City & County of Honolulu DPP** | HRS Ch. 205A (SMA, shoreline) | Work at or landward of the shoreline | Only if any piece is on land or a shoreline structure | [§6.11](#611-county-special-management-area-and-shoreline) |
| — | **State Environmental Review (HEPA)** | HRS Ch. 343 | Environmental assessment or exemption | Use of state land or Conservation District | [§6.12](#612-environmental-review-hepa-chapter-343) |
| — | **FCC** | 47 CFR §15.247 | Radio | Already handled | [§6.13](#613-fcc-and-other-regulations-we-already-checked) |

---

## 4. Where the deployment could go

### 4.1 Candidate locations in Kāneʻohe Bay

| Location | What is there | Permitting effect | Fit |
|---|---|---|---|
| **Near CRIMP2** (about 1 mile (1.6 km) offshore of Heʻeia State Park, shallow) | UH Mānoa / NOAA PMEL MAPCO₂ mooring, with Drs. De Carlo and Sabine ✅ ([PacIOOS](https://www.pacioos.hawaii.edu/water/wqbuoy-crimp2), [IOOS](https://data.ioos.us/dataset/mapco2-buoy-kaneohe-bay-crimp2-oahu-hawaii)) | An already-authorized instrument site. Our buoy there needs the owners' agreement and probably its own authorization; the host may be able to extend theirs ❓ | **Best.** Hannah's suggestion; real science neighbor |
| **Open sand between patch reefs, inner bay** | Unmarked sand | A new anchor on the bottom: full permit set. A mushroom anchor is the ADR-0004 design | Good physically; heaviest paperwork |
| **Designated mooring areas A and B** (off Heʻeia Kea small boat harbor pier) | DOBOR-designated vessel mooring areas ✅ ([HAR 13-235-35](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-235-35)) | Built for **vessels**; a permanent mooring there needs a DOBOR permit. Whether a research buoy can use the area is ❓ | Worth asking DOBOR |
| **Areas C and D** (off Kāneʻohe Yacht Club) | Designated mooring areas; applications require shoreline public access and parking ✅ | Aimed at boat owners; probably wrong for us | Unlikely |
| **Ahu o Laka sandbar** | Heavily used recreation site; vessels may anchor under 72 hours ✅ | Vessel exception only; high public use and entanglement risk | Avoid |
| **Moku o Loʻe (Coconut Island) refuge** | HIMB; the reef is a state refuge, and taking aquatic life is unlawful except for HIMB research ✅ ([IOOS](https://data.ioos.us/dataset/hawaii-marine-laboratory-refuge-coconut-island-hawaii)) | Managed area: expect a DAR Special Activity Permit and HIMB's agreement | Only through HIMB |
| **Heʻeia fishpond / Heʻeia NERR waters** | Heʻeia National Estuarine Research Reserve; NERR already holds DAR Special Activity Permits for its work ✅ ([DLNR exemption list](https://files.hawaii.gov/dbedt/erp/List_Ex_Notice/2023-09-08-SOH-DLNR-List-of-Exemptions-Aug-2023.pdf)) | Reserve rules and community stewardship; strongest path is a partnership | Only by partnership |
| **Fringing reef flats** | Coral | Highest coral risk. ADR-0004 anchors next to coral, never on it | Avoid |

### 4.2 Sites that are not in the bay

Anything outside Kāneʻohe Bay (south shore, a harbor, a private marina) changes agencies and
rules. The Corps, DLNR and DOH are statewide, but DOBOR's rules and the managed areas are local.
This document covers Kāneʻohe Bay only.

---

## 5. Deployment options, lightest to heaviest

The options are a ladder. Use the lowest rung that still tells us what we need to learn.

| ID | Option | Time in water | Touches bottom | Permits likely | Burden |
|---|---|---|---|---|---|
| O0 | Bench / bucket / tank only | n/a | No | None | None |
| O1 | Sensors in a tub of bay water on shore, shore-station link tested | n/a | No | None; landowner permission only | None |
| O2 | **Sensor pod lowered from an attended boat on a hand line**, retrieved same day | Hours | No | Probably none for the device; boat rules apply ⚠️ | Very low |
| O3 | **Whole buoy floating, tethered to an attended boat, not anchored** | Hours | No | Probably none beyond O2; notify USCG ⚠️ | Low |
| O4 | **Sensors hung from someone's existing pier, dock, seawall or piling** | Days to months | No (if hung) | Owner consent; Corps and DLNR questions ⚠️ | Low to moderate |
| O5 | **Sensors on our own boat at a slip or legal mooring** | Days to months | No | Harbor rules; DOBOR ⚠️ | Low |
| O6 | **Buoy connected to an existing authorized mooring or pile** (CRIMP2, HIMB, NERR, a marked site) | Weeks to months | No new anchor | Host's agreement; maybe an amendment ❓ | Moderate |
| O7 | **Short-term anchored buoy** (days to a few weeks, light anchor) | Days to weeks | Yes | Corps NWP 5; state ROE and OCCL ❓ | Moderate to high |
| O8 | **Semi-permanent moored buoy** (our own mushroom anchor, months) | Months | Yes | Full set in [§6](#6-every-process-in-detail) | High |
| O9 | **Individual permits** (if the nationwide permit does not fit or the site is in a special area) | Months | Yes | O8 plus an individual Corps permit, possibly a CDUA and an EA | Highest |

### O0–O1: no in-water work

- **What it is.** Everything proven on the bench and in a tub of ~35 ppt salt water (already
  planned: [SCO-168](https://linear.app/scout1/issue/SCO-168), [SCO-172](https://linear.app/scout1/issue/SCO-172)),
  with the shore station receiving packets.
- **Permits.** None. Landowner permission for a shore-station location.
- **Pros.** Zero risk, zero delay; most of the engineering questions (waterline, righting, seal,
  telemetry) get answered here.
- **Cons.** Tells us nothing about real currents, fouling, signal over water, or biology.
- **Verdict.** Do all of it before asking anyone for anything in the bay.

### O2: sensor pod lowered from an attended boat

- **What it is.** The turbidity/temperature pod on a line over the side of your boat for hours,
  logging; pulled up before you leave. Nothing is left behind, nothing touches the bottom.
- **Permits.** No federal or state rule we found regulates a hand-held or hand-lowered
  instrument that is retrieved the same day ⚠️. Hannah says a few hours in the water with no
  anchor "might not" need the formal processes. The *boat* is regulated: registration, and
  anchoring limits if you anchor ([§6.9](#69-dlnr-dobor-boating-and-mooring-rules)).
- **Gray zones.**
  - **Where you are.** A managed area (the Coconut Island refuge, NERR waters) can require a DAR
    Special Activity Permit for any "activity in a regulated area," even with no collecting
    ✅ ([DAR SAP page](https://dlnr.hawaii.gov/dar/?p=1023)). Stay out of managed areas unless
    approved.
  - **Duration.** "A few hours" is Hannah's phrasing, not a legal threshold. No rule we found
    sets one ❓.
- **Pros.** Real water, real signal path, real sensor drift data; almost no paperwork; fast.
- **Cons.** Not the whole system; the buoy never floats on its own; needs a boat and crew on site
  the whole time.
- **Verdict.** The best first in-water step. Get a short written "no permit needed" from the
  Corps and DOBOR for this specific plan ([§10](#10-question-bank-get-it-in-writing)).

### O3: whole buoy floating, tethered to an attended boat

- **What it is.** The complete buoy in the water, held by a line to your boat (or drifting within
  arm's reach) for a few hours, then recovered. Tests flotation, righting and the real LoRa path
  without a mooring.
- **Permits.** Same as O2 for the device ⚠️. A free-floating object is a possible navigation
  hazard; USCG may want a notice ([§6.10](#610-us-coast-guard)).
- **Pros.** The closest thing to the deployed system with no anchor; also the planned
  [ocean flotation test](https://linear.app/scout1/issue/SCO-184) ([SCO-183](https://linear.app/scout1/issue/SCO-183)
  plans site, permission, boat and safety).
- **Cons.** Needs calm conditions; a loose buoy is a lost buoy (tracker, tether, and a recovery
  plan); not a test of the mooring.
- **Verdict.** Fits SCO-184 exactly. Ask the Corps, DOBOR and USCG D14 whether a recovered-same-
  day test needs anything.

### O4: hung from someone's property (house, pier, dock, seawall, piling)

You asked: *"if I hung a system off of someone's house or property, would I need a permit?"*

- **Short answer.** Probably **owner permission plus a question to the Corps and DLNR**, not a
  new permit of our own, but the rules do not say that cleanly ⚠️.
- **Why.** The structure is private, but the **water and bay bottom under it are state
  submerged land** ✅ (Kāneʻohe Bay below the shoreline). In general:
  - **Corps.** A device attached to an existing authorized structure can still be a "structure
    or work" in navigable water. NWP 5 covers scientific measurement devices ✅
    ([text in §6.1](#61-us-army-corps-of-engineers)), but NWP verification is the Corps' call ❓.
  - **State.** Whoever holds the pier's land authorization (often a DLNR right of entry, lease
    or an older permit) may need to approve or amend it ❓. Any new use of state submerged land
    is OCCL/Land Division territory ([§6.6](#66-dlnr-occl-conservation-district),
    [§6.7](#67-dlnr-land-division-right-of-entry-and-revocable-permit)).
  - **County.** Nothing is installed landward of the shoreline if the hardware stays on the
    pier; if it attaches to the house or seawall, ask about shoreline and SMA rules
    ([§6.11](#611-county-special-management-area-and-shoreline)).
- **Pros.** No anchor, no new bottom contact, power and Wi-Fi may be available, easy to service,
  and a real long-duration test; the owner may already hold authorizations.
- **Cons.** Needs a cooperative owner (with insurance and liability questions ⚠️), a water depth
  and exposure that match the 2–8 m plan (pier water is usually shallower, muddier and fouled
  differently), and it tests the sensors, not the free-floating buoy.
- **Verdict.** A strong, cheap way to run a **sensor-only, weeks-long** test, **if** we get a
  Corps and DLNR answer first. Ask the owner whether the structure has an authorization on file.

### O5: hung from our own boat at a slip or legal mooring

You asked: *"…or off of my boat?"*

- **Short answer.** The instrument is not separately permitted, but the **boat is regulated**
  and where it sits matters ⚠️.
- **Rules that apply to the boat** (none of them is about the sensor):
  - **Slip in a state small-boat harbor** (for example Heʻeia Kea): harbor rules; ask the
    harbor agent whether hanging an instrument off the hull needs approval ❓.
  - **Anchoring outside a designated area:** no more than **72 cumulative hours in any 14-day
    period**, and relocating and returning does not reset the clock ✅
    ([HAR 13-235-9](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-235-9)).
    Extensions are allowed if "reasonable and warranted" ✅. Transient vessels may get a
    temporary permit of up to 90 days ✅.
  - **Kāneʻohe Bay:** vessels must generally moor or anchor in **designated mooring areas**
    A–D, with exceptions (BLNR plus Corps permit; privately dredged channels; skiffs on fringing
    reefs or mud flats; under 72 hours near the sandbar) ✅
    ([HAR 13-235-35](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-235-35)).
  - **Houseboat and living-aboard** restrictions outside designated areas ✅.
- **Pros.** No structure of our own; fully retrievable; instrument sits at a real depth under a
  moving platform.
- **Cons.** Needs a legal place for the boat for the whole test; a boat with gear in the water
  can still be asked about by DOBOR; the platform moves and swings, so the data differ from a
  fixed buoy.
- **Verdict.** Good for **days-to-weeks sensor tests** from a slip. Ask DOBOR in writing.

### O6: connect to an existing authorized site

- **What it is.** The ADR-0004 "marked site" case: tie our buoy to a mooring or pile someone
  already has authorization for. In Kāneʻohe Bay the obvious hosts are **UH/NOAA CRIMP2**,
  **HIMB**, and **Heʻeia NERR**.
- **Permits.** The host's existing authorizations (a Corps permit, a DLNR right of entry, a DAR
  permit) may already cover a small addition, or may need a **modification** or a **named
  collaborator** ❓. Either way, the Corps' NWP 5 still names removal of "foundations, anchors,
  buoys, lines" ✅, so removal is on whoever owns the authorization.
- **Pros.** The heaviest items (a new bottom anchor, a new site assessment, a new ROE) are
  avoided; it is the lowest-footprint way to a months-long test; it puts us next to a reference
  instrument (the pCO₂ and water-quality buoy), which is a real validation story for the
  capstone; and it matches the earlier discussion with Hannah about using the same deployment site as one of hers.
- **Cons.** It depends on others' goodwill and schedule. The host carries liability risk and may
  not accept a student device. Their instruments must not be disturbed.
- **Verdict.** **Recommended path for the live deployment** if Chris Sabine, HIMB or Heʻeia NERR
  says yes. Pursue it in parallel with the O8 paperwork so we are not left with nothing.

### O7: short-term anchored buoy

- **What it is.** A buoy on a light mushroom or concrete block for days to a few weeks.
- **Permits.** The same set as O8, because the permit triggers are an **anchor on the bottom**
  and a **structure in the water**, not mainly duration ⚠️. A shorter stay can shorten state
  terms, not remove the need.
- **Verdict.** Not a shortcut. If we are anchoring, we should be doing O8 properly.

### O8: semi-permanent mooring

See [§6](#6-every-process-in-detail) for every process. In short: Corps NWP 5 (likely with a
pre-construction notification because protected species and historic properties are in play),
the DOH blanket certification, CZM consistency, SHPD review, an OCCL site plan approval or
conservation district permit, a DLNR Land Division right of entry, possibly a DAR Special
Activity Permit, DOBOR notification, a USCG determination, and a HEPA exemption or assessment.

### O9: individual permits

If the Corps says NWP 5 does not fit (for example a heavy anchor, a managed area, a large
footprint) it becomes an **individual permit** (Corps standard permit; state **Conservation
District Use Application** with a public process and an environmental assessment). The OCCL
decision window alone is **180 days** ✅. Avoid by designing the footprint to fit NWP 5.

---

## 6. Every process in detail

Each subsection gives: what it is, when it applies to us, the form(s), fee and timeline, what
to submit, and the plan of attack. The mark in the heading is the overall confidence.

### 6.1 US Army Corps of Engineers

**Confidence:** NWP 5 text ✅; Honolulu's final regional conditions and local practice ❓.

- **Authority.** Rivers and Harbors Act §10 (33 U.S.C. 403): no obstruction or alteration of
  navigable waters without a Corps permit. Clean Water Act §404 covers fill discharge ✅
  ([overview](https://www.poh.usace.army.mil/Missions/Regulatory/); the page blocks automated
  fetches, so cite from the summaries). A moored buoy and its anchor are the §10 case.
- **The fast lane: Nationwide Permit 5, Scientific Measurement Devices.** The 2026 nationwide
  permits took effect **2026-03-15** and run to **2031-03-15** ✅
  ([Federal Register 2026-00121, 2026-01-08](https://www.govinfo.gov/content/pkg/FR-2026-01-08/pdf/2026-00121.pdf)).
  The NWP 5 text, read directly ✅:

  > "Devices, whose purpose is to measure and record scientific data, such as staff gages, tide
  > and current gages, meteorological stations, water recording and biological observation
  > devices, water quality testing and improvement devices, and similar structures. … Upon
  > completion of the use of the device … the measuring device and any other structures or fills
  > associated with that device (e.g., foundations, anchors, buoys, lines, etc.) must be removed
  > to the maximum extent practicable and the site restored to pre-construction elevations."
  > (Authorities: Sections 10 and 404)

  The permit text itself lists **no pre-construction notification (PCN)** requirement and the
  Corps did not change NWP 5 in 2026 ✅. A 2025 DOE document cites NWP 5 as the authorization for
  deploying scientific measuring buoys off Kona ⚠️
  ([CX-035198](https://www.energy.gov/sites/default/files/2026-03/CX-035198.pdf)), which is a
  precedent in Hawaii, not a Honolulu rule.
- **But the general conditions still apply, and two of them probably force a PCN for us** ⚠️:
  - **General Condition 18 (Endangered Species)** ⚠️: I could not read the 2026 text of the
    condition itself. As I recall it, non-federal permittees must notify the Corps **before**
    work if any listed species or designated critical habitat might be affected. Hawaiian monk
    seals, green sea turtles and humpback whales use Kāneʻohe Bay, so a PCN is likely to be
    required, and the Corps then handles the Section 7 consultation with NOAA, which adds time.
  - **General Condition 20 (Historic Properties)** ✅: per the Corps' own rulemaking, "the only
    activities that are immediately authorized by NWPs without the requirement for a PCN under
    general condition 20 are activities with 'no potential to cause effect' to historic
    properties." Kāneʻohe Bay has fishponds and culturally significant sites, so assume we must
    notify.
  - **General Condition 1 (Navigation)** ⚠️: no unacceptable adverse effect on navigation.
  - **Essential Fish Habitat** ✅ is addressed under the NWP program's EFH provisions
    (the program's EFH compliance statement is in the same rule).
- **Regional conditions.** Honolulu District proposed Hawaii-specific conditions in 2025
  (public notice, comments due 2025-08-02) ⚠️
  ([proposed conditions](https://www.deq.gov.mp/assets/news-docs/poh-public-notice-proposed-rule-2026-nwps-and-poh-proposed-reg-conditions-18jun25.pdf)).
  I could not retrieve the **final** list ❓. Get it: it may add notification triggers
  (coral, special aquatic sites) that decide whether we need a PCN.
- **The form.** The NWP **pre-construction notification** is **ENG Form 6082** (Oct 2024
  edition) per a Honolulu PCN example ⚠️
  ([Honolulu PCN template example](https://hiepro.ehawaii.gov/resources/90688/BR_083_1_48%20NWP%20PCN.pdf)),
  with a Honolulu supplemental-information section. The standard individual permit uses
  **ENG Form 4345** ⚠️ (verify).
- **What to submit with a PCN** ⚠️: project description and purpose; plan view and cross-section
  drawings (a one-page schematic is enough for a buoy); GPS coordinates and a chart/aerial map;
  water depth and bottom type (sand, coral, rubble) at the anchor; anchor type, weight and
  footprint (area); mooring line type, length and scope; a **removal and restoration plan**
  (NWP 5 requires it); species and habitat information (EFH worksheet); a historic-properties
  statement. The authority to answer all of these is already in [ADR-0004](../decisions/0004-reef-safe-anchoring-and-mooring.md).
- **Timeline.** A PCN has a default **45-day** clock ⚠️ (from the NWP program rules; verify), which
  stops while the Corps consults NOAA or SHPD. The Corps may also say a project does not qualify
  and must go to an individual permit ✅ (per NWP general procedures).
- **Fee.** Nationwide-permit verifications are generally free ⚠️; individual permits carry fees.
- **Where.** Honolulu Regulatory Branch, 230 Otake St, CEPOH-RO, Fort Shafter, HI 96858-5440 ⚠️;
  the 2022 branch number 808-835-4300 and the NWP/WQC line **(808) 835-4303** ✅ ([DOH page](https://health.hawaii.gov/cwb/permitting/section-401-wqc/blanket-section-401-wqc/)).
  Confirm both.
- **Plan of attack.**
  1. Email the branch a one-page project description and ask: *Does a recovered-same-day test
     (O2/O3) need anything? Is NWP 5 available for a moored scientific buoy in Kāneʻohe Bay? Do
     we need a PCN and why? What are the final Honolulu regional conditions?* Ask for a
     **pre-application meeting** and a **written determination**.
  2. Prepare ENG 6082 and a drawing package ([§7](#7-every-form-and-document-in-one-list)).
  3. File the PCN no later than the date in [§9](#9-schedule-and-owners).

### 6.2 Section 401 Water Quality Certification (Hawaii DOH)

**Confidence:** ✅.

- **What it is.** A state certification that a federally permitted activity will not violate
  water-quality rules. It is not a separate permit.
- **For us.** Hawaii DOH issued **Blanket Section 401 WQC1100**, effective **2026-03-15**, which
  **includes NWP 5** ✅ ([DOH blanket WQC page](https://health.hawaii.gov/cwb/permitting/section-401-wqc/blanket-section-401-wqc/);
  [WQC1100 PDF](https://health.hawaii.gov/cwb/files/2025/12/WQC1100.FNL_.25.signed_by_USACE-POH.pdf)).
  Eligible applicants "do not submit applications, documents, or reports to DOH-CWB."
- **Gap.** I did not read WQC1100's conditions ❓ (read the PDF; copper antifouling and any
  discharge from the buoy are the obvious questions).
- **If we leave NWP 5** (individual permit): apply for an **individual 401 WQC** after a
  **pre-filing meeting request** ✅
  ([form](https://health.hawaii.gov/cwb/files/2021/03/20210315-Fillable-Pre-Filing-WQC-Meeting-Request.pdf)).
- **Plan of attack.** Read WQC1100 once; ask the Corps to confirm WQC1100 covers our verification.

### 6.3 ESA, EFH and MMPA (NOAA Fisheries)

**Confidence:** ⚠️ (process confirmed; species list for the exact site not pulled).

- **Who consults.** The Corps is the "action agency" and consults NOAA Fisheries' Pacific Islands
  Regional Office (PIRO) when its permit may affect listed species ✅
  ([ESA consultations, Pacific Islands](https://www.fisheries.noaa.gov/pacific-islands/endangered-species-conservation/esa-consultations-pacific-islands)).
  PIRO provides an Action Agency Consultation Package and an Effects Determination Record ✅.
  The applicant usually supplies the information; confirm with the Corps ⚠️.
- **Species likely in Kāneʻohe Bay** ⚠️: Hawaiian monk seal, green sea turtle, humpback whale
  (winter), and other protected marine species; confirm with the PIRO species list for the main
  Hawaiian Islands ✅ (link on the page above). Critical habitat designated for the monk seal
  covers the **Northwestern Hawaiian Islands**, and the main-islands insular false killer whale ✅.
- **Essential Fish Habitat.** Federal permits that may adversely affect EFH require consultation ✅
  ([EFH Pacific Islands](https://www.fisheries.noaa.gov/pacific-islands/consultations/essential-fish-habitat-consultations-pacific-islands)).
  EFH includes coral reefs and submerged structure; NOAA offers an **EFH Assessment Worksheet**
  and **Habitat Mapper** ✅.
- **Marine Mammal Protection Act.** An intentional or incidental "take" of marine mammals needs
  authorization. A passive buoy does not intend one, but **line entanglement** is the realistic
  risk. The humpback sanctuary itself issues no permits ✅
  ([sanctuary science page](https://hawaiihumpbackwhale.noaa.gov/science/)); permits for work with
  humpbacks come from NMFS and DAR ✅. **Whether Kāneʻohe Bay is inside the sanctuary boundary**
  is ❓ (check the map).
- **Our mitigations to describe in the PCN.** Taut-line avoided (slack, swing radius: ADR-0004);
  twisted 3/8 in nylon that fouls a propeller; a minimal line length; no loose slack in the
  water column; marking; and a removal plan.
- **Plan of attack.** Pull the PIRO species list and the EFH worksheet; draft the species and
  entanglement section once, and reuse it in the Corps, OCCL and DAR submissions.

### 6.4 Coastal Zone Management federal consistency

**Confidence:** ⚠️.

- **What it is.** The state's Coastal Zone Management Program (Office of Planning) reviews federal
  permits for consistency with state coastal policy. Corps permits under §10 and §404 are covered
  ✅ ([Hawaii CZM federal consistency](https://planning.hawaii.gov/?p=548)).
- **Open ❓.** Whether the state has issued a **general concurrence** for the 2026 nationwide
  permits. If not, an NWP activity may need an individual consistency certification. Ask the
  Corps and the CZM office.
- **Plan of attack.** Ask in the same email as §6.1.

### 6.5 Historic and cultural resources

**Confidence:** ⚠️.

- **Two parallel laws.** **NHPA §106** (federal permit) and **HRS §6E-8** (state land or state
  permit). Both go through the **State Historic Preservation Division (SHPD)** via the
  **HICRIS** online system; paper submittals are not accepted ✅
  ([SHPD review process](https://dlnr.hawaii.gov/shpd/programs/review-compliance/hrs-6e-8-6e-42-review-process/)).
  A §106 packet follows the documentation standards of **36 CFR 800.11** ✅. SHPD does not approve
  or deny; it reviews effects and the permitting agency decides ✅.
- **Timelines** ✅: SHPD responds on whether an inventory survey is needed within **30 days**, and
  agrees or disagrees with significance evaluations within **45 days**.
- **Forms** ✅: the **SHPD HRS §6E submittal form** (the OCCL page links it). The form revision I
  found was 2020 ⚠️; use the live **forms page**: <https://dlnr.hawaii.gov/shpd/review-compliance/forms>.
- **What to expect for a buoy.** A small, removable device on sand, with no ground disturbance on
  land, will usually be a "no historic properties affected" finding; the real question is whether
  the **anchor footprint** touches a fishpond wall, a wall alignment, or a shipwreck/artifact
  site. Heʻeia is known for Native Hawaiian fishponds ⚠️.
- **Plan of attack.** Give SHPD a coordinate and an anchor footprint early (a free-text question
  to the Corps will trigger it anyway). Also talk to Native Hawaiian stewards; see
  [§6.14](#614-community-and-landowner-consultation-not-a-permit).

### 6.6 DLNR OCCL (Conservation District)

**Confidence:** process and fees ✅; which letter code a research buoy gets ❓.

- **Why OCCL.** State submerged lands are in the **Conservation District**; OCCL lists a
  separate **Marine Waters CDUA** for projects on state submerged lands ✅
  ([OCCL application process](https://dlnr.hawaii.gov/occl/application-process/)).
- **The four outcomes** ✅ (HAR 13-5, §§13-5-22 to 13-5-25):

  | Code | Meaning | Review |
  |---|---|---|
  | (A) | No permit needed (OCCL can issue a "No Objection" letter on request) | None |
  | (B) | **Site Plan Approval (SPA)** | OCCL only; usually no public review; **usually under 30 days**; **$50** |
  | (C) | **Departmental Permit** (CDUP, Chair approves) | $250 plus hearing/publication costs |
  | (D) | **Board Permit** (CDUP, BLNR approves) | 2.5% of project cost, $250 minimum, $2,500 maximum, plus hearing and publication |

  CDUP decisions are due **within 180 days** of acceptance ✅. Applications are accepted **by
  mail or in person only** ✅: OCCL, PO Box 621, Honolulu, HI 96809, or Kalanimoku Building,
  1151 Punchbowl St, Room 131.
- **Which code for a research buoy?** I could not find a listed use for "scientific instrument" in
  the resource subzone ✅ (§13-5-24 lists marine construction, dredging and filling of submerged
  lands as a **Board permit (D-1)** and does not list buoys). Two precedents show lighter
  treatment:
  - **A buoy under an SPA.** DLNR's September 2024 exemption list records **OCCL SPA OA 24-50** at
    Waialae Beach Park, Oʻahu for installing and managing one **Aqualink buoy**, filed under the
    exemption at HAR 11-200.1-15(c) ⚠️
    ([DLNR exemption list](https://files.hawaii.gov/dbedt/erp/List_Ex_Notice/2024-10-08-SOH-DLNR-List-of-Exemptions-Sept-2024.pdf)).
  - **Instruments tied to an SPA.** A 2021 Land Division action placed three DOH water-quality
    instruments on submerged land at Keʻehi Lagoon, with the permit term tied to an OCCL SPA ⚠️.
  - **Research with no land use** is listed as (A-1), no permit; research with incidental
    ground disturbance (such as installing equipment) is (C-1) ⚠️ (from the protective-subzone
    list; verify the subzone for the bay).
  The practical reading: a small, removable instrument buoy has been handled by **SPA ($50, under
  30 days)**, but the anchor may push it to a departmental permit. Ask OCCL.
- **Forms** ✅ (all from the OCCL page): 
  - [Site Plan Approval application (SPA)](https://dlnr.hawaii.gov/occl/files/2024/08/SPA-2024.docx)
  - [Marine Waters CDUA](https://dlnr.hawaii.gov/occl/files/2024/08/Marine-CDUA-2024.docx)
  - [Conservation District Use Application (CDUA)](https://dlnr.hawaii.gov/occl/files/2024/08/CDUA-2024.docx)
  - Supporting documents on request: EA or exemption, SHPD §6E form, management plan, Special
    Management Area determination, shoreline certification, boundary determination if within 50
    ft of a subzone line.
- **Rules are changing.** BLNR considered proposed **amendments to HAR 13-5** in June 2026 ⚠️
  ([BLNR notice](https://dlnr.hawaii.gov/wp-content/uploads/2026/06/Notice-K-1-BLNR-HRS-Chapter-13-5-June-12-2026.pdf));
  check the numbering and wording at filing time.
- **Contact** ✅: OCCL Administrator, (808) 587-0377.
- **Plan of attack.**
  1. Email OCCL: *Is a recovered-same-day test exempt (A)? Is a moored scientific buoy a (B) SPA, or
     a (C)/(D) CDUP? Is the Aqualink OA 24-50 treatment available to us? Can you send a
     determination letter?*
  2. Fill the SPA form; attach the drawing, site map, the SHPD/§6E submittal, the HEPA exemption
     text and the host's authorization.
  3. Mail or hand-deliver (no electronic filing).

### 6.7 DLNR Land Division: right of entry and revocable permit

**Confidence:** ⚠️.

- **What it is.** Use of state **submerged land** for something that occupies it needs a **right
  of entry (ROE)** or a **revocable permit (RP)** from the Land Board, under HRS Chapter 171 ⚠️.
  Precedents: a 2021 DOH request to place three monitoring instruments at Keʻehi Lagoon (HRS
  §§171-13 and 171-55; term tied to an OCCL SPA; no charge) ⚠️; a **January 2025 ROE to HIMB** for
  unencumbered state submerged land at Heʻeia ⚠️; a **March 2025 ROE for the Geometric Ecology Lab
  (HIMB)** to place coral nursery tables in Kāneʻohe Bay ⚠️
  ([DLNR exemption list, Mar 2025](https://files.hawaii.gov/dbedt/erp/List_Ex_Notice/2025-04-08-SOH-DLNR-List-of-Exemptions-March-2025.pdf)).
- **What it likely requires** ❓: Land Board approval at a scheduled meeting (so a calendar
  constraint), an exemption or EA under HRS 343, a description and map, possibly liability
  insurance and an indemnity, and OCCL's site plan approval as a prerequisite.
- **For a student team** there is a major shortcut: **a UH unit (HIMB, Hawaiʻi Institute of
  Marine Biology) already holds ROEs in Kāneʻohe Bay.** If HIMB agrees to host the buoy, their ROE
  may be amended rather than a new one issued ❓.
- **Plan of attack.** Ask Land Division (Oʻahu District Land Office): *Does a research buoy on a
  mushroom anchor need an ROE or RP? What does it cost and require? Can it be added to an
  existing UH authorization?* And ask HIMB the same.

### 6.8 DLNR DAR Special Activity Permit

**Confidence:** ✅ for the permit itself; whether we need one ❓.

- **What it is.** A **Special Activity Permit (SAP)** is required for "collecting regulated
  aquatic organisms or resources, using regulated gear, or conducting activities in regulated
  areas" for **research, educational or management purposes**; authority **HRS §187A-6**; **no
  fee**; annual report required (activity summary, data, results, photos, GPS) ✅
  ([DAR SAP page](https://dlnr.hawaii.gov/dar/?p=1023)). Applicants must be "associated with a
  research, educational, or management institution" ✅. **SCU qualifies as an institution; the
  team does not currently hold one.**
- **Do we need one?** We collect nothing and use no regulated gear. A SAP is needed if the
  site is a **regulated area** (marine refuge, Marine Life Conservation District, fisheries
  management area, a NERR) ❓. Hannah's group gets a SAP for their work, which is why she lists it.
  If we are at a CRIMP2-adjacent site that is not a regulated area, the answer may be "no."
- **The application** ✅: Google Form, plus the **Request and Reporting Spreadsheet** (required)
  ([SAP FAQ and Pre-Application Guide](https://dlnr.hawaii.gov/dar/files/2025/05/SAP_FAQ_and_Pre-Application_Guide.pdf),
  [Google application form](https://docs.google.com/forms/d/e/1FAIpQLSdGBLcnQ4tca_9c6M7TE03dnwEcSuSLA9scSlkESZJcUJhN3A/viewform),
  [spreadsheet](https://dlnr.hawaii.gov/dar/files/2025/05/SAP_Request__Reporting_Spreadsheet.xlsx),
  [coastal locations](https://dlnr.hawaii.gov/dar/files/2025/05/Coastal_Locations.xlsx)). The
  coral-restoration tools do not apply to us. DAR is moving to a new online portal, so re-check.
  Processing time: not stated ❓. Contact: **dar.sap@hawaii.gov**, (808) 587-0100.
- **Wrong rule.** HAR 13-60.4 (West Hawaii aquarium collection) is **not** the basis for a research
  SAP ⚠️; do not cite it.
- **Plan of attack.** Ask DAR: *Does a non-collecting instrument buoy in this location need a SAP?*
  If the host (HIMB/NERR/PMEL) already holds one, ask to be named on it as a collaborator.

### 6.9 DLNR DOBOR: boating and mooring rules

**Confidence:** HAR 13-235 ✅; HAR 13-256 Kāneʻohe-specific text ❓.

- **Anchoring and mooring** ✅ (HAR 13-235-9, last amended 2018-12-31):
  - **72 cumulative hours in any 14-day period** outside designated areas; the clock does not reset
    if you move and return; an extension is possible "if reasonable and warranted."
  - A **permit to moor outside a designated area** requires BLNR approval, and a Corps
    permit for commercial vessels.
  - Transient or visiting vessels: temporary anchoring permit up to **90 days**.
- **Kāneʻohe Bay mooring areas A–D** ✅ ([HAR 13-235-35](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-235-35)):
  vessels must generally be in a designated area; any **permanent mooring** within one needs a
  DOBOR permit; exceptions as in [O5](#o5-hung-from-our-own-boat-at-a-slip-or-legal-mooring).
- **The Kāneʻohe Bay ocean recreation management area** is HAR §13-256-73 and sub-sections
  (Windward Oʻahu ORMA) ⚠️. I retrieved only §13-256-73.11 (temporary mooring of commercial
  vessels at Heʻeia Kea, 180 days) ✅. The unofficial compilation is
  [HAR 13-256 (DOBOR, 2025-04-02)](https://dlnr.hawaii.gov/dobor/files/2025/04/13-256_250402.pdf);
  it is a compressed PDF I could not read here ❓, so **read §13-256-73 and §13-256-13 yourself.**
  §13-256-13 ("mooring of rafts and platforms") bans mooring **rafts and platforms for thrill craft,
  parasailing and other water sports** without a DOBOR permit and bars ground tackle on live coral ✅;
  it is aimed at commercial recreation but it shows the mindset: ground tackle on live coral is
  prohibited.
- **Is a research buoy a "vessel," a "raft/platform," or none?** ❓ **Ask DOBOR in writing**; this
  decides whether any DOBOR permit is needed for an anchored buoy.
- **Contact.** DOBOR Oʻahu District Office, Keʻehi Small Boat Harbor ⚠️. Confirm the current
  number.
- **Plan of attack.** Send DOBOR a one-page description of O2/O3/O7/O8 and ask for the rule
  citation in each case.

### 6.10 US Coast Guard

**Confidence:** ⚠️.

- **Authority.** 14 U.S.C. 83 prohibits establishing an aid to navigation without Coast Guard
  permission; **33 CFR Part 66** covers **private aids to navigation (PATON)**; the application is
  **Form CG-2554** ⚠️ ([CG-2554](https://media.defense.gov/2017/Oct/16/2001827524/-1/-1/0/CG_2554.PDF);
  [PATON guide, D13](https://www.pacificarea.uscg.mil/Portals/8/District_13/dpw/docs/patonguide.pdf)).
- **Does a research buoy count?** The regulation is broad ("all marine aids to navigation operated
  in navigable waters" other than government ones) ⚠️, but a scientific buoy is not intended to
  help navigation. The D13 PATON notice says **non-commercial mooring buoys normally do not need a
  USCG permit if they do not adversely affect navigation and are marked** ⚠️; I found nothing for a
  scientific buoy in **District 14 (Hawaii)** ❓.
- **Marking and notice.** A buoy in a navigable channel or a mooring area should carry
  appropriate markings and be reported for the **Local Notice to Mariners**; D14's AtoN and
  Waterways Management branch handles this ⚠️
  ([D14 notices](https://navcen.uscg.gov/sites/default/files/pdf/lnms/lnm14262025.pdf)).
- **Plan of attack.** Email the D14 Waterways Management / PATON office (the Local Notice to
  Mariners contact is **D14-DG-PJ-dpw@uscg.mil** ⚠️): *Does a 7 kg scientific buoy at lat/long X, depth
  Y, need a CG-2554, or only a Local Notice to Mariners and marking? What marking?* Also call
  Sector Honolulu, (808) 842-2600 ⚠️.

### 6.11 County: Special Management Area and shoreline

**Confidence:** ⚠️.

- **What it is.** HRS Chapter 205A: counties administer **Special Management Area (SMA) permits**
  and **shoreline setback variances** ⚠️ ([CZM overview](https://seagrant.soest.hawaii.edu/sustainable-aquaculture/fed-review-coastal-zone-mgmt-prg/)).
  Honolulu's office is the **Department of Planning and Permitting (DPP)**.
- **For us.** The SMA is a **landward** strip; a buoy entirely in the bay is under state and
  federal jurisdiction ⚠️. SMA/shoreline rules would apply only if we **build or attach
  anything on land** or on a seawall, or install a shore station or cable crossing the shoreline.
- **Plan of attack.** Keep all hardware off the shoreline (the shore station goes in a building
  we have permission for). If O4 uses a private pier, ask DPP whether attaching to the pier or
  seawall is "development."

### 6.12 Environmental review (HEPA, Chapter 343)

**Confidence:** ⚠️.

- **What it is.** Hawaii's environmental review law requires an **environmental assessment (EA)**
  for actions that use **state land or state funds**, or occur **in the Conservation District**,
  unless **exempt** (HRS 343-5; exemptions in HAR 11-200.1-15) ⚠️.
- **For us.** Anchoring on submerged state land triggers it. DLNR keeps a **monthly list of
  exemptions** that shows how small projects are handled (for example the Waialae buoy under
  §11-200.1-15(c)) ✅
  ([DLNR exemption lists](https://files.hawaii.gov/dbedt/erp/List_Ex_Notice/2024-10-08-SOH-DLNR-List-of-Exemptions-Sept-2024.pdf)).
  The **exemption is requested by DLNR** as part of OCCL or Land Division action, not by us ⚠️.
- **Cost of the alternative.** A full EA is months; it has a public comment process via the
  **Environmental Notice**. Avoid by keeping the project small, removable, and on sand.
- **Plan of attack.** Ask DLNR to confirm the exemption class in their determination letter.

### 6.13 FCC and other regulations we already checked

- **FCC.** Part 15 §15.247, 902–928 MHz ✅, handled in
  [FCC 915 MHz Compliance](fcc-915-mhz-compliance.md): 500 kHz bandwidth, SF12, +11 dBm, antenna
  gain at or below 2.15 dBi, and a "Contains FCC ID" label ([SCO-98](https://linear.app/scout1/issue/SCO-98),
  [SCO-103](https://linear.app/scout1/issue/SCO-103)). No license; no filing.
- **Shipping the lithium cells to Hawaii** ([SCO-163](https://linear.app/scout1/issue/SCO-163)):
  a transport rule, not a deployment permit; handle separately.
- **Lead ballast** ([SCO-136](https://linear.app/scout1/issue/SCO-136)): whether lead is allowed in
  the reef environment is a state/federal question to put in the same emails; if rejected, the
  ballast design changes, which is why this must be asked **early**.

### 6.14 Community and landowner consultation (not a permit)

Not a legal gate, but it decides whether a deployment is welcome and whether SHPD, DAR and the
host agree.

- **Heʻeia.** The area has active Native Hawaiian stewardship of the **Heʻeia fishpond** and the
  **Heʻeia NERR** ⚠️. A short introductory meeting with the NERR research coordinator and the
  fishpond stewards, before any filing, is both respectful and practical.
- **Private owners** for O1/O4: written permission, plus liability and insurance terms.
- **UH/HIMB:** an agreement for hosting, data sharing and liability.

---

## 7. Every form and document in one list

| Document | For | Who prepares | Source |
|---|---|---|---|
| One-page **project description** (purpose, platform, dates, removal) | Everyone | John | [§1](#1-what-we-would-be-putting-in-the-water) |
| **Site map** with GPS, depth and bottom type | Corps, OCCL, SHPD, DAR | John | SCO-96, SCO-17 |
| **Plan view and cross-section drawing** of the buoy and mooring | Corps, OCCL | John | ADR-0004, mechanical CAD |
| **Anchor and line spec** (type, weight, footprint area, line length, scope) | Corps, OCCL, PIRO | John | SCO-17, SCO-72 |
| **Removal and restoration plan** | Corps (NWP 5), OCCL | John | NWP 5 text |
| **Species, entanglement and EFH statement** | Corps, PIRO, OCCL | John | [§6.3](#63-esa-efh-and-mmpa-noaa-fisheries) |
| **Materials list** (antifouling, battery chemistry, lead) | Corps, DOH, DLNR | John, Isabella | facts.md |
| **ENG Form 6082** (NWP pre-construction notification) | Corps | John | [§6.1](#61-us-army-corps-of-engineers) ⚠️ |
| **ENG Form 4345** (individual permit, if needed) | Corps | John | [§6.1](#61-us-army-corps-of-engineers) ⚠️ |
| **EFH Assessment Worksheet** | Corps, PIRO | John | [NOAA EFH](https://www.fisheries.noaa.gov/pacific-islands/consultations/essential-fish-habitat-consultations-pacific-islands) |
| **ESA species list** for the site | Corps, PIRO | John | [PIRO](https://www.fisheries.noaa.gov/pacific-islands/endangered-species-conservation/esa-consultations-pacific-islands) |
| **SHPD §6E / §106 submittal** via HICRIS | SHPD | John | [SHPD forms](https://dlnr.hawaii.gov/shpd/review-compliance/forms) |
| **Site Plan Approval (SPA) application** | OCCL | John | [SPA form](https://dlnr.hawaii.gov/occl/files/2024/08/SPA-2024.docx) |
| **Marine Waters CDUA** / **CDUA** (fallback) | OCCL | John | [Marine CDUA](https://dlnr.hawaii.gov/occl/files/2024/08/Marine-CDUA-2024.docx) |
| **Right-of-entry / revocable permit request** | Land Division | John | [§6.7](#67-dlnr-land-division-right-of-entry-and-revocable-permit) |
| **DAR Special Activity Permit** (Google Form + Request Spreadsheet) | DAR | John (with SCU as the institution) | [§6.8](#68-dlnr-dar-special-activity-permit) |
| **HEPA exemption confirmation or EA** | DLNR | DLNR | [§6.12](#612-environmental-review-hepa-chapter-343) |
| **CZM federal consistency** (if no general concurrence) | Office of Planning | Corps / John | [§6.4](#64-coastal-zone-management-federal-consistency) |
| **DOH individual 401 pre-filing request** (only if leaving NWP 5) | DOH | John | [§6.2](#62-section-401-water-quality-certification-hawaii-doh) |
| **CG-2554** (only if USCG says so) | USCG D14 | John | [§6.10](#610-us-coast-guard) |
| **Host authorization / letter of support** (CRIMP2, HIMB, NERR) | Corps, OCCL, Land Division | Host | [§5 O6](#o6-connect-to-an-existing-authorized-site) |
| **Landowner consent** (O1, O4) | Owner | John | [§5 O4](#o4-hung-from-someones-property-house-pier-dock-seawall-piling) |
| **Liability / insurance** statement | Land Division, hosts | SCU | ❓ |
| **Annual or final report** | DAR, Corps removal | John | SAP and NWP 5 |

---

## 8. Does the buoy design need approval?

You asked whether the actual design of the buoy might need to be approved.

- **No agency in this document approves a research buoy's design.** The Corps (NWP 5), OCCL, DAR,
  DOBOR and USCG each review **what the thing does to the bay and navigation**, not whether it is
  well engineered ⚠️. None of the NWP 5 text, the OCCL application page, or the DAR page asks for a
  stamped engineering package.
- **What they do ask for:** drawings showing size, location and footprint; the **anchor** (type,
  weight, area of bottom covered); the **line** (material, length, scope); **materials** that can
  leach (antifouling, lead, battery); **marking**; **entanglement risk**; and the **removal plan**.
  ADR-0004 and [facts.md](../hub/facts.md) already hold most of this.
- **What could change the design.** A "no" on **lead ballast** ([SCO-136](https://linear.app/scout1/issue/SCO-136)),
  a rule against **copper** (we already chose copper-free), a line-length or scope limit, or a
  required **marking scheme**. Ask these first, before the design freezes.
- **One real exception: individual permits.** If we land in O9, drawings need to be detailed and
  the Corps may request alternatives analysis; that is a paperwork cost, still not a design
  certification.

---

## 9. Schedule and owners

Working backward from the **2027-03-22 Hawaii live deployment** and the project phases (Phase 4
field prototype 2027-01-18 to 02-26; Phase 5 Hawaii prep 03-01 to 03-19).

| When | What | Owner |
|---|---|---|
| **2026-10-08 to 10-16** | Email Chris Sabine (CRIMP2 host) and HIMB; send the Corps, DOBOR, OCCL, DAR, USCG D14 the question bank ([§10](#10-question-bank-get-it-in-writing)) | John |
| **by 2026-10-31** | Read WQC1100 and the final Honolulu NWP regional conditions; read HAR 13-256-73; decide O2/O3 plan | John |
| **by 2026-11-15** | Host decision (O6) and written determinations back; pick O6 vs O8 | John, host |
| **2026-11-16 to 12-01** | Assemble the document package ([§7](#7-every-form-and-document-in-one-list)); SHPD HICRIS account | John |
| **by 2026-12-01** | **File** the Corps PCN (if needed), the OCCL SPA, the Land Division request | John |
| **2026-12 to 2027-02** | Corps ESA/EFH/SHPD consultation clocks; OCCL SPA (under 30 days once complete); Land Board calendar | agencies |
| **2027-01-18 to 02-26** | **Phase 4: O2/O3 attended test** (or O4/O5 sensor test) under written "no permit needed" determinations | John |
| **by 2027-02-26** | Permits in hand or the fallback chosen (O6 or O3 attended deployment) | John |
| **2027-03-22** | Deploy | John, David, Isabella |

**Decision gate 2026-11-15.** If no host and no permit path looks possible by then, the fallback is
**O2/O3 attended deployments** for the live period, with sensors recording and the shore station
receiving. That still satisfies the MVP ([2026-10-07 definition](../hub/decision-log.md)).

---

## 10. Question bank: get it in writing

For each agency, ask these, state the exact plan, and ask for the answer **in an email or
letter** we can file. A written "not required" is the only protection we have.

**All questions use this plan summary:** *A 7–8 kg, 8.5 in scientific buoy (water temperature and
turbidity, 915 MHz LoRa), 2–8 m depth, Kāneʻohe Bay, at [lat/long]. Options: (a) lowered from an
attended boat for hours, (b) floated tethered to an attended boat for hours, (c) connected to an
existing authorized mooring for [weeks/months], (d) our own 3/8 in nylon line and a single
mushroom anchor on sand next to, not on, coral, for [duration]. Copper-free antifouling; lithium
cells sealed inside; about 2.6 kg lead ballast; removed at the end.*

| Agency | Questions |
|---|---|
| **Corps Honolulu** | (1) Does (a) or (b) need anything? (2) Is NWP 5 available for (c) and (d)? (3) Do we need a PCN, and which general conditions trigger it? (4) Final Honolulu regional conditions? (5) Is a state CZM concurrence needed? (6) Does lead ballast or a mushroom anchor change the answer? (7) Timeline and a pre-application meeting? |
| **OCCL** | (1) Is (a)/(b) exempt (A)? (2) Is (c)/(d) a (B) SPA, or (C)/(D)? (3) May we use the same SPA route as OA 24-50 (Aqualink buoy)? (4) Required attachments? (5) Determination letter? |
| **Land Division (Oʻahu)** | (1) ROE or RP for (c)/(d)? (2) Fees, insurance, Land Board timeline? (3) Can we be added to a UH or NERR authorization? |
| **DAR** | Does a non-collecting instrument buoy at [site] need a SAP? Is [site] a regulated area? Can we be named on a host's SAP? |
| **DOBOR** | (1) Is a research buoy a "vessel," a "raft/platform," or neither under HAR 13-256 and 13-235? (2) Is any permit needed for (a)/(b)? (3) Rules for (d) in the bay? (4) Any restriction near the sandbar, areas A–D, the refuge? |
| **USCG D14** | CG-2554 needed, or Local Notice to Mariners and marking only? Required marking? |
| **PIRO** (via the Corps) | Species list for the site; is an EFH consultation needed for a small anchor on sand? |
| **SHPD** | Is a survey needed for an anchor footprint at [site]? |
| **Host (Sabine / HIMB / NERR)** | May we attach to your mooring or site? Under whose authorization? What liability, insurance, data-sharing and timing terms? |

### Draft emails

**To Chris Sabine and (cc) Hannah Barkley**

> Subject: Test deployment of a small student-built coral-reef monitoring buoy near CRIMP2
>
> Dr. Sabine, I'm John Ryan Myrdal, a Santa Clara University senior-design student on the S.C.O.U.T.
> project. Hannah Barkley suggested we contact you before planning a test deployment of a small,
> low-cost solar/battery monitoring buoy (water temperature and turbidity, LoRa telemetry) in
> Kāneʻohe Bay, possibly near CRIMP2, between March and May 2027. We would not interfere with your
> mooring or its data; we want to understand (1) whether an addition near or on your site is
> acceptable, (2) under what authorization it could be deployed, and (3) what you would need from
> us (insurance, data-sharing, coordination). I can send a one-page description and drawings.
> Could we find 20 minutes to talk?

**To the Corps Honolulu Regulatory Branch**

> Subject: Pre-application question — scientific buoy, Kāneʻohe Bay (NWP 5)
>
> [Plan summary above.] We believe NWP 5 may apply. Could you confirm (1)–(7) [from the table]
> and tell us whether a PCN is required, and send the final Honolulu District regional conditions
> for the 2026 NWPs? We would like a written determination for the attended, recovered-same-day
> tests and a pre-application meeting for the moored option.

(OCCL, DOBOR, USCG, DAR emails use the same plan summary plus their row of the table.)

---

## 11. Risks and open items

| Item | Why it matters | Next step |
|---|---|---|
| Final Honolulu regional conditions not retrieved ❓ | Decide whether a PCN is required | Ask the Corps; read the final notice |
| HAR 13-256-73 text not read ❓ | The Kāneʻohe Bay anchoring and buoy rules | Read the DOBOR PDF |
| OCCL letter code for a research buoy ❓ | A $50 SPA versus a CDUP with hearing | OCCL determination request |
| Whether a research buoy is a "vessel" under DOBOR ❓ | Decides DOBOR permits | Written DOBOR answer |
| WQC1100 conditions unread ❓ | Copper, discharges, notification | Read the PDF |
| Is Kāneʻohe Bay inside the humpback sanctuary? ❓ | Extra consultation and marking | Check the sanctuary map |
| Lead ballast acceptability ❓ | Could change the ballast design | Ask Corps, DAR, PIRO ([SCO-136](https://linear.app/scout1/issue/SCO-136)) |
| ROE insurance and liability ❓ | SCU may have to provide cover | Ask SCU risk management |
| Student status: the SAP applicant must be tied to an institution | SCU is the institution; advisor co-sign may help | Ask Jes Kuczenski / Navid |
| Everything marked ⚠️ in this document | From summaries and precedents | Confirm at filing time |

---

## 12. Sources

| Topic | Link |
|---|---|
| 2026 Nationwide Permits (final rule) | [Federal Register 2026-00121](https://www.govinfo.gov/content/pkg/FR-2026-01-08/pdf/2026-00121.pdf) |
| Honolulu District regulatory program | [Corps Honolulu Regulatory](https://www.poh.usace.army.mil/Missions/Regulatory/) (blocks automated fetching) |
| Proposed Honolulu 2026 regional conditions | [Public notice, 2025-06-18](https://www.deq.gov.mp/assets/news-docs/poh-public-notice-proposed-rule-2026-nwps-and-poh-proposed-reg-conditions-18jun25.pdf) |
| Hawaii blanket 401 WQC1100 | [DOH page](https://health.hawaii.gov/cwb/permitting/section-401-wqc/blanket-section-401-wqc/), [PDF](https://health.hawaii.gov/cwb/files/2025/12/WQC1100.FNL_.25.signed_by_USACE-POH.pdf) |
| ESA consultations, Pacific Islands | [NOAA Fisheries PIRO](https://www.fisheries.noaa.gov/pacific-islands/endangered-species-conservation/esa-consultations-pacific-islands) |
| Essential Fish Habitat, Pacific Islands | [NOAA Fisheries EFH](https://www.fisheries.noaa.gov/pacific-islands/consultations/essential-fish-habitat-consultations-pacific-islands) |
| Sanctuary permits | [HIHWNMS science](https://hawaiihumpbackwhale.noaa.gov/science/) |
| OCCL application process and forms | [DLNR OCCL](https://dlnr.hawaii.gov/occl/application-process/) |
| Conservation District land uses | [HAR 13-5-24](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-5-24), [HAR 13-5-22](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-5-22) |
| Proposed HAR 13-5 amendments (2026) | [BLNR notice](https://dlnr.hawaii.gov/wp-content/uploads/2026/06/Notice-K-1-BLNR-HRS-Chapter-13-5-June-12-2026.pdf) |
| DLNR exemption lists (precedents) | [Sept 2024](https://files.hawaii.gov/dbedt/erp/List_Ex_Notice/2024-10-08-SOH-DLNR-List-of-Exemptions-Sept-2024.pdf), [Mar 2025](https://files.hawaii.gov/dbedt/erp/List_Ex_Notice/2025-04-08-SOH-DLNR-List-of-Exemptions-March-2025.pdf), [Aug 2023](https://files.hawaii.gov/dbedt/erp/List_Ex_Notice/2023-09-08-SOH-DLNR-List-of-Exemptions-Aug-2023.pdf) |
| DAR Special Activity Permit | [DAR SAP](https://dlnr.hawaii.gov/dar/?p=1023) |
| DOBOR anchoring and mooring | [HAR 13-235-9](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-235-9), [HAR 13-235-35](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-235-35), [HAR 13-256-13](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-256-13), [HAR 13-256-73.11](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-13-256-73-11) |
| DOBOR rules compilation | [HAR 13-256 PDF](https://dlnr.hawaii.gov/dobor/files/2025/04/13-256_250402.pdf) |
| Private aids to navigation | [CG-2554](https://media.defense.gov/2017/Oct/16/2001827524/-1/-1/0/CG_2554.PDF), [PATON guide (D13)](https://www.pacificarea.uscg.mil/Portals/8/District_13/dpw/docs/patonguide.pdf) |
| Historic preservation | [SHPD review process](https://dlnr.hawaii.gov/shpd/programs/review-compliance/hrs-6e-8-6e-42-review-process/) |
| CZM federal consistency | [Hawaii Office of Planning](https://planning.hawaii.gov/?p=548) |
| CRIMP2 mooring | [PacIOOS](https://www.pacioos.hawaii.edu/water/wqbuoy-crimp2), [IOOS catalog](https://data.ioos.us/dataset/mapco2-buoy-kaneohe-bay-crimp2-oahu-hawaii) |
| Coconut Island refuge | [IOOS record](https://data.ioos.us/dataset/hawaii-marine-laboratory-refuge-coconut-island-hawaii) |
| NWP 5 used for Kona buoys | [DOE CX-035198](https://www.energy.gov/sites/default/files/2026-03/CX-035198.pdf) |
