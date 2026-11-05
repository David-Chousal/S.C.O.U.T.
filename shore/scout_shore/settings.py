"""The buoy settings that can be changed by radio (docs/engineering/firmware-remote-settings-plan.md).

A mirror of ``firmware/lib/scout_settings/scout_settings.{h,cpp}``, which is the one source:
``tests/test_settings_registry.py`` parses the C table and fails if this drifts from it. The
console's copy (``console/worker/buoy-settings.json``) is written from the same table by
``scripts/export_buoy_config.py``.

The digest is CRC-16/CCITT-FALSE over the values as little-endian u16 in ID order. Every v5
packet carries the buoy's, so a match with :func:`digest` of what was asked means the buoy runs
exactly that. Standard library only.
"""

from __future__ import annotations

import struct
from dataclasses import dataclass

from .packet import crc16_ccitt

LAYOUT = 1
MIN_TIER_GAP_MV = 50


@dataclass(frozen=True)
class Spec:
    id: int
    key: str
    default: int
    minimum: int = 0
    maximum: int = 0
    step: int = 0
    choices: tuple[int, ...] = ()

    def allows(self, value: int) -> bool:
        if self.choices:
            return value in self.choices
        return self.minimum <= value <= self.maximum and (value - self.minimum) % self.step == 0


SPECS: tuple[Spec, ...] = (
    Spec(1, "tx_count", 3, 1, 3, 1),
    Spec(2, "slot_phase_h", 0, 0, 7, 1),
    Spec(3, "sample_interval_min", 30, choices=(15, 30, 60)),
    Spec(4, "audio_clip_s", 60, choices=(0, 15, 30, 60)),
    Spec(5, "conserve_mv", 3200, 3000, 3600, 10),
    Spec(6, "critical_mv", 3100, 2900, 3500, 10),
    Spec(7, "conserve_every", 3, 1, 3, 1),
    Spec(8, "humidity_alert_pct", 70, 40, 95, 1),
)
KEYS: tuple[str, ...] = tuple(spec.key for spec in SPECS)
DEFAULTS: tuple[int, ...] = tuple(spec.default for spec in SPECS)


class SettingsError(ValueError):
    """Raised for a settings snapshot the buoy would refuse."""


def check(values: tuple[int, ...]) -> tuple[int, ...]:
    """Return ``values`` if the buoy would accept them as a whole, else raise SettingsError."""
    if len(values) != len(SPECS):
        raise SettingsError(f"expected {len(SPECS)} values, got {len(values)}")
    for spec, value in zip(SPECS, values):
        if not isinstance(value, int) or not spec.allows(value):
            raise SettingsError(f"{spec.key}={value!r} is not allowed")
    by_key = dict(zip(KEYS, values))
    if by_key["critical_mv"] + MIN_TIER_GAP_MV > by_key["conserve_mv"]:
        raise SettingsError(f"critical_mv must be at least {MIN_TIER_GAP_MV} mV under conserve_mv")
    return tuple(values)


def digest(values: tuple[int, ...]) -> int:
    """CRC-16/CCITT-FALSE of the values as little-endian u16, as the buoy reports it."""
    return crc16_ccitt(b"".join(struct.pack("<H", v) for v in values))


def digest_hex(values: tuple[int, ...]) -> str:
    """The digest as the CSV ``settings_digest`` column writes it: 4 lowercase hex digits."""
    return f"{digest(values):04x}"
