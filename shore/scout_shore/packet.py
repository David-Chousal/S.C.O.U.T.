"""LoRa telemetry packet codec — the firmware ↔ shore-station contract.

The buoy encodes a :class:`Reading` into a compact binary payload and transmits it
over LoRa once per day; the shore station decodes it back into a :class:`Reading`.
Both ends MUST agree on this layout — the firmware C encoder mirrors this module.

> ✅ **Verified against the firmware encoder** — byte-identical, CI-enforced via a golden
> vector (`firmware/test/test_packet`). No longer a proposal pending ECE sign-off.

Layout (little-endian), v3: 42-byte body + 2-byte CRC = **44 bytes** (under the 140-byte
payload ceiling, derived from the firmware's send timeout; see
[`docs/hub/facts.md`](../../docs/hub/facts.md)). v1 and v2 were the first 28 body bytes alone
(30 bytes); :func:`decode` still reads them, with the acoustic fields zero.

| Field | Type | Encoding |
|---|---|---|
| schema_version | uint8 | matches the CSV `schema_version` |
| buoy_id | uint16 | numeric; CSV renders as `SCOUT-%02d` |
| timestamp | uint32 | Unix epoch seconds, UTC |
| record_seq | uint32 | monotonic counter / packet counter |
| temp_c | int16 | centi-degrees (°C × 100) |
| turbidity_adc | uint16 | raw ADC counts |
| battery_mv | uint16 | millivolts |
| uptime_s | uint32 | seconds since boot |
| flags | uint16 | per-cycle event bitfield, see FLAG_BITS |
| soh | uint8 | device State-of-Health bitfield, see SOH_BITS |
| audio_present | uint8 | 1 if a recording was taken this cycle |
| fw_major/minor/patch | uint8 ×3 | firmware version |
| lvl_anthro_cdb | int16 | RMS level 0–200 Hz, centi-dB re ADC full scale (v3) |
| lvl_mixed_cdb | int16 | RMS level 200–1,000 Hz (v3) |
| lvl_bio_cdb | int16 | RMS level 1–8 kHz (v3) |
| lvl_broad_cdb | int16 | broadband RMS level (v3) |
| ndsi_e4 | int16 | NDSI × 10,000 (v3) |
| snap_count | uint16 | snaps in the bio band, saturating (v3) |
| clip_count | uint16 | samples near the ADC rails, saturating (v3) |
| crc | uint16 | CRC-16/CCITT-FALSE over the body |

The v3 acoustic fields are the summary of the most recent recording since the previous transmit
slot (ADR-0010, computed by ``firmware/lib/scout_acoustic``, specified by
``analytics/utils/acoustic_summary.py``). They are all zero, with ``audio_present`` false, when
there was no recording.
"""

from __future__ import annotations

import struct
from dataclasses import dataclass, field
from datetime import datetime, timezone

# v2 (2026-10-23, SCO-205): HUMIDITY_HIGH / HUMIDITY_FAIL flags and two internal-sensor CSV
# columns; byte layout unchanged. v3 (2026-10-25, ADR-0010 / SCO-233): the 14-byte acoustic
# summary appended to the body. Must equal SCOUT_PACKET_VERSION in firmware/lib/scout_packet.
PACKET_VERSION = 3

_LEGACY_BODY_FORMAT = "<BHIIhHHIHBBBBB"  # v1/v2: 28 bytes
_ACOUSTIC_FORMAT = "hhhhhHH"  # v3: 14 bytes, ADR-0010 order
_BODY_FORMAT = _LEGACY_BODY_FORMAT + _ACOUSTIC_FORMAT  # 42 bytes
_BODY_SIZE = struct.calcsize(_BODY_FORMAT)
_LEGACY_BODY_SIZE = struct.calcsize(_LEGACY_BODY_FORMAT)
_CRC_FORMAT = "<H"
PACKET_SIZE = _BODY_SIZE + struct.calcsize(_CRC_FORMAT)
LEGACY_PACKET_SIZE = _LEGACY_BODY_SIZE + struct.calcsize(_CRC_FORMAT)
LEGACY_VERSIONS = (1, 2)

