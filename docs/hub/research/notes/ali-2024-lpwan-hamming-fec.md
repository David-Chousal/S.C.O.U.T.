# Ali et al. 2024 — Hamming-coded FEC in LPWAN

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`ali-2024`](../sources.md#link-reliability--fec) · DOI [10.1371/journal.pone.0304386](https://doi.org/10.1371/journal.pone.0304386) · 🔓 open access (PLOS ONE)

**What it says.** Evaluates forward error correction for LPWAN links and quantifies the benefit of block
coding: a **Hamming(7,4)-coded** scheme improves error performance by **>40%** over an uncoded baseline,
correcting bit errors *without any retransmission*. This is the same family of coding LoRa's PHY already
applies through its **coding rate (CR 4/5 … 4/8)** — turning CR up trades a little airtime for several dB
of link margin.

**Why it matters to S.C.O.U.T.** S.C.O.U.T.'s radio (RadioHead `RH_RF95`) exposes the LoRa coding rate directly, so
this is a nearly free reliability dial. Because S.C.O.U.T. transmits **one 30-byte packet per day**, airtime is
abundant and the usual CR-vs-throughput objection doesn't apply — the buoy can run the **strongest coding
rate (4/8)** and simply buy robustness. It's the cheapest reliability lever available and it stacks on top
of the SF choice.

**Caveat / how to use it.** FEC fixes *bit errors within a received frame*; it does nothing for a frame
that is entirely missed (deep fade, buoy asleep, collision). Guarding against a fully lost daily packet is
the job of repetition/redundancy — see [`carvalho-2021`](carvalho-2021-lora-redundancy.md). Treat FEC and
redundancy as complementary layers, and confirm the CR setting and its energy cost against
[`bouguera-2018`](bouguera-2018-lora-energy.md).
