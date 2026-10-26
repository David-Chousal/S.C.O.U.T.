"""Battery life against the daily transmit count — the one model the dashboard and console use.

SCO-198 lets a user pick 1, 2 or 3 transmits a day. This module answers "at N transmits a day
the cells last X days" from the power budget's own figures, so the number shown next to the
control is the budget's number and not a second, drifting calculation.

**Every figure is an estimate.** The budget is datasheet-derived until the bench measures it
(build plan Stage 2 and Stage 7). The model only *moves the radio line* of an existing budget
scenario: it removes the three 30-byte sends the scenario was built with and adds N sends of the
real 44-byte packet, plus the optional 1 s listen window after each send (OTA design §2).

Sources, cited per constant below:

- PB  = docs/engineering/power-budget-update-2026-10-05.md (its 2026-10-25 update for the
  hydrophone scenarios, "Every load, worked out" for the radio line, "Will it last" for capacity)
- OTA = docs/engineering/ota-firmware-update-design.md §2 / §7 (listen-window current)
- AIR = scripts/lora_airtime.py (airtime of the 44 B packet + 4 B RadioHead header)

Standard library only.
"""

from __future__ import annotations

from dataclasses import dataclass

# Usable capacity per D cell: ≈ 17 Ah Li-SOCl₂ derated to 70%. PB "Will it last", *estimate*.
USABLE_MAH_PER_CELL = 11_900.0
# Days per month, as PB converts days to months (735 d = 24.1 mo).
DAYS_PER_MONTH = 365.25 / 12

# Radio line. TX ≤ 100 mA (PA current limit) plus the SAMD21 awake during TX. PB "Every load".
TX_CURRENT_MA = 100.0
# Airtime the budget scenarios were built with: 30 B + 4 B header at BW500/SF12/CR4-8. PB.
BUDGET_AIRTIME_S = 0.559
BUDGET_SENDS_PER_DAY = 3
# Airtime of the packet the buoy sends today: 44 B (v3/v4) + 4 B header. AIR, 690.2 ms.
PACKET_AIRTIME_S = 0.6902

# Listen window after each send, when the settings downlink is built in (SCOUT_DOWNLINK).
# OTA §2: 1.0 s proposed, RX ≈ 12 mA (SX1276 datasheet, BW 500 kHz, *to measure*).
LISTEN_WINDOW_S = 1.0
RX_CURRENT_MA = 12.0

ALLOWED_TX_COUNTS = (1, 2, 3)  # SCO-198; pending ECE (Isabella) power-budget sign-off
CELL_OPTIONS = (1, 2)


@dataclass(frozen=True)
class Scenario:
    """One power-budget scenario, as the budget states it (3 sends a day of 30 B)."""

    key: str
    label: str
    mah_per_day: float   # scenario total from PB, radio included at 3 × 0.559 s
    mcu_awake_ma: float  # MCU current the scenario assumes while awake


# PB update 2026-10-25, hydrophone 3 min/day (ADR-0011): best 16.2, pessimistic 37.7 mAh/day.
# The pessimistic case assumes the MCU at 20 mA awake (PB "Will it last"); best uses 11 mA.
SCENARIOS = (
    Scenario("best", "Best estimate", 16.2, 11.0),
    Scenario("pessimistic", "Pessimistic", 37.7, 20.0),
)


@dataclass(frozen=True)
class LifeEstimate:
    scenario: str
    tx_per_day: int
    cells: int
    listen_window: bool
    mah_per_day: float
    days: float

    @property
    def months(self) -> float:
        return self.days / DAYS_PER_MONTH


def _send_mah(airtime_s: float, mcu_ma: float) -> float:
    return (TX_CURRENT_MA + mcu_ma) * airtime_s / 3600.0


def _listen_mah(mcu_ma: float) -> float:
    return (RX_CURRENT_MA + mcu_ma) * LISTEN_WINDOW_S / 3600.0


def daily_mah(scenario: Scenario, tx_per_day: int, *, listen_window: bool = False) -> float:
    """Daily draw of ``scenario`` with its radio line replaced by ``tx_per_day`` real sends."""
    if tx_per_day not in ALLOWED_TX_COUNTS:
        raise ValueError(f"tx_per_day must be one of {ALLOWED_TX_COUNTS}, got {tx_per_day}")
    without_radio = scenario.mah_per_day - BUDGET_SENDS_PER_DAY * _send_mah(
        BUDGET_AIRTIME_S, scenario.mcu_awake_ma)
    per_send = _send_mah(PACKET_AIRTIME_S, scenario.mcu_awake_ma)
    if listen_window:
        per_send += _listen_mah(scenario.mcu_awake_ma)
    return without_radio + tx_per_day * per_send


def estimate(scenario: Scenario, tx_per_day: int, cells: int, *,
             listen_window: bool = False) -> LifeEstimate:
    if cells not in CELL_OPTIONS:
        raise ValueError(f"cells must be one of {CELL_OPTIONS}, got {cells}")
    draw = daily_mah(scenario, tx_per_day, listen_window=listen_window)
    return LifeEstimate(scenario.key, tx_per_day, cells, listen_window, draw,
                        cells * USABLE_MAH_PER_CELL / draw)


def table(*, listen_window: bool = False) -> list[LifeEstimate]:
    """Every scenario × transmit count × cell count, in a stable order."""
    return [estimate(s, n, c, listen_window=listen_window)
            for s in SCENARIOS for n in ALLOWED_TX_COUNTS for c in CELL_OPTIONS]


def as_json_dict() -> dict:
    """The table as plain data, for the public dashboard and the console (one source)."""
    def rows(listen: bool) -> list[dict]:
        return [{"scenario": e.scenario, "tx_per_day": e.tx_per_day, "cells": e.cells,
                 "mah_per_day": round(e.mah_per_day, 3), "days": round(e.days),
                 "months": round(e.months, 1)} for e in table(listen_window=listen)]

    return {
        "estimate": True,
        "source": "docs/engineering/power-budget-update-2026-10-05.md (2026-10-25 update), "
                  "analytics/telemetry/battery_life.py",
        "scenarios": {s.key: s.label for s in SCENARIOS},
        "allowed_tx_counts": list(ALLOWED_TX_COUNTS),
        "without_listen_window": rows(False),
        "with_listen_window": rows(True),
    }