# The v3 fields, in wire order. Also the CSV column names (schema.py).
ACOUSTIC_FIELDS = (
    "lvl_anthro_cdb",
    "lvl_mixed_cdb",
    "lvl_bio_cdb",
    "lvl_broad_cdb",
    "ndsi_e4",
    "snap_count",
    "clip_count",
)
_ACOUSTIC_RANGES = {name: (-32768, 32767) for name in ACOUSTIC_FIELDS[:5]}
_ACOUSTIC_RANGES.update({"snap_count": (0, 65535), "clip_count": (0, 65535)})

# Largest telemetry payload the buoy may send (SCO-97, 2026-10-23). Derived from the firmware's
# 2 s send timeout: 140 B + RadioHead's 4 B header is 1,739 ms at BW500/SF12/CR4-8. Must equal
# SCOUT_LINK_PAYLOAD_CEILING_BYTES in firmware/lib/scout_link; scripts/check_packet_contract.py
# enforces it. Replaces the 82 B inherited from an abandoned EDD layout.
LORA_PAYLOAD_BUDGET_BYTES = 140

# Bit position for each flag name (see docs/engineering/data-schema.md flags vocabulary).
FLAG_BITS = {
    "SD_RETRY": 0,
    "TEMP_TIMEOUT": 1,
    "TURBIDITY_RANGE": 2,
    "BATT_LOW_SKIP_TX": 3,
    "RTC_LOST": 4,
    "POWER_CONSERVE": 5,
    "HUMIDITY_HIGH": 6,
    "HUMIDITY_FAIL": 7,
}

# Device State-of-Health bits (set at boot/init; persistent, distinct from the per-cycle
# `flags`). See docs/engineering/data-schema.md soh vocabulary.
SOH_BITS = {
    "WATCHDOG_RESET": 0,   # last boot followed a watchdog reset
    "RTC_UNSET": 1,        # RTC lost power / not set at boot
    "SD_INIT_FAIL": 2,     # microSD failed to initialize
    "LORA_INIT_FAIL": 3,   # LoRa radio failed to initialize
}


_LEGACY_FIELD_COUNT = len(_LEGACY_BODY_FORMAT) - 1  # one struct field per format char after '<'


class PacketError(ValueError):
    """Raised when a payload cannot be decoded (bad length, CRC, or version)."""


@dataclass(frozen=True)
class Reading:
    """One telemetry sample — the semantic payload carried by a packet.

    Immutable: transforms return new instances rather than mutating in place.
    """

    buoy_id: int
    timestamp: datetime  # timezone-aware, UTC
    record_seq: int
    temp_c: float
    turbidity_adc: int
    battery_v: float
    uptime_s: int
    flags: frozenset[str] = field(default_factory=frozenset)
    soh: frozenset[str] = field(default_factory=frozenset)
    audio_present: bool = False
    fw_version: str = "v0.1.0"
    schema_version: int = PACKET_VERSION
    # Acoustic summary (v3). Zero with audio_present False means no recording since the last slot.
    lvl_anthro_cdb: int = 0
    lvl_mixed_cdb: int = 0
    lvl_bio_cdb: int = 0
    lvl_broad_cdb: int = 0
    ndsi_e4: int = 0
    snap_count: int = 0
    clip_count: int = 0

    def __post_init__(self) -> None:
        if self.timestamp.tzinfo is None:
            raise ValueError("timestamp must be timezone-aware (UTC)")
        unknown = set(self.flags) - set(FLAG_BITS)
        if unknown:
            raise ValueError(f"unknown flag(s): {sorted(unknown)}")
        unknown_soh = set(self.soh) - set(SOH_BITS)
        if unknown_soh:
            raise ValueError(f"unknown soh bit(s): {sorted(unknown_soh)}")
        for name, (low, high) in _ACOUSTIC_RANGES.items():
            if not low <= getattr(self, name) <= high:
                raise ValueError(f"{name}={getattr(self, name)} outside {low}..{high}")

    def acoustic(self) -> tuple[int, ...]:
        """The seven v3 fields in wire order."""
        return tuple(getattr(self, name) for name in ACOUSTIC_FIELDS)


def crc16_ccitt(data: bytes) -> int:
    """CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF). Matches common MCU libraries."""
    crc = 0xFFFF
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    return crc


def _flags_to_bits(flags: frozenset[str]) -> int:
    bits = 0
    for name in flags:
        bits |= 1 << FLAG_BITS[name]
    return bits


