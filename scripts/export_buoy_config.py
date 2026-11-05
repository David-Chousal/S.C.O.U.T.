#!/usr/bin/env python3
"""Write console/worker/buoy-config.json: the buoy's firmware settings, read from the firmware.

The console's Settings page shows what each buoy is set to, and lets members change the remote
settings. Every value is read from the firmware, never retyped, so a firmware change and the
console cannot disagree:

- ``settings``: one display row per setting, from firmware/src/config.h and library headers;
- ``remote``: the remote-settings registry (firmware/lib/scout_settings), which the console uses
  to draw its controls and to refuse what a buoy would refuse
  (docs/engineering/firmware-remote-settings-plan.md).

    python3 scripts/export_buoy_config.py

shore/tests/test_console_buoy_config.py fails if the committed JSON drifts from the firmware.
"""

from __future__ import annotations

import json
import pathlib
import re

_ROOT = pathlib.Path(__file__).resolve().parent.parent
_FW = _ROOT / "firmware"
CONFIG_H = _FW / "src" / "config.h"
SCHEDULER_H = _FW / "lib" / "scout_scheduler" / "scout_scheduler.h"
SETTINGS_H = _FW / "lib" / "scout_settings" / "scout_settings.h"
SETTINGS_CPP = _FW / "lib" / "scout_settings" / "scout_settings.cpp"
PACKET_H = _FW / "lib" / "scout_packet" / "scout_packet.h"
OUT = _ROOT / "console" / "worker" / "buoy-config.json"


def _raw(text: str, name: str) -> str:
    """The value of `static const T NAME = v;`, `... NAME[] = {...};` or `#define NAME v`."""
    match = re.search(rf"\b{name}\b(?:\[\])?\s*=\s*(\{{[^}}]*\}}|[^;]+);", text) or \
        re.search(rf"#define\s+{name}\s+(\S+)", text)
    if not match:
        raise SystemExit(f"{name} not found")
    return match.group(1).strip()


def _deployed(text: str) -> str:
    """config.h with the bench build's `#ifdef SCOUT_BENCH` branch removed, so a value defined in
    both branches reads as the deployed one, not the bench one."""
    return re.sub(r"#ifdef SCOUT_BENCH\n.*?#else\n", "", text, count=1, flags=re.S)


def _number(text: str, name: str) -> float:
    return float(re.sub(r"[uUfF]$", "", _raw(text, name)))


def _numbers(text: str, name: str) -> list[int]:
    return [int(v) for v in re.findall(r"\d+", _raw(text, name))]


def _hhmm(seconds_of_day: int) -> str:
    return f"{seconds_of_day // 3600:02d}:{seconds_of_day % 3600 // 60:02d}"


# How the console names and explains each remote setting. Keys must equal the firmware table's.
REMOTE_LABELS = {
    "tx_count": ("Transmits a day", "", "How many of the three daily slots send a packet."),
    "slot_phase_h": ("Slot phase", "h", "Moves every transmit slot and recording this many hours later."),
    "sample_interval_min": ("Reading interval", "min", "Minutes between sensor readings."),
    "audio_clip_s": ("Hydrophone clip", "s", "Length of each recording; 0 turns recording off."),
    "conserve_mv": ("Conserve below", "mV", "Below this battery voltage the buoy skips audio and sends less."),
    "critical_mv": ("Critical below", "mV", "Below this it only logs temperature. At least 50 mV under conserve."),
    "conserve_every": ("Conserve: send every", "slot", "In conserve, transmit in every Nth used slot."),
    "humidity_alert_pct": ("Housing humidity alert", "%RH", "Rows at or above it carry HUMIDITY_HIGH."),
}


def _settings_macros() -> dict[str, int]:
    text = SETTINGS_H.read_text() + SCHEDULER_H.read_text()
    return {name: int(value) for name, value in re.findall(r"#define (SCOUT_\w+) (\d+)u", text)}


def remote() -> list[dict]:
    """The firmware's remote-settings table, in ID order."""
    macros = _settings_macros()
    source = re.sub(r"\s+", " ", SETTINGS_CPP.read_text())
    rows = re.findall(r"\{ ?(SCOUT_SET_\w+), \"(\w+)\", (\w+), (\w+), (\w+), (\d+), (\d), \{([\d, ]+)\}\}",
                      source)
    if len(rows) != macros["SCOUT_SETTINGS_COUNT"]:
        raise SystemExit(f"read {len(rows)} remote settings, expected {macros['SCOUT_SETTINGS_COUNT']}")

    def value(token: str) -> int:
        return macros[token] if token in macros else int(token)

    out = []
    for token, key, default, low, high, step, n, choices in rows:
        label, unit, help_text = REMOTE_LABELS[key]
        entry = {"id": value(token), "key": key, "label": label, "unit": unit, "help": help_text,
                 "default": value(default)}
        if int(n):
            entry["choices"] = [int(c) for c in choices.split(",")][:int(n)]
        else:
            entry.update({"min": value(low), "max": value(high), "step": int(step)})
        out.append(entry)
    return out


