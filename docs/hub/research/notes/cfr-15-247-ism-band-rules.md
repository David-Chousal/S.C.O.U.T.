# 47 CFR §15.247 — the rule that governs S.C.O.U.T.'s radio

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`cfr-15-247`](../sources.md#regulatory--rf-compliance) · [eCFR](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15/subpart-C/subject-group-ECFR2f2e5828339709e/section-15.247) · [Cornell LII](https://www.law.cornell.edu/cfr/text/47/15.247) · 🔓 public law

**What it says.** Unlicensed operation in 902–928 MHz is permitted by **exactly two routes**, and a
device must satisfy one of them. Quoted verbatim:

- **(a)(1)(i) — frequency hopping:** *"if the 20 dB bandwidth of the hopping channel is less than
  250 kHz, the system shall use at least 50 hopping frequencies and the average time of occupancy on
  any frequency shall not be greater than 0.4 seconds within a 20 second period"*
- **(a)(2) — digital modulation:** *"The minimum 6 dB bandwidth shall be at least 500 kHz."*

Supporting limits: **(b)(2)** caps power at 1 W with ≥50 hopping channels, 0.25 W below that;
**(e)** caps power spectral density at *"8 dBm in any 3 kHz band"*; **(f)** permits *hybrid* systems
combining both techniques, still under the 0.4 s occupancy limit.

**Why it matters to S.C.O.U.T.** The buoy transmitted on a **single fixed 915.0 MHz channel at
125 kHz and +14 dBm**, which satisfies neither route — 125 kHz is below the digital-modulation
minimum, and one channel is not fifty. This was found in the [SCO-19 investigation](../../research/fcc-915-mhz-compliance.md)
and fixed by widening to BW500, which takes route (a)(2). PSD was never the binding constraint:
+14 dBm across 500 kHz computes to −8.2 dBm/3 kHz, far under the 8 dBm cap.

The **0.4 s dwell limit is the sleeper constraint**, and it only exists on the hopping route. It
couples packet size to spreading factor: at SF7 it caps payload near 155 B, at SF9 near 35 B, and at
SF10 a single 30-byte frame no longer fits one dwell at all. Choosing route (a)(2) removes the limit
and with it the cap on SF — which is why the compliant configuration ended up *better* than the
non-compliant one rather than worse.

**Caveat / how to use it.** The intuitive defence — *"we transmit 111 ms per day, we are the politest
device on the band"* — does not work. §15.247 constrains **how the radio is built**, not how
considerately it is used; there is no duty-cycle exemption. The 1% duty cycle people remember is the
**EU ETSI** regime ([`adelantado-2017`](adelantado-2017-lorawan-limits.md)), and it is a restriction
there, not a permission here.

This is a **student team's engineering reading of published law, not legal advice**, and nobody
qualified has confirmed it — see [SCO-19](https://linear.app/scout1/issue/SCO-19). Note also that
§15.247 is about how the device *operates*; whether it must be *certified* is a separate question
answered by [`cfr-15-23`](cfr-15-23-home-built-exemption.md).
