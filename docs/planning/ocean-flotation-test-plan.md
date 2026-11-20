# Ocean Flotation Test Plan

> **Summary** — The plan for the first real-seawater test of the S.C.O.U.T. float
> ([SCO-183](https://linear.app/scout1/issue/SCO-183), Layered Test Protocol stage 12): what it must
> show, which site and access route, every permission it needs and its status, the safety plan, the
> tether and retrieval plan, a January date window and a go or no-go checklist. **Drafted 2026-11-20.**
> The plan is complete; the **host's written yes and the January dates are not yet agreed**, and
> they are the gates to running it ([SCO-195](https://linear.app/scout1/issue/SCO-195), [SCO-306](https://linear.app/scout1/issue/SCO-306),
> [SCO-184](https://linear.app/scout1/issue/SCO-184)). Dates and limits marked *proposed* need the team's
> confirmation. Not legal advice: nothing here replaces a host's or agency's written answer.
>
> Part of the [planning docs](team-timeline.md). Rig and steps:
> [Dock-Hung Test Rig and Procedure](../engineering/dock-hung-test-rig-procedure.md)
> ([SCO-249](https://linear.app/scout1/issue/SCO-249)). Route and permits: [Deployment Strategy](deployment-strategy.md),
> [dock-test hosts and permissions](../research/monterey-santa-cruz-dock-test-hosts-and-permissions.md).

---

## 1. Where it stands

| Gate | Status on 2026-11-20 |
|---|---|
| What the test proves | Defined in [§2](#2-what-the-test-must-show) |
| Rig, tether, retrieval | **Done**: [procedure](../engineering/dock-hung-test-rig-procedure.md) |
| Safety plan | **Done** in [§7](#7-safety-plan); the SCU hazard form is not yet updated for the site |
| Site | **Not chosen.** Ranked candidates in [§3](#3-site-and-access), no host has given a written yes |
| Permissions and permits | Researched; the host's yes is the real gate ([§4](#4-permission-and-permits)). Agency written answers are not filed in the repo |
| Float and unit | Test Assembly 10 is **not printed or weighed** ([SCO-308](https://linear.app/scout1/issue/SCO-308)); the integrated bench test is due 2026-12-04 ([SCO-182](https://linear.app/scout1/issue/SCO-182)) |
| Date | January window proposed in [§8](#8-calendar); not agreed with the host or the team |

## 2. What the test must show

Stage 12 of the [Layered Test Protocol](../engineering/layered-test-protocol.md) says the float "floats at the
modelled waterline in open water; self-rights; no leaks." The dock week adds what a bin cannot:

| Question | Why a dock is the right place |
|---|---|
| Does the sealed unit stay dry in real seawater for a week, with wake and temperature swings? | Bench soaks are still water; RR-23 failed a seal in 2026-11 |
| Does the float ride at the modelled waterline and stay upright with the sensor pod under it? | The model is untested in open water |
| Does the line, bridle and standoff survive tide, wake and chafe? | Not testable in a bin |
| Does the LoRa link work from a real dock to a shore station on land? | Range and loss at the water surface are unmeasured |
| What does a week of fouling and corrosion do? | Informs the Hawaii coating and the cleaning schedule |

**This is a systems and survivability test, not data collection.** Readings from Monterey or Santa
Cruz are real seawater readings but say nothing about coral-reef health
([Deployment Strategy](deployment-strategy.md), rule 1). Pass marks are in
[§9 of the procedure](../engineering/dock-hung-test-rig-procedure.md#9-pass-marks-proposed-to-be-confirmed-before-the-first-run)
and are written before the run.

## 3. Site and access

**Route (decided 2026-10-16): path B.** Hang from a structure that already has authorization. No
anchor of our own, no seabed contact.

### 3.1 Ranked options

| Rank | Option | Why | Open |
|---|---|---|---|
| 1 | **A host's dock, hung** (UC Santa Cruz Long Marine Laboratory first, then Santa Cruz Port District, Monterey Harbor, Moss Landing) | Matches the researched route, lowest permit load, no vessel needed | No host has said yes. Monterey Harbor replied with a formal process and a fee: about $250 to review and $250 to proceed (2026-10 meetings). No named Long Marine Lab contact |
| 2 | **Hung from a yacht-club or private dock**, through a member or the board | A private owner can say yes quickly | Neither Santa Cruz nor Monterey yacht club site could be read; a club on a city dock still needs the city's yes |
| 3 | **Tethered to an attended boat** (Monterey boat contacts, [SCO-306](https://linear.app/scout1/issue/SCO-306)) | A different access route if no dock says yes; tests the free-float behaviour | Boat, skipper and insurance unknown; more weather and safety exposure |
| 4 | **Pool test** (the SCU pool, [SCO-143](https://linear.app/scout1/issue/SCO-143)) as a fallback, not a substitute | Fresh water, no permit, tests submersion, communication and the rig | Not seawater, so it cannot meet stage 12; pool access not yet requested |

**Decision rule:** take the first option whose host has answered in writing with dates, a named
cleat or rail and a contact. Do not wait for the first choice if option 2 or 3 answers first.

### 3.2 Pier or boat

| | Pier or dock | Attended boat |
|---|---|---|
| Needs | Host's yes, a cleat or rail, a dock with a hand-haul height | Boat owner's yes, a skipper, insurance |
| Test fit | The V1 rig; most repeatable | Free float, closer to the Hawaii boat tether (O3) |
| Risk | Dock rules written for vessels | Sea state, boat motion, more people on the water |
| Use | **The required test** | Optional second run |

## 4. Permission and permits

The dock owner's permission is the real gate. The agencies are most likely light for a small,
attended, unanchored, discharge-free buoy, **but none has said so in writing yet**, per the
[hosts research](../research/monterey-santa-cruz-dock-test-hosts-and-permissions.md) (read 2026-10-21).

| Layer | Needed? | What is known | Status |
|---|---|---|---|
| **Dock owner or operator** | **Yes, always** | Written yes: dates, cleat or rail, approver, contact | Not received |
| Harbor ordinance | Likely, for any object left in a harbor | Whether an unmanned instrument counts as a vessel is unread | Ask the harbormaster |
| Insurance | Likely asked | SCU coverage for a student project in a public harbor is not recorded | Ask SCU Risk Management |
| Monterey Bay National Marine Sanctuary | Probably not | The permit coordinator said (2026-10-16) tethered monitoring buoys likely need no permit; get it in writing | Reply naming the dock needed |
| US Army Corps, Section 10 | Unclear | A temporary buoy tied to an existing dock is not obviously a "structure" | Written answer wanted |
| US Coast Guard, private aids | Probably not | A research buoy inside a marina is not marking a channel; ask whether it needs marking or notice | Written answer wanted |
| California Coastal Commission | Unknown | No result addressed temporary floating objects at a dock | Written answer wanted |
| SCU hazard assessment | **Yes** | Off-campus sites must be on the form and approved by the faculty advisor | Add the site and the safety plan (§7) |
| FCC | Handled | 915 MHz at +14 dBm; the adopted configuration | Confirm the bench build uses it |

**Discrepancy to settle:** [SCO-222](https://linear.app/scout1/issue/SCO-222) (written agency answers) is
Done in Linear since 2026-11-13, but no agency reply is filed in the repo. Either file the answers
and update the hosts research, or reopen the ticket.

## 5. Access, tether and retrieval

- **Rig:** the float hangs from a 3/8 in twisted nylon line off the host's cleat, with a standoff
  and a chafe guard. A floating dock is preferred because the line then needs no tide allowance. See
  the [procedure](../engineering/dock-hung-test-rig-procedure.md#3-sizing-the-line-for-the-tide).
- **Retrieval:** a stated way to remove it in under 30 minutes on request, practised on day 0
  ([procedure §10](../engineering/dock-hung-test-rig-procedure.md#10-retrieval-planned-or-on-request)).
- **Boat and prop risk:** the line is twisted nylon so a crossing propeller fouls rather than cuts
  it ([decision log 2026-09-08](../hub/decision-log.md)). Choose a dock with no boats moving close to
  the float, and keep the float away from the fairway and transient berths.

## 6. People and logistics

| Item | Plan |
|---|---|
| Team | Minimum two on the dock for every deployment, check and retrieval; John Ryan leads; a second member or a trusted adult joins. Never alone |
| Contact | One named host contact with a phone number on the tag and in this plan before day 0 |
| Shore station | On land within radio range of the dock; John Ryan and David set it up; the buoy never transmits without an antenna |
| Transport | The unit travels sealed in a padded case; the lithium cells are declared to the host in writing |
| Records | Test record from the [template](../engineering/test-record-template.md), pass marks written first |

## 7. Safety plan

| Hazard | Control |
|---|---|
| Falling in | Life jackets on everyone on the dock; two or more people; stay behind the dock edge line; no work in the dark |
| Weather and sea | Do not deploy or check in a small-craft advisory or surge that slams the float against the dock; limits proposed in the [procedure §8](../engineering/dock-hung-test-rig-procedure.md#8-daily-check-and-abort-rules) |
| Lithium primary cells | Sealed, no charging, disclosed to the host; never opened on the dock |
| Marine mammals and birds | Sea lions rest on marina docks; keep clear, no loose slack, leave an animal alone and call the host |
| Boats and props | Siting away from traffic; twisted nylon line; a cut-and-release option |
| Entanglement | Short tether, no loose slack, daily check |
| Pinch and lift | Lift by the bridle ring with a boat hook or by hand with gloves; two people for the unit |
| Theft and vandalism | Cable lock option or accept the loss; photograph before and after |
| Emergency | 911 for a person in danger; the host contact and the harbor office for everything else; the nearest hospital and the dock address written on the hazard form |

The SCU [Student Project Hazard Assessment](dry-lab-hazard-assessment-form.pdf) needs the dock
address, the supervision plan and the emergency procedure, approved by the faculty advisor before
day 0 (tracked in [SCO-211](https://linear.app/scout1/issue/SCO-211) and the SCO-222 checklist).

## 8. Calendar

Working back from the milestones in [Linear](https://linear.app/scout1) as read on 2026-11-20. **Proposed.**

| When | Step | Owner | Issue |
|---|---|---|---|
| Now | Host emails sent or followed up: UCSC Long Marine Lab, Santa Cruz Port District, Monterey Harbor; Monterey boat contacts | John Ryan | [SCO-195](https://linear.app/scout1/issue/SCO-195), [SCO-306](https://linear.app/scout1/issue/SCO-306) |
| By 2026-12-04 | Integrated bench test passes: electronics in the floating buoy, sensors reading, packet received | John Ryan, Isabella, David | [SCO-182](https://linear.app/scout1/issue/SCO-182) |
| By 2026-12-11 (hard limit) | Float printed, coated and weighed; the 4-week soak started | John Ryan | [SCO-308](https://linear.app/scout1/issue/SCO-308), [SCO-180](https://linear.app/scout1/issue/SCO-180) |
| 2026-12-14 (tentative) | Hawaii slip sensor test starts if the club says yes; John Ryan travels | John Ryan | [SCO-194](https://linear.app/scout1/issue/SCO-194) |
| By 2026-12-18 | Host's written yes filed; hazard form approved; written agency answers filed | John Ryan | [SCO-195](https://linear.app/scout1/issue/SCO-195), [SCO-222](https://linear.app/scout1/issue/SCO-222) |
| **2027-01-11 to 2027-01-22** | **Dock window**: day 0 practice retrieval, 7-day deployment, retrieval, same-week data pull | John Ryan plus one | [SCO-184](https://linear.app/scout1/issue/SCO-184) |
| By 2027-01-29 | Test record filed; register and matrix updated | John Ryan | [SCO-184](https://linear.app/scout1/issue/SCO-184) |

The window ends before SCO-184's due date of 2027-01-29 and leaves a week to re-run after a failure.
The quarter's class schedule and the host's availability are not yet checked against it.

## 9. Budget

| Item | Cost | Note |
|---|---|---|
| Host fee (Monterey Harbor reported about $250 to review and $250 to proceed) | About $500 | Raised in the 2026-10 meetings; **not in the Senior Design grant list**; needs a funding route |
| Rig hardware (line, shackle, ring, chafe guard, fender, tag, lock) | Not recorded | Cost after the dock is named |
| Insurance certificate | Not recorded | SCU Risk Management |
| Travel to the dock | Not recorded | |

## 10. Go or no-go checklist

All must be true before day 0:

- [ ] The host's written yes is on file: dates, cleat or rail, contact, who approves
- [ ] Written agency answers are filed, or the host says they are not needed in writing
- [ ] The SCU hazard form includes the site and is approved by the advisor
- [ ] The unit is complete, weighed and passes the bench test (SCO-182)
- [ ] The tether is built to the dock's measured geometry and tug-tested
- [ ] Pass marks are confirmed and copied into Part A of a new test record
- [ ] Two or three people with life jackets are scheduled
- [ ] Weather and tide are inside the limits; the go decision is written
- [ ] The host contact is reachable by phone

## 11. Open items

| Item | Owner | Issue |
|---|---|---|
| Get one host's written yes and the dock named | John Ryan | [SCO-195](https://linear.app/scout1/issue/SCO-195), [SCO-306](https://linear.app/scout1/issue/SCO-306) |
| Agree the January window with the team and the host | John Ryan, team | [SCO-184](https://linear.app/scout1/issue/SCO-184) |
| Reconcile SCO-222: file the agency answers or reopen | John Ryan | [SCO-222](https://linear.app/scout1/issue/SCO-222) |
| Find a funding route for the host fee | John Ryan, advisors | none yet |
| Print and weigh the float; settle 2.75 kg against 1.1 kg | John Ryan | [SCO-308](https://linear.app/scout1/issue/SCO-308) |
| Ask SCU Risk Management about insurance | John Ryan | none yet |
| Request pool access as the fallback | John Ryan | [SCO-143](https://linear.app/scout1/issue/SCO-143) |
