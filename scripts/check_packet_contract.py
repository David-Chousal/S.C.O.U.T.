#!/usr/bin/env python3
"""CI guard for the firmware ↔ shore packet contract.

The firmware Unity test (`firmware/test/test_packet/test_packet.cpp`) hardcodes a GOLDEN byte
vector; the shore decoder is `shore/scout_shore/packet.py`. Each test alone only checks its own
side — so this script encodes the **canonical reading** with the Python encoder and asserts it
equals the firmware's GOLDEN bytes. If either side's layout drifts, CI fails here.

Keep CANONICAL identical to `golden_reading()` in the firmware test.

It also guards the payload ceiling (SCO-97): the firmware's SCOUT_LINK_PAYLOAD_CEILING_BYTES and
the shore's LORA_PAYLOAD_BUDGET_BYTES must agree, and a ceiling-size frame, timed from the modem
settings actually in `firmware/src/config.h`, must stay under 90% of the firmware's send timeout.
A modem change that breaks that fails here rather than as missed slots in the water.

The settings downlink (SCO-198) is held the same way: the shore's ``downlink.encode`` of a fixed
command must equal the GOLDEN in ``firmware/test/test_downlink``, and the frame must fit the
same 140-byte ceiling. The v2 settings frame (every remote setting at once) is held to
``GOLDEN_SETTINGS`` in the same test file.

The over-the-air update frames (SCO-197) are held to the goldens in ``firmware/test/test_ota``:
the shore's ``ota`` module must rebuild the offer's manifest, the chunk, the ACK and the CONFIRM
byte for byte. The offer's signature is taken from the golden (signing needs a library outside
the standard library); the firmware test checks it against the test public key with Ed25519.

Standard library only. Exit 0 on match, non-zero on drift.
"""

from __future__ import annotations

import math
import pathlib
import re
import sys
from datetime import datetime, timezone

_ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT / "shore"))
sys.path.insert(0, str(_ROOT / "scripts"))

from lora_airtime import PAYLOAD_CEILING_BYTES, airtime_ms  # noqa: E402
from scout_shore import downlink, ota  # noqa: E402
from scout_shore.packet import (  # noqa: E402
    FLAG_BITS,
    LORA_PAYLOAD_BUDGET_BYTES,
    PACKET_SIZE,
    PACKET_VERSION,
    SOH_BITS,
    Reading,
    encode,
)

CANONICAL = Reading(
    buoy_id=1,
    timestamp=datetime(2027, 3, 1, 0, 0, 0, tzinfo=timezone.utc),
    record_seq=42,
    temp_c=26.44,
    turbidity_adc=514,
    battery_v=3.28,
    uptime_s=75600,
    flags=frozenset({"SD_RETRY", "BATT_LOW_SKIP_TX"}),
    soh=frozenset({"WATCHDOG_RESET", "SD_INIT_FAIL"}),
    audio_present=True,
    fw_version="v0.1.0",
    # v3 acoustic summary (ADR-0010): the 200 ms Sesoko excerpt in the firmware's golden vectors
    lvl_anthro_cdb=-3972,
    lvl_mixed_cdb=-3006,
    lvl_bio_cdb=-1068,
    lvl_broad_cdb=-995,
    ndsi_e4=9975,
    snap_count=10,
    clip_count=24,
    tx_count=2,  # v4 (SCO-198): flags bits 8-9
    settings_digest=0xE674,  # v5: the digest of the default remote settings
)

_TEST_CPP = _ROOT / "firmware" / "test" / "test_packet" / "test_packet.cpp"
_DOWNLINK_TEST_CPP = _ROOT / "firmware" / "test" / "test_downlink" / "test_downlink.cpp"
# Keep identical to GOLDEN's comment in test_downlink.cpp: buoy 1, tx_count 2, key 00..1f.
_DOWNLINK_CANONICAL = downlink.set_tx_count(1, 2, now_epoch=1803859200)
_DOWNLINK_TEST_KEY = bytes(range(32))
# Keep identical to GOLDEN_SETTINGS's comment in test_downlink.cpp.
_SETTINGS_CANONICAL = downlink.SettingsCommand(1, 1803859200, (2, 1, 15, 30, 3300, 3200, 2, 80))
_OTA_TEST_CPP = _ROOT / "firmware" / "test" / "test_ota" / "test_ota.cpp"
# Keep identical to the comments in test_ota.cpp: a 300-byte image, byte i = (7i + 3) & 0xFF.
_OTA_IMAGE = bytes((7 * i + 3) & 0xFF for i in range(300))
_OTA_VERSION = ota.version_number(0, 2, 0)
_LINK_H = _ROOT / "firmware" / "lib" / "scout_link" / "scout_link.h"
_PACKET_H = _ROOT / "firmware" / "lib" / "scout_packet" / "scout_packet.h"
_CONFIG_H = _ROOT / "firmware" / "src" / "config.h"
_RH_HEADER_BYTES = 4
_BW_HZ = {0x7: 125_000, 0x8: 250_000, 0x9: 500_000}  # RegModemConfig1 bits 7-4 (SX1276)
_TIMEOUT_MARGIN = 0.9  # a ceiling-size frame may use at most 90% of the send timeout