def _bits_to_flags(bits: int) -> frozenset[str]:
    return frozenset(name for name, pos in FLAG_BITS.items() if bits & (1 << pos))


def _soh_to_bits(soh: frozenset[str]) -> int:
    bits = 0
    for name in soh:
        bits |= 1 << SOH_BITS[name]
    return bits


def _bits_to_soh(bits: int) -> frozenset[str]:
    return frozenset(name for name, pos in SOH_BITS.items() if bits & (1 << pos))


def _parse_fw(version: str) -> tuple[int, int, int]:
    parts = version.lstrip("vV").split(".")
    if len(parts) != 3:
        raise ValueError(f"fw_version must be 'vMAJOR.MINOR.PATCH', got {version!r}")
    major, minor, patch = (int(p) for p in parts)
    return major, minor, patch


def encode(reading: Reading) -> bytes:
    """Serialize a :class:`Reading` to the on-wire payload (with trailing CRC)."""
    fw_major, fw_minor, fw_patch = _parse_fw(reading.fw_version)
    body = struct.pack(
        _BODY_FORMAT,
        reading.schema_version,
        reading.buoy_id,
        int(reading.timestamp.timestamp()),
        reading.record_seq,
        round(reading.temp_c * 100),
        reading.turbidity_adc,
        round(reading.battery_v * 1000),
        reading.uptime_s,
        _flags_to_bits(reading.flags),
        _soh_to_bits(reading.soh),
        1 if reading.audio_present else 0,
        fw_major,
        fw_minor,
        fw_patch,
        *reading.acoustic(),
    )
    return body + struct.pack(_CRC_FORMAT, crc16_ccitt(body))


def decode(payload: bytes) -> Reading:
    """Parse an on-wire payload back into a :class:`Reading`.

    A 30-byte v1/v2 payload decodes with its own ``schema_version`` and the acoustic fields
    zero. Raises :class:`PacketError` on wrong length, CRC mismatch, or version mismatch.
    """
    legacy = len(payload) == LEGACY_PACKET_SIZE
    if len(payload) != PACKET_SIZE and not legacy:
        raise PacketError(f"expected {PACKET_SIZE} (or legacy {LEGACY_PACKET_SIZE}) bytes, "
                          f"got {len(payload)}")
    body_size = _LEGACY_BODY_SIZE if legacy else _BODY_SIZE
    body, (crc,) = payload[:body_size], struct.unpack(_CRC_FORMAT, payload[body_size:])
    if crc != crc16_ccitt(body):
        raise PacketError("CRC mismatch — corrupt or truncated packet")

    fields = struct.unpack(_LEGACY_BODY_FORMAT if legacy else _BODY_FORMAT, body)
    acoustic = (0,) * len(ACOUSTIC_FIELDS) if legacy else fields[-len(ACOUSTIC_FIELDS):]

    (
        schema_version,
        buoy_id,
        epoch,
        record_seq,
        temp_c_centi,
        turbidity_adc,
        battery_mv,
        uptime_s,
        flag_bits,
        soh_bits,
        audio_present,
        fw_major,
        fw_minor,
        fw_patch,
    ) = fields[:_LEGACY_FIELD_COUNT]

    allowed = LEGACY_VERSIONS if legacy else (PACKET_VERSION,)
    if schema_version not in allowed:
        raise PacketError(
            f"unsupported schema_version {schema_version} in a {len(payload)}-byte packet "
            f"(decoder is v{PACKET_VERSION}, legacy v1/v2 at {LEGACY_PACKET_SIZE} bytes)"
        )

    return Reading(
        buoy_id=buoy_id,
        timestamp=datetime.fromtimestamp(epoch, tz=timezone.utc),
        record_seq=record_seq,
        temp_c=temp_c_centi / 100,
        turbidity_adc=turbidity_adc,
        battery_v=battery_mv / 1000,
        uptime_s=uptime_s,
        flags=_bits_to_flags(flag_bits),
        soh=_bits_to_soh(soh_bits),
        audio_present=bool(audio_present),
        fw_version=f"v{fw_major}.{fw_minor}.{fw_patch}",
        schema_version=schema_version,
        **dict(zip(ACOUSTIC_FIELDS, acoustic)),
    )
