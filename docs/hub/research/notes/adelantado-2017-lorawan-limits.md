# Adelantado et al. 2017 — Understanding the limits of LoRaWAN

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`adelantado-2017`](../sources.md#lora--lpwan-over-seawater) · DOI [10.1109/MCOM.2017.1600613](https://doi.org/10.1109/MCOM.2017.1600613) · 🔒 IEEE (🔓 author preprint [arXiv:1607.08011](https://arxiv.org/abs/1607.08011))

**What it says.** An impartial account of what caps LoRaWAN in practice. The dominant limit in most
regions is the **ISM-band duty cycle** (e.g. 1% in EU 868 MHz), which bounds how much airtime a node may
use per hour; airtime itself grows steeply with spreading factor. Capacity, the aloha-style collision
behavior, and the asymmetry of downlink are the other named limits.

**Why it matters to SCOUT.** This is the theory under SCOUT's "one 82-byte packet per day" decision. A
tiny, infrequent payload is exactly the design that stays comfortably inside any duty-cycle regime and
minimizes energy per bit — it turns a constraint into a feature. It also frames the SF ⇄ range ⇄ airtime
⇄ energy trade the firmware will make when link margin is poor: a higher SF buys range but costs airtime
and battery.

**Caveat / how to use it.** The strict 1% duty cycle is an **EU** rule; the US 915 MHz band SCOUT uses is
governed instead by FCC frequency-hopping / dwell-time rules, so port the *reasoning*, not the EU number.
Confirm the exact US 915 MHz constraint as part of the [RF-compliance open question](../open-questions.md).