def _c_number(path: pathlib.Path, name: str) -> int:
    """Value of `#define NAME 123u` or `static const ... NAME = 0x98;` in a C header."""
    match = re.search(rf"\b{name}\b\s*=?\s*(0x[0-9A-Fa-f]+|\d+)u?\b", path.read_text())
    if not match:
        sys.exit(f"could not find {name} in {path}")
    return int(match.group(1), 0)


def check_bit_maps() -> str:
    """Flag and SoH bit positions, and the version, must be identical on both sides.

    The golden vector only exercises the bits it happens to set, so a new flag added on one
    side with a different position would otherwise pass CI and mis-decode in the field.
    """
    text = _PACKET_H.read_text()
    problems = []
    for prefix, shore in (("SCOUT_FLAG_", FLAG_BITS), ("SCOUT_SOH_", SOH_BITS)):
        firmware = {name: int(bit) for name, bit in
                    re.findall(rf"#define {prefix}(\w+)\s+\(1u\s*<<\s*(\d+)\)", text)}
        if firmware != shore:
            problems.append(f"{prefix}* bits differ: firmware {firmware} vs shore {shore}")
    firmware_version = _c_number(_PACKET_H, "SCOUT_PACKET_VERSION")
    if firmware_version != PACKET_VERSION:
        problems.append(f"SCOUT_PACKET_VERSION = {firmware_version}, shore PACKET_VERSION = {PACKET_VERSION}")
    if problems:
        sys.exit("PACKET BIT-MAP DRIFT:\n  " + "\n  ".join(problems))
    return (f"bit maps OK — v{PACKET_VERSION}, {len(FLAG_BITS)} flags, {len(SOH_BITS)} SoH bits")


def check_payload_ceiling() -> str:
    ceiling = _c_number(_LINK_H, "SCOUT_LINK_PAYLOAD_CEILING_BYTES")
    ceiling_airtime = _c_number(_LINK_H, "SCOUT_LINK_CEILING_AIRTIME_MS")
    timeout = _c_number(_LINK_H, "SCOUT_LINK_TX_BUDGET_MS")
    cfg1 = _c_number(_CONFIG_H, "LORA_MODEM_CONFIG1")
    cfg2 = _c_number(_CONFIG_H, "LORA_MODEM_CONFIG2")
    bw_hz = _BW_HZ.get(cfg1 >> 4)
    if bw_hz is None:
        sys.exit(f"unrecognised bandwidth bits in LORA_MODEM_CONFIG1 = {cfg1:#04x}")
    coding_rate = (cfg1 >> 1) & 0x7  # 1..4 = 4/5..4/8
    sf = cfg2 >> 4
    crc = bool(cfg2 & 0x04)

    on_air = airtime_ms(ceiling + _RH_HEADER_BYTES, sf, bw_hz, coding_rate, crc=crc)
    problems = []
    if LORA_PAYLOAD_BUDGET_BYTES != ceiling:
        problems.append(f"shore LORA_PAYLOAD_BUDGET_BYTES = {LORA_PAYLOAD_BUDGET_BYTES}, "
                        f"firmware SCOUT_LINK_PAYLOAD_CEILING_BYTES = {ceiling}")
    if PAYLOAD_CEILING_BYTES != ceiling:
        problems.append(f"scripts/lora_airtime.py PAYLOAD_CEILING_BYTES = {PAYLOAD_CEILING_BYTES}, "
                        f"firmware = {ceiling}")
    if PACKET_SIZE > ceiling:
        problems.append(f"the {PACKET_SIZE}-byte packet exceeds the {ceiling}-byte ceiling")
    if on_air > _TIMEOUT_MARGIN * timeout:
        problems.append(f"a {ceiling}-byte frame takes {on_air:.0f} ms at SF{sf}/BW{bw_hz // 1000}, "
                        f"over {_TIMEOUT_MARGIN:.0%} of the {timeout} ms send timeout")
    packet_airtime = _c_number(_LINK_H, "SCOUT_LINK_AIRTIME_MS")
    packet_on_air = airtime_ms(PACKET_SIZE + _RH_HEADER_BYTES, sf, bw_hz, coding_rate, crc=crc)
    if math.ceil(packet_on_air) != packet_airtime:  # the real packet, used for the watchdog budget
        problems.append(f"SCOUT_LINK_AIRTIME_MS = {packet_airtime} but a {PACKET_SIZE}-byte packet "
                        f"takes {packet_on_air:.1f} ms (rounded up: {math.ceil(packet_on_air)}); "
                        "recompute it")
    if math.ceil(on_air) != ceiling_airtime:  # the firmware stores it rounded up
        problems.append(f"SCOUT_LINK_CEILING_AIRTIME_MS = {ceiling_airtime} but the modem "
                        f"settings give {on_air:.1f} ms (rounded up: {math.ceil(on_air)}); recompute it")
    if problems:
        sys.exit("PAYLOAD CEILING DRIFT (SCO-97):\n  " + "\n  ".join(problems))
    return (f"payload ceiling OK — {ceiling} B, {on_air:.0f} ms of a {timeout} ms send timeout; "
            f"packet {PACKET_SIZE} B, {packet_on_air:.0f} ms")


