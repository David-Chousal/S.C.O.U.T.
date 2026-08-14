"""Synthetic sensor readings — lets the whole shore/analytics path be built and tested
with no hardware. Produces :class:`~scout_shore.packet.Reading` objects with realistic
diurnal temperature, occasional turbidity events, and a charging/discharging battery.

Deterministic: seed the RNG for repeatable output (tests rely on this).
"""

from __future__ import annotations

import math
import random
from collections.abc import Iterator
from datetime import datetime, timedelta, timezone

from .packet import Reading

DEFAULT_INTERVAL_S = 1800  # 30-minute duty cycle (EDD / data-schema)

# Provisional environmental model — tune once real data exists.
_TEMP_MEAN_C = 26.5
_TEMP_DIURNAL_AMPLITUDE_C = 1.2
_TURBIDITY_BASELINE_ADC = 500
_TURBIDITY_EVENT_ADC = 900
_BATTERY_FULL_V = 3.35
_BATTERY_MIN_V = 3.05
_BATT_LOW_SKIP_TX_V = 3.10


def generate_reading(
    seq: int,
    timestamp: datetime,
    *,
    buoy_id: int = 1,
    rng: random.Random | None = None,
) -> Reading:
    """One synthetic reading at ``timestamp`` with sequence number ``seq``."""
    rng = rng or random.Random(seq)
    hour = timestamp.hour + timestamp.minute / 60

    # Diurnal temperature: warmest mid-afternoon (~15:00), coolest before dawn.
    temp_c = (
        _TEMP_MEAN_C
        + _TEMP_DIURNAL_AMPLITUDE_C * math.sin((hour - 9) / 24 * 2 * math.pi)
        + rng.uniform(-0.1, 0.1)
    )

    # Turbidity: mostly clear, with an occasional runoff/sediment spike.
    is_event = rng.random() < 0.08
    turbidity_adc = int(
        (_TURBIDITY_EVENT_ADC if is_event else _TURBIDITY_BASELINE_ADC) + rng.uniform(-40, 40)
    )

    # Battery: charges during daylight (~06:00–18:00), discharges overnight.
    daylight = 6 <= hour <= 18
    swing = 0.03 if daylight else -0.04
    battery_v = max(_BATTERY_MIN_V, min(_BATTERY_FULL_V, _BATTERY_FULL_V - 0.2 + swing * (seq % 12)))

    flags = set()
    if battery_v < _BATT_LOW_SKIP_TX_V:
        flags.add("BATT_LOW_SKIP_TX")

    # Audio: 3 recordings/day (EDD) — roughly every 8th 30-min cycle.
    audio_present = seq % 16 == 0

    return Reading(
        buoy_id=buoy_id,
        timestamp=timestamp,
        record_seq=seq,
        temp_c=round(temp_c, 2),
        turbidity_adc=turbidity_adc,
        battery_v=round(battery_v, 2),
        uptime_s=seq * DEFAULT_INTERVAL_S,
        flags=frozenset(flags),
        audio_present=audio_present,
    )


def generate_series(
    start: datetime,
    count: int,
    *,
    interval_s: int = DEFAULT_INTERVAL_S,
    buoy_id: int = 1,
    seed: int = 0,
) -> Iterator[Reading]:
    """Yield ``count`` readings spaced ``interval_s`` apart, starting at ``start`` (UTC)."""
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    rng = random.Random(seed)
    for seq in range(1, count + 1):
        ts = start + timedelta(seconds=(seq - 1) * interval_s)
        yield generate_reading(seq, ts, buoy_id=buoy_id, rng=rng)
