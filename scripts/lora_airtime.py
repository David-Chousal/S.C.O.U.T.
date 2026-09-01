#!/usr/bin/env python3
"""LoRa airtime, duty cycle, and link-budget calculator for the S.C.O.U.T. daily packet.

Backs the numbers in docs/research/fcc-915-mhz-compliance.md so they are reproducible
rather than magic constants. Airtime follows Semtech AN1200.13; sensitivity is the
standard thermal-noise model and is MODELLED, not measured — treat the relative
comparison between configurations as the trustworthy part, not the absolute dBm.

Usage:
    python3 scripts/lora_airtime.py
"""

import math

# LoRa demodulator SNR limits by spreading factor (Semtech SX1276 datasheet).
SNR_LIMIT_DB = {6: -5.0, 7: -7.5, 8: -10.0, 9: -12.5, 10: -15.0, 11: -17.5, 12: -20.0}

NOISE_FIGURE_DB = 6.0
RH_HEADER_BYTES = 4  # RadioHead RH_RF95 prepends to/from/id/flags
SCOUT_PACKET_BYTES = 30  # firmware SCOUT_PACKET_SIZE / shore PACKET_SIZE
FCC_DWELL_MS = 400.0  # 47 CFR 15.247(a)(1)(i), hopping systems only
TX_CURRENT_MA = 120.0  # RFM95 at +14 dBm, datasheet typical


def airtime_ms(payload_bytes, sf, bw_hz, coding_rate=4, preamble_symbols=8, crc=True):
    """Time on air in milliseconds. coding_rate 1..4 maps to 4/5..4/8."""
    t_sym = (2 ** sf) / bw_hz * 1000.0
    low_data_rate_optimize = 1 if t_sym > 16.0 else 0
    numerator = 8 * payload_bytes - 4 * sf + 28 + (16 if crc else 0)
    denominator = 4 * (sf - 2 * low_data_rate_optimize)
    payload_symbols = 8 + max(math.ceil(numerator / denominator) * (coding_rate + 4), 0)
    return (preamble_symbols + 4.25) * t_sym + payload_symbols * t_sym


def sensitivity_dbm(sf, bw_hz):
    return -174 + 10 * math.log10(bw_hz) + NOISE_FIGURE_DB + SNR_LIMIT_DB[sf]


def max_payload_within_dwell(sf, bw_hz, dwell_ms=FCC_DWELL_MS):
    """Largest SCOUT payload whose airtime fits one FCC dwell period. 0 if none."""
    for payload in range(251, 0, -1):
        if airtime_ms(payload, sf, bw_hz) <= dwell_ms:
            return payload - RH_HEADER_BYTES
    return 0


def main():
    on_air = SCOUT_PACKET_BYTES + RH_HEADER_BYTES
    baseline = sensitivity_dbm(7, 125_000)

    print(f"S.C.O.U.T. daily packet: {SCOUT_PACKET_BYTES} B "
          f"(+{RH_HEADER_BYTES} B RadioHead header = {on_air} B on air), 1x/day, 3 blind repeats\n")

    shipped = sensitivity_dbm(12, 500_000)
    print("SHIPPED — ModemConfig {0x98, 0xC4, 0x04}: BW500 / SF12 / CR4-8 @ +11 dBm")
    print(f"  airtime {airtime_ms(on_air, 12, 500_000):.0f} ms   "
          f"sensitivity {shipped:.1f} dBm (modelled)")
    print("  Compliant via 15.247(a)(2) digital modulation, and the mode the module's")
    print("  modular grant (FCC ID 2ASEORFM95C) is certified in: equipment class DTS.\n")

    print("WAS, until 2026-09-01 — {0x78, 0x74, 0x04}: BW125 / SF7 / CR4-8 @ +14 dBm")
    print(f"  airtime {airtime_ms(on_air, 7, 125_000):.0f} ms   "
          f"sensitivity {baseline:.1f} dBm (modelled)")
    print("  NOT compliant: 125 kHz is below the 500 kHz digital-modulation minimum, a")
    print("  single fixed channel is not the >=50-channel hopping route, and +14 dBm")
    print("  exceeded the grant's certified 11.6 dBm.")
    print(f"  Net change in link budget: {baseline - shipped - 3:+.1f} dB "
          f"({shipped - baseline:+.1f} dB sensitivity, -3 dB power to stay inside the grant)\n")

    print("Option A (REJECTED) — keep BW125, add hopping. Also outside the modular grant,")
    print("which is certified DTS, not FHSS: adopting it would need new certification.")
    for sf in (7, 8, 9, 10, 11, 12):
        t = airtime_ms(on_air, sf, 125_000)
        cap = max_payload_within_dwell(sf, 125_000)
        verdict = "ok" if t <= FCC_DWELL_MS else "EXCEEDS DWELL"
        print(f"  SF{sf:<2}  airtime {t:>7.0f} ms  [{verdict:>13}]  max payload {cap:>3} B")

    print("\nOption B — switch to BW500 (digital modulation route, no hopping, no dwell limit):")
    print(f"  {'config':>12} {'sensitivity':>12} {'vs today':>10} {'airtime':>9} {'range':>7}")
    for sf in (7, 9, 10, 11, 12):
        s = sensitivity_dbm(sf, 500_000)
        delta = s - baseline
        t = airtime_ms(on_air, sf, 500_000)
        print(f"  BW500/SF{sf:<2} {s:>10.1f} dBm {delta:>+9.1f} {t:>7.0f} ms "
              f"{10 ** (-delta / 20):>6.2f}x")

    print("\nDuty cycle and energy (3 blind repeats, once per day):")
    for label, sf, bw in (("today  BW125/SF7", 7, 125_000), ("option BW500/SF12", 12, 500_000)):
        t = airtime_ms(on_air, sf, bw) * 3
        mah_year = TX_CURRENT_MA * (t / 1000) / 3600 * 365
        print(f"  {label}: {t:>7.0f} ms/day = {t / 864_000_00 * 100:.6f}%  ->  {mah_year:.1f} mAh/year")


if __name__ == "__main__":
    main()