def firmware_golden_hex(path: pathlib.Path = _TEST_CPP, name: str = "GOLDEN") -> str:
    text = path.read_text()
    match = re.search(rf"\b{name}\[[^\]]*\]\s*=\s*\{{([^}}]*)\}}", text)
    if not match:
        sys.exit(f"could not find {name}[] array in {path}")
    byte_values = [int(b, 16) for b in re.findall(r"0x([0-9a-fA-F]{2})", match.group(1))]
    return bytes(byte_values).hex()


def main() -> None:
    python_hex = encode(CANONICAL).hex()
    fw_hex = firmware_golden_hex()
    if python_hex != fw_hex:
        sys.exit(
            "PACKET CONTRACT DRIFT — firmware and shore disagree on the wire format:\n"
            f"  shore (packet.py) : {python_hex}\n"
            f"  firmware GOLDEN   : {fw_hex}\n"
            "Update both sides in lockstep (and the golden vector)."
        )
    print(f"packet contract OK — {len(fw_hex) // 2} bytes: {python_hex}")
    print(check_bit_maps())
    print(check_payload_ceiling())
    print(check_downlink())
    print(check_ota())


def check_downlink() -> str:
    python_hex = downlink.encode(_DOWNLINK_CANONICAL, _DOWNLINK_TEST_KEY).hex()
    fw_hex = firmware_golden_hex(_DOWNLINK_TEST_CPP)
    if python_hex != fw_hex:
        sys.exit(
            "DOWNLINK CONTRACT DRIFT — firmware and shore disagree on the command frame:\n"
            f"  shore (downlink.py) : {python_hex}\n"
            f"  firmware GOLDEN     : {fw_hex}"
        )
    if downlink.CMD_SIZE > LORA_PAYLOAD_BUDGET_BYTES:
        sys.exit(f"the {downlink.CMD_SIZE}-byte command exceeds the {LORA_PAYLOAD_BUDGET_BYTES}-byte ceiling")
    settings_hex = downlink.encode_settings(_SETTINGS_CANONICAL, _DOWNLINK_TEST_KEY).hex()
    fw_settings_hex = firmware_golden_hex(_DOWNLINK_TEST_CPP, "GOLDEN_SETTINGS")
    if settings_hex != fw_settings_hex:
        sys.exit(
            "SETTINGS FRAME DRIFT — firmware and shore disagree on the v2 command frame:\n"
            f"  shore (downlink.py) : {settings_hex}\n"
            f"  firmware GOLDEN_SETTINGS : {fw_settings_hex}"
        )
    if downlink.SETTINGS_SIZE > LORA_PAYLOAD_BUDGET_BYTES:
        sys.exit(f"the {downlink.SETTINGS_SIZE}-byte settings frame exceeds the ceiling")
    return (f"downlink contract OK — v1 {downlink.CMD_SIZE} bytes: {python_hex}; "
            f"v2 {downlink.SETTINGS_SIZE} bytes: {settings_hex}")


def check_ota() -> str:
    def golden(name: str) -> bytes:
        return bytes.fromhex(firmware_golden_hex(_OTA_TEST_CPP, name))

    manifest = ota.manifest_for(_OTA_IMAGE, target_buoy=1, version=_OTA_VERSION, build_time=1803859200)
    offer = golden("GOLDEN_OFFER")
    signature = offer[1 + ota.MANIFEST_BYTES:]
    frames = {
        "GOLDEN_OFFER": (ota.encode_offer(manifest.encode(), signature), offer),
        "GOLDEN_CHUNK2": (ota.encode_chunk(manifest.session, 2, ota.chunk_data(_OTA_IMAGE, 2), last=True),
                          golden("GOLDEN_CHUNK2")),
        "GOLDEN_ACK": (ota.encode_ack(ota.Ack(1, manifest.session, 16, 0x00FF, 0)), golden("GOLDEN_ACK")),
        "GOLDEN_CONFIRM": (ota.encode_confirm(1, 1803859200, _OTA_VERSION, _DOWNLINK_TEST_KEY),
                           golden("GOLDEN_CONFIRM")),
    }
    drift = [f"  {name}: shore {mine.hex()}\n  {' ' * len(name)}  firmware {theirs.hex()}"
             for name, (mine, theirs) in frames.items() if mine != theirs]
    if drift:
        sys.exit("OTA CONTRACT DRIFT — firmware and shore disagree on an update frame:\n" + "\n".join(drift))
    largest = ota.CHUNK_HEADER + ota.CHUNK_BYTES + 2
    if max(largest, ota.OFFER_SIZE) > LORA_PAYLOAD_BUDGET_BYTES:
        sys.exit(f"an OTA frame ({largest} B) exceeds the {LORA_PAYLOAD_BUDGET_BYTES}-byte ceiling")
    return f"OTA contract OK — offer {ota.OFFER_SIZE} B, chunk ≤ {largest} B, ack {ota.ACK_SIZE} B, confirm {ota.CONFIRM_SIZE} B"


if __name__ == "__main__":
    main()
