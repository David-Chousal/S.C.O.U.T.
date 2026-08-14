# Fernandes Carvalho et al. 2021 — Redundant transmission for sporadic critical LoRa messages

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`carvalho-2021`](../sources.md#link-reliability--fec) · DOI [10.1109/JSYST.2020.3015274](https://doi.org/10.1109/JSYST.2020.3015274) · 🔒 copyrighted (IEEE)

**What it says.** Proposes **LoRa-REP**, a redundant-transmission scheme for *sporadic critical* messages.
By sending copies of a message (spread across resources), the measured **failure probability drops to
2.5%, from more than 78%** in a single-transmission baseline — a large resilience gain for the exact case
of an infrequent packet that must land.

**Why it matters to SCOUT.** SCOUT's daily 82-byte packet *is* a sporadic message you want delivered, and
this is the highest-leverage reliability lever for it. Because the duty budget at one packet per day is
almost entirely unused, SCOUT can afford **blind repetition** — send the day's packet two or three times
at spaced intervals (optionally on different SFs) — and collapse the loss probability without any
acknowledgment machinery. It is the application-layer complement to PHY FEC ([`ali-2024`](ali-2024-lpwan-hamming-fec.md)).

**Caveat / how to use it — the store-and-forward reframe.** SCOUT keeps the **full record on local flash**,
so a lost daily packet costs *timeliness, not data* — the archive is recovered at servicing. That makes the
reliability requirement **soft**: size redundancy to an acceptable staleness, not to zero loss. Also,
LoRa-REP is LoRaWAN-specific (virtual nodes, ACK/downlink); SCOUT's raw P2P link should take only the
*idea* (blind repetition), and deliberately avoid confirmed/ACKed retransmission, which invites the
retransmission "avalanche" [`adelantado-2017`](adelantado-2017-lorawan-limits.md) warns about and burns
energy on downlink an unattended buoy doesn't need.
