"""The shore → buoy settings command (OTA design §3 ``CMD``, SCO-198).

THE WIRE FORMAT MUST MATCH ``firmware/lib/scout_downlink`` byte-for-byte; a golden vector in
``firmware/test/test_downlink`` and ``scripts/check_packet_contract.py`` hold them together.
Layout (little-endian), 28 bytes:

| Field | Type | Notes |
|---|---|---|
| type | uint8 | ``0xC1``; never the first byte of an uplink (schema_version 1-4) |
| version | uint8 | ``1`` |
| buoy_id | uint16 | target buoy, ``0`` = all |
| counter | uint32 | shore Unix time at signing; the buoy needs it to increase |
| setting | uint8 | ``1`` = transmit count |
| value | uint8 | ``1``-``3`` for the transmit count |
| tag | 16 bytes | HMAC-SHA256(key, the 10 bytes above), truncated |
| crc | uint16 | CRC-16/CCITT-FALSE over the 26 bytes above |

The 32-byte key is per buoy and never leaves the shore station and the buoy: not the console,
not the repo. :func:`key_from_env` reads it from ``SCOUT_CMD_KEY_<buoy_id>`` (64 hex digits).

Standard library only.
"""

from __future__ import annotations

import hmac
import os
import struct
from dataclasses import dataclass
from hashlib import sha256

from .packet import TX_COUNTS, crc16_ccitt

TYPE_CMD = 0xC1
VERSION = 1
CMD_SIZE = 28
KEY_BYTES = 32
TAG_BYTES = 16
BUOY_ALL = 0
SETTING_TX_COUNT = 1

_SIGNED = struct.Struct("<BBHIBB")  # 10 bytes


class DownlinkError(ValueError):
    """Raised for a command that must not be sent, or a frame that fails its checks."""


@dataclass(frozen=True)
class Command:
    buoy_id: int
    counter: int
    setting: int
    value: int

    def __post_init__(self) -> None:
        if self.setting != SETTING_TX_COUNT:
            raise DownlinkError(f"unknown setting {self.setting}")
        if self.value not in TX_COUNTS:
            raise DownlinkError(f"transmit count {self.value} not in {TX_COUNTS}")
        if not 0 <= self.buoy_id <= 0xFFFF or not 0 < self.counter <= 0xFFFFFFFF:
            raise DownlinkError("buoy_id or counter out of range")


def set_tx_count(buoy_id: int, tx_count: int, *, now_epoch: int) -> Command:
    return Command(buoy_id, now_epoch, SETTING_TX_COUNT, tx_count)


def _tag(signed: bytes, key: bytes) -> bytes:
    return hmac.new(key, signed, sha256).digest()[:TAG_BYTES]


def _check_key(key: bytes) -> None:
    if len(key) != KEY_BYTES:
        raise DownlinkError(f"key must be {KEY_BYTES} bytes, got {len(key)}")


def encode(command: Command, key: bytes) -> bytes:
    _check_key(key)
    signed = _SIGNED.pack(TYPE_CMD, VERSION, command.buoy_id, command.counter,
                          command.setting, command.value)
    body = signed + _tag(signed, key)
    return body + struct.pack("<H", crc16_ccitt(body))


def decode(frame: bytes, key: bytes) -> Command:
    """Verify length, CRC, type, version and tag, and return the command. For tests and the
    shore's own self-check; the buoy's replay, age and buoy-ID checks live in the firmware."""
    _check_key(key)
    if len(frame) != CMD_SIZE:
        raise DownlinkError(f"expected {CMD_SIZE} bytes, got {len(frame)}")
    body, (crc,) = frame[:-2], struct.unpack("<H", frame[-2:])
    if crc != crc16_ccitt(body):
        raise DownlinkError("CRC mismatch")
    kind, version, buoy_id, counter, setting, value = _SIGNED.unpack(body[:_SIGNED.size])
    if kind != TYPE_CMD or version != VERSION:
        raise DownlinkError(f"not a v{VERSION} command frame")
    if not hmac.compare_digest(_tag(body[:_SIGNED.size], key), body[_SIGNED.size:]):
        raise DownlinkError("tag mismatch")
    return Command(buoy_id, counter, setting, value)


def key_from_env(buoy_id: int, environ: dict[str, str] | None = None) -> bytes | None:
    """The buoy's command key from ``SCOUT_CMD_KEY_<id>``, or None when it is not set."""
    raw = (environ if environ is not None else os.environ).get(f"SCOUT_CMD_KEY_{buoy_id}")
    if raw is None:
        return None
    try:
        key = bytes.fromhex(raw.strip())
    except ValueError as exc:
        raise DownlinkError(f"SCOUT_CMD_KEY_{buoy_id} is not hex") from exc
    _check_key(key)
    return key
