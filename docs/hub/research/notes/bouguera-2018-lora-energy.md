# Bouguera et al. 2018 — Energy consumption model for LoRa/LoRaWAN nodes

> Reading note · part of the [Knowledge Hub](../../README.md) library.
> Source row: [`bouguera-2018`](../sources.md#lora--lpwan-over-seawater) · DOI [10.3390/s18072104](https://doi.org/10.3390/s18072104) · 🔓 open access (MDPI Sensors)

**What it says.** An analytical model of end-device energy per transmission as a function of the parameters
a designer actually controls: **spreading factor, transmit power, and payload size**, plus the sleep/wake
duty structure. The headline dependency: airtime — and therefore energy per packet — rises steeply with
spreading factor, so a higher SF buys range at a real battery cost.

**Why it matters to S.C.O.U.T.** This turns S.C.O.U.T.'s radio choices into numbers the power budget can use. It lets
the team estimate the energy cost of the daily 30-byte packet at a chosen SF *before* hardware exists, and
feeds the still-open **battery and solar sizing** in the EDD. It also quantifies the SF trade the firmware
faces when link margin is poor over saltwater: pushing SF up to reach shore is not free, and the model says
how much it costs.

**Caveat / how to use it.** The model is dominated by the radio; S.C.O.U.T.'s true budget must add the MCU wake,
sensor sampling (incl. the hydrophone), and flash writes — the radio is often *not* the largest consumer in
a sense-heavy node. Use this for the TX line item, then sum the rest. Pairs with
[`adelantado-2017`](adelantado-2017-lorawan-limits.md) (airtime/duty cycle) to close the range ⇄ airtime ⇄
energy loop.
