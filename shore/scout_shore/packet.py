"""LoRa telemetry packet codec — the firmware ↔ shore-station contract.

The buoy encodes a :class:`Reading` into a compact binary payload and transmits it
over LoRa once per day; the shore station decodes it back into a :class:`Reading`.
Both ends MUST agree on this layout — the firmware C encoder mirrors this module.

> ⚠️ **Proposed v1 layout, pending the ECE packet-format spec** (Team Timeline Phase 0,
> "read LoRa packet format spec from ECE lead"). The field set and encodings below are a
> working proposal so the shore/analytics path can be built now; reconcile with the ECE
> spec before firmware freezes it.

Layout (little-endian), 27-byte body + 2-byte CRC = **29 bytes** (well under the
82-byte daily budget in EDD §10, leaving room for future signals):

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
| crc | uint16 | CRC-16/CCITT-FALSE over the body |
"""

from __future__ import annotations

import struct
from dataclasses import dataclass, field
from datetime import datetime, timezone

PACKET_VERSION = 1

_BODY_FORMAT = "<BHIIhHHIHBBBBB"  # 28 bytes (soh byte inserted after flags)
_BODY_SIZE = struct.calcsize(_BODY_FORMAT)
_CRC_FORMAT = "<H"
PACKET_SIZE = _BODY_SIZE + struct.calcsize(_CRC_FORMAT)

LORA_PAYLOAD_BUDGET_BYTES = 82  # EDD §10 daily payload ceiling

# Bit position for each flag name (see docs/engineering/data-schema.md flags vocabulary).
FLAG_BITS = {
    "SD_RETRY": 0,
    "TEMP_TIMEOUT": 1,
    "TURBIDITY_RANGE": 2,
    "BATT_LOW_SKIP_TX": 3,
    "RTC_LOST": 4,
}

# Device State-of-Health bits (set at boot/init; persistent, distinct from the per-cycle
# `flags`). See docs/engineering/data-schema.md soh vocabulary.
SOH_BITS = {
    "WATCHDOG_RESET": 0,   # last boot followed a watchdog reset
    "RTC_UNSET": 1,        # RTC lost power / not set at boot
    "SD_INIT_FAIL": 2,     # microSD failed to initialize
    "LORA_INIT_FAIL": 3,   # LoRa radio failed to initialize
}


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

    def __post_init__(self) -> None:
        if self.timestamp.tzinfo is None:
            raise ValueError("timestamp must be timezone-aware (UTC)")
        unknown = set(self.flags) - set(FLAG_BITS)
        if unknown:
            raise ValueError(f"unknown flag(s): {sorted(unknown)}")
        unknown_soh = set(self.soh) - set(SOH_BITS)
        if unknown_soh:
            raise ValueError(f"unknown soh bit(s): {sorted(unknown_soh)}")


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
    )
    return body + struct.pack(_CRC_FORMAT, crc16_ccitt(body))


def decode(payload: bytes) -> Reading:
    """Parse an on-wire payload back into a :class:`Reading`.

    Raises :class:`PacketError` on wrong length, CRC mismatch, or version mismatch.
    """
    if len(payload) != PACKET_SIZE:
        raise PacketError(f"expected {PACKET_SIZE} bytes, got {len(payload)}")
    body, (crc,) = payload[:_BODY_SIZE], struct.unpack(_CRC_FORMAT, payload[_BODY_SIZE:])
    if crc != crc16_ccitt(body):
        raise PacketError("CRC mismatch — corrupt or truncated packet")

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
    ) = struct.unpack(_BODY_FORMAT, body)

    if schema_version != PACKET_VERSION:
        raise PacketError(
            f"unsupported schema_version {schema_version} (decoder is v{PACKET_VERSION})"
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
    )
