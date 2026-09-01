# 47 CFR §15.23 — the home-built exemption, and where it stops applying

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`cfr-15-23`](../sources.md#regulatory--rf-compliance) · [eCFR](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15/subpart-A/section-15.23) · 🔓 public law

**What it says.** Equipment authorization is **not required** for devices that are not marketed, are
not constructed from a kit, and are built in quantities of **five or fewer for personal use**. The
rule acknowledges that an individual builder may lack the means to perform compliance measurements,
and asks instead that they *"employ good engineering practices to meet the specified technical
standards to the greatest extent practicable."*

**Why it matters to S.C.O.U.T.** Two questions get conflated and this separates them:

| Question | Answer |
|---|---|
| Must the buoy *operate* within §15.247's limits? | **Yes, always.** §15.23 does not touch this. |
| Must the buoy be *certified* by a test lab? | **No, for the capstone.** One or two non-marketed buoys fit the exemption. |

So the prototype needs no lab report — but it should still be built to the standard, which is exactly
what the [BW500 modem change](../../research/fcc-915-mhz-compliance.md#4-recommendation--adopted-2026-09-01)
does. The exemption removes the paperwork, not the engineering.

**Caveat / how to use it.** **The exemption ends the moment SCOUT is marketed or sold.** With an LLC
([SCO-90](https://linear.app/scout1/issue/SCO-90)), a patent filing
([SCO-95](https://linear.app/scout1/issue/SCO-95)), and a paid data API on the roadmap, full
equipment authorization becomes required. Designing to the rule now is what makes that transition a
filing rather than a redesign.

Two unresolved edges worth flagging before relying on this:

- **"Not constructed from a kit"** — S.C.O.U.T. is assembled from commercial modules (Feather M0,
  RFM95, FeatherWings). Modules are not obviously a "kit", but the team has not confirmed the
  reading.
- **"For personal use"** — a university capstone deployed at a research site is not obviously
  personal use either. If the deployment is institutional, the exemption may simply not apply.

Neither has been checked with anyone qualified. Both belong in the same conversation as
[SCO-19](https://linear.app/scout1/issue/SCO-19)'s faculty/lab confirmation.