def _every_nth(n: int) -> str:
    return "every" if n == 1 else f"every {n}{'nd' if n == 2 else 'rd'}"


def settings() -> list[dict]:
    """One display row per setting: a plain value, what it does, and whether it changes by radio
    (per buoy, Settings → Buoys) or only by a firmware update."""
    config = _deployed(CONFIG_H.read_text())
    packet = PACKET_H.read_text()
    reg = {r["key"]: r for r in remote()}
    slots = _numbers(config, "TX_SLOTS_SOD")
    hours = _numbers(config, "AUDIO_HOURS_UTC")

    def row(key, label, value, description, change="radio"):
        return {"key": key, "label": label, "value": value, "description": description, "change": change}

    def options(key, unit=""):
        r = reg[key]
        values = r["choices"] if "choices" in r else [r["min"], r["max"]]
        joined = ", ".join(map(str, values[:-1])) + f" or {values[-1]}" if "choices" in r else f"{values[0]}–{values[1]}"
        return f"{joined}{unit}"

    tx, phase = reg["tx_count"], reg["slot_phase_h"]
    clip = reg["audio_clip_s"]
    conserve, critical = reg["conserve_mv"], reg["critical_mv"]
    every = reg["conserve_every"]
    humidity = reg["humidity_alert_pct"]
    fw = (f"v{int(_number(config, 'FW_MAJOR'))}.{int(_number(config, 'FW_MINOR'))}."
          f"{int(_number(config, 'FW_PATCH'))}")
    return [
        row("tx_count", "Transmits a day", f"{tx['default']} a day",
            f"How many of the day's transmit slots send a packet ({options('tx_count')}). "
            "1 uses the first slot, 2 the first and last, 3 all three."),
        row("tx_slots", "Transmit slots", " · ".join(_hhmm(s) for s in slots) + " UTC",
            f"Each comes 10 min after a sensor reading. The slot phase moves every slot "
            f"{options('slot_phase_h', ' h')} later (default {phase['default']} h)."),
        row("sample_interval", "Sensor readings", f"Every {reg['sample_interval_min']['default']} min",
            f"How often the buoy wakes to read its sensors: every {options('sample_interval_min', ' min')}."),
        row("audio", "Hydrophone recordings",
            f"{clip['default']} s at " + " · ".join(f"{h:02d}:00" for h in hours) + " UTC",
            "One clip before each slot, summarised into the next packet; normal power mode only. "
            f"Clip length {options('audio_clip_s', ' s')}, where 0 turns recording off. The "
            f"{int(_number(config, 'ACOUSTIC_SAMPLE_RATE_HZ')):,} Hz sample rate is fixed."),
        row("power_modes", "Power-saving thresholds",
            f"Conserve below {conserve['default'] / 1000:.2f} V · critical below {critical['default'] / 1000:.2f} V",
            f"Below conserve the buoy skips audio and sends in {_every_nth(every['default'])} used slot; below "
            "critical it only logs temperature. The defaults will be retuned for the final battery pack."),
        row("humidity_alert", "Housing humidity alert", f"{humidity['default']} %RH",
            "Readings at or above it are flagged HUMIDITY_HIGH, the first sign of a leak. The default is a "
            "placeholder until the leak calibration."),
        row("radio", "Radio", f"{_number(config, 'LORA_FREQUENCY_MHZ'):g} MHz · "
            f"+{int(_number(config, 'LORA_TX_POWER_DBM'))} dBm · BW 500 kHz · SF12 · CR 4/8",
            "Fixed by the RFM95's FCC grant; the shore station must match it exactly.", change="firmware"),
        row("downlink", "Settings listen window",
            f"{_number(config, 'DOWNLINK_LISTEN_MS') / 1000:g} s after each send",
            "How long the buoy listens for a settings command. Fixed, so a bad value can never cut a "
            "buoy off.", change="firmware"),
        row("firmware", "Firmware", f"{fw} · packet v{int(_number(packet, 'SCOUT_PACKET_VERSION'))}",
            "The version in the repo. Each buoy reports its own in every packet.", change="firmware"),
    ]


def render() -> str:
    data = {"source": "firmware/src/config.h and library headers, via scripts/export_buoy_config.py",
            "settings": settings(), "remote": remote(),
            "tierGapMv": _settings_macros()["SCOUT_SET_MIN_TIER_GAP_MV"]}
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    OUT.write_text(render())
    print(f"wrote {OUT.relative_to(_ROOT)}")  # noqa: T201 — CLI output
