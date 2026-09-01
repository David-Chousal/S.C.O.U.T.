# FCC 915 MHz Compliance for the S.C.O.U.T. LoRa Link

> **Summary** — S.C.O.U.T.'s current radio configuration — a single fixed 915.0 MHz channel,
> 125 kHz bandwidth, +14 dBm, no frequency hopping — does not appear to satisfy either
> compliance route in 47 CFR §15.247. This document sets out the rule, what the firmware does,
> the three ways out, and a recommendation. The recommended fix is a **modem-configuration
> change to 500 kHz bandwidth at a higher spreading factor**, which is compliant *and* improves
> the link budget by ~6.5 dB over today.
>
> **Not legal advice.** This is an engineering reading of the published rules by a student team.
> Confirm with the university's EE faculty or a compliance lab before the Hawaii deployment.
>
> Investigation for [SCO-19](https://linear.app/scout1/issue/SCO-19), 2026-08-31.

---

## 1. What the firmware does today

| Setting | Value | Where |
|---|---|---|
| Frequency | **915.0 MHz, fixed** — set once at init, never changed | [`config.h:48`](../../firmware/src/config.h), [`lora_link.h:24`](../../firmware/src/drivers/lora_link.h) |
| Bandwidth | **125 kHz** | `ModemConfig {0x78, 0x74, 0x04}` → reg 0x1D bits 7–4 = `0111` |
| Coding rate | 4/8 | reg 0x1D bits 3–1 = `100` |
| Spreading factor | **SF7** | reg 0x1E bits 7–4 = `0111` |
| TX power | **+14 dBm** (~25 mW) | [`config.h:49`](../../firmware/src/config.h) |
| Cadence | 1 packet/day, 30 B, ×3 blind repeats | [`scout_link.h`](../../firmware/lib/scout_link/scout_link.h) |

## 2. The rule

47 CFR §15.247 permits unlicensed operation in 902–928 MHz by **two** routes, and a device must
satisfy one of them.

**Route 1 — digital modulation, §15.247(a)(2):**

> "The minimum 6 dB bandwidth shall be at least 500 kHz."

A 125 kHz LoRa signal does not meet this. A compliance testing lab states the position plainly:
a 125 kHz signal alone does not satisfy the digital-modulation route
([`sunfire-lora-fcc`](../hub/research/sources.md#regulatory--rf-compliance)).

**Route 2 — frequency hopping, §15.247(a)(1)(i):**

> "if the 20 dB bandwidth of the hopping channel is less than 250 kHz, the system shall use at
> least 50 hopping frequencies and the average time of occupancy on any frequency shall not be
> greater than 0.4 seconds within a 20 second period"

S.C.O.U.T. uses **one** frequency. Not 50.

A third route, [§15.249](../hub/research/sources.md#regulatory--rf-compliance), permits narrowband
operation without those constraints but at field strengths far below +14 dBm — it is not a viable option at the range this project needs.

**§15.247(f)** allows *hybrid* systems combining hopping and digital modulation, with the same
0.4 s occupancy limit. It does not create a single-channel exemption.

**Conclusion: narrow + loud + stationary is the one combination the band does not allow.**
Breaking any one of those three brings the device into compliance.

### Why the once-a-day cadence does not help

The intuitive defence — "we transmit for 111 ms per day, we are the politest device on the
band" — does not apply. §15.247 constrains **how the radio is built**, not how considerately it
is used. There is no duty-cycle exemption in the US rules; the 1% duty-cycle limit people
remember is the **EU** ETSI regime ([`adelantado-2017`](../hub/research/sources.md#lora--lpwan-over-seawater)),
and it is a restriction there, not a permission here.

This is also why LoRaWAN US915 defines 64 × 125 kHz channels: the protocol hops across ≥50 of
them precisely to satisfy §15.247(a)(1). It also defines 8 × 500 kHz channels, which qualify
under the digital-modulation route instead.

## 3. The three ways out

Airtime computed per [`semtech-an1200-13`](../hub/research/sources.md#lora-phy--radio-engineering); sensitivity modelled as
`-174 + 10·log₁₀(BW) + NF(6 dB) + SNR_limit(SF)`. Payload 34 B (30 B packet + RadioHead's 4-byte
header).

### Option A — keep 125 kHz, add frequency hopping

Compliant if ≥50 channels are used with ≤0.4 s average occupancy per channel per 20 s. The
occupancy limit is trivially met at one packet per day, but it **caps the spreading factor**:

| Config | Airtime | Fits the 400 ms dwell? |
|---|---|---|
| BW125 / SF7 (today) | 111 ms | ✅ |
| BW125 / SF9 | 345 ms | ✅ |
| BW125 / SF10 | 625 ms | ❌ |
| BW125 / SF12 | 2499 ms | ❌ |

**At SF10 and above, a single 30-byte packet cannot fit inside one dwell period.** That closes
off the obvious lever for extending range if [SCO-14](https://linear.app/scout1/issue/SCO-14)
finds the real over-water range too short.

**Cost:** the receiver must know where to listen. The buoy is transmit-only and the shore
station is a separate device, so a hopping sequence has to be shared. Both ends have an RTC and
the transmission window is a fixed daily slot, so a date-derived pseudo-random channel index is
feasible — but it is real firmware work on both sides, plus a resynchronization story for when
the buoy's clock drifts.

### Option B — switch to 500 kHz bandwidth (recommended)

At BW500 the signal meets the §15.247(a)(2) digital-modulation route directly. **No hopping, no
dwell limit, no receiver coordination** — and because the dwell limit disappears, the spreading
factor becomes free to raise:

| Config | Sensitivity | vs today | Airtime | ×3 repeats | Relative range |
|---|---|---|---|---|---|
| BW125 / SF7 *(today, non-compliant)* | −124.5 dBm | — | 111 ms | 333 ms | 1.00× |
| BW500 / SF7 | −118.5 dBm | +6.0 dB worse | 28 ms | 83 ms | 0.50× |
| BW500 / SF10 | −126.0 dBm | −1.5 dB better | 156 ms | 468 ms | 1.19× |
| BW500 / SF11 | −128.5 dBm | −4.0 dB better | 312 ms | 937 ms | 1.58× |
| **BW500 / SF12** | **−131.0 dBm** | **−6.5 dB better** | 559 ms | 1677 ms | **2.11×** |

The naive read of "wider bandwidth means shorter range" is true at fixed SF — BW500/SF7 halves
the range. But raising SF alongside it more than compensates. **BW500 / SF12 is both compliant
and roughly 6.5 dB more sensitive than the current non-compliant configuration**, because SF12's
processing gain (−20 dB SNR limit) outweighs the 6 dB noise-bandwidth penalty.

Airtime rises to ~559 ms per transmission, which is irrelevant here: it is 0.0019% duty cycle,
and the energy cost is under 20 mAh **per year**.

**Cost:** one modem-configuration change at both ends. For BW500 / SF12 / CR4-8 the registers
compute to `ModemConfig {0x98, 0xC4, 0x04}` — *this must be verified on the bench against the
[SX1276 datasheet](../hub/research/sources.md#lora-phy--radio-engineering) before being trusted.* The
SX1276 also has a documented [500 kHz sensitivity erratum](../hub/research/notes/sx1276-errata-500khz.md)
that the receiver must apply.

### Option C — reduce power under §15.249

Compliant, and requires no protocol change, but the field-strength limit is roughly 20 dB below
+14 dBm. That trades away most of the link budget on a project whose entire premise is a
low-power long-range link. **Not viable.**

## 4. Recommendation — adopted 2026-09-01

> **Status: implemented, not yet verified on hardware.** `firmware/src/config.h` and
> `firmware/src/drivers/lora_link.h` now ship `ModemConfig {0x98, 0xC4, 0x04}` = BW500 / SF12 /
> CR4-8. The register values are computed from the SX1276 map and the sensitivity figures below
> are modelled — **neither has been measured.** [SCO-98](https://linear.app/scout1/issue/SCO-98)
> tracks bench verification once Rev A parts arrive; SF11 (`0x1E = 0xB4`) is the documented
> fallback if SF12 misbehaves, and still clears compliance. **TX power was additionally reduced
> from +14 dBm to +11 dBm on 2026-09-01** to stay inside the module's modular grant — see §5.
> Net link budget is ~3.5 dB better than the old configuration (+6.5 dB sensitivity, −3 dB
> power), not the 6.5 dB quoted in the table below.

**Adopt Option B: BW500 with the spreading factor raised to SF11 or SF12.**

It is the only option that resolves the compliance problem *and* improves the link, and it is a
configuration change rather than a protocol redesign. Option A preserves the current modem
settings but costs bidirectional firmware work, adds a clock-sync failure mode, and permanently
caps SF at 9 — which is the wrong constraint to accept on a project that may need range margin
it has not yet measured.

The recommendation is **provisional on two things**: bench verification of the register values
and the achieved sensitivity, and a range re-test, since all sensitivity figures here are
modelled rather than measured. It should be reviewed against
[SCO-14](https://linear.app/scout1/issue/SCO-14) once real over-water numbers exist.

## 5. Does the prototype need certification?

Probably not; the deployed product will.

**47 CFR §15.23** exempts home-built devices from equipment authorization where they are not
marketed, not built from a kit, and built in quantities of five or fewer for personal use. A
three-person capstone building one or two buoys fits. But §15.23 exempts the *authorization
process*, not the technical standards — the builder is still expected to "employ good
engineering practices to meet the specified technical standards to the greatest extent
practicable."

So the capstone prototype does not need a lab test report. It should still be built to the
standards, which is what Section 4 recommends.

**This changes the moment SCOUT is sold or marketed.** With an LLC, a patent filing, and a paid
API on the roadmap ([SCO-90](https://linear.app/scout1/issue/SCO-90),
[SCO-95](https://linear.app/scout1/issue/SCO-95)), the exemption stops applying and full
equipment authorization is required. Designing to the rule now avoids a redesign then.

### Resolved 2026-09-01 — the module does carry a modular grant, and it validates Option B

The Feather M0 RFM95 (PID 3178) uses a shielded RFM95C module holding a **Single Modular
Approval under FCC ID `2ASEORFM95C`** (Shenzhen HOPE Microelectronics), added when Adafruit
revised the board in August 2019. The grant answers the open question above — and answers it in
favour of the change already made:

| Grant fact | Consequence for S.C.O.U.T. |
|---|---|
| **Equipment class: DTS** (Digital Transmission System), Part 15C | The module is certified in the **§15.247(a)(2) digital-modulation** mode — which requires ≥500 kHz. **BW500 is the certified configuration; BW125 was outside it.** |
| Certified conducted power **0.0145 W = 11.6 dBm** | The firmware set **+14 dBm**, ~2.4 dB over. Reduced to **+11 dBm**. |
| Tested antenna: whip at **2.15 dBi**; grant permits "only those antennas tested with the device or similar antennas with equal or lesser gain" | **A higher-gain antenna voids the grant** — including the obvious response to a disappointing range test. |
| "must not be co-located or operating in conjunction with any other antenna or transmitter" | Fine today (one transmitter). Constrains any future GPS/cellular addition — note against [SCO-62](https://linear.app/scout1/issue/SCO-62). |
| Minimum separation **20 cm from all persons** | Trivially satisfied by a moored buoy. |
| End product must be labelled **"Contains FCC ID: 2ASEORFM95C"** | Actionable now — [SCO-103](https://linear.app/scout1/issue/SCO-103). |

**This retroactively strengthens the Option B recommendation and rules Option A out entirely.**
The grant is DTS, not FHSS. Adding frequency hopping would have operated the module in a mode it
is not certified for, voiding the modular approval and requiring full intentional-radiator
certification of the end product. Option A was not merely the worse engineering trade described
in §3 — it was the more expensive *regulatory* choice too, and that was not visible until the
grant was found.

FCC modular-approval rules require the integrator to keep output power and transmission
parameters within the certified limits; failing to do so invalidates the approval. The old
configuration missed on **two** counts — bandwidth mode and power — not one.

## 6. Marine deployment permitting — Hawaii

The second half of [SCO-19](https://linear.app/scout1/issue/SCO-19). Preliminary; needs
confirming with the site contacts.

Deploying an instrumented buoy in Hawaii nearshore state waters appears to involve up to three
authorities:

| Authority | Instrument | When it applies |
|---|---|---|
| **DLNR / DAR** — Division of Aquatic Resources | **Special Activity Permit (SAP)** | Research activity involving aquatic life or gear in state marine waters; issued for up to one year |
| **DLNR / OCCL** — Office of Conservation and Coastal Lands | Additional permit / consultation | Triggered by **placement of in-water structures** on submerged land — explicitly including platforms and instrument structures. DAR refers applicants to OCCL when relevant |
| **US Army Corps of Engineers** | **Section 10** authorization (Rivers and Harbors Act 1899); Nationwide Permit 10 covers mooring buoys | Structures placed in navigable waters |

**The mooring, not the sensing, is what triggers the heaviest process.** ADR-0004's decision to
tie to pre-existing piles rather than drill the sea floor is therefore doubly valuable — it may
avoid a new-structure authorization entirely. The buoy-relay option raised on 2026-08-31, which
attaches to an existing moored buoy, has the same advantage.

**Action:** confirm with the site contacts whether the candidate site sits under an existing
permit that S.C.O.U.T. can be added to. Attaching to someone else's authorized mooring is far
cheaper than obtaining a new one, and permitting timelines are measured in months — this must
start well before spring break, not during Phase 5.

## 7. What this means for the packet ceiling

[SCO-97](https://linear.app/scout1/issue/SCO-97) asks where the daily packet ceiling should come
from. This investigation answers it conditionally:

- **Under Option B** there is no dwell limit, so the ceiling is the LoRa frame limit: 255 B minus
  RadioHead's 4-byte header = **251 B usable**. The current 82 B is arbitrary and could simply be
  raised, or dropped as a constraint.
- **Under Option A** the ceiling is the dwell limit and is a function of SF: ~155 B at SF7, ~78 B
  at SF8, ~35 B at SF9.

Either way, **82 B is not where any real limit sits** — it is the byte-sum of an abandoned
ESP32-C3 packet layout (see [SCO-40](https://linear.app/scout1/issue/SCO-40)). The ceiling should
be re-derived once this decision lands.
