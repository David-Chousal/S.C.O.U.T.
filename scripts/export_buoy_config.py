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


def settings() -> list[dict]:
    config = _deployed(CONFIG_H.read_text())
    packet = PACKET_H.read_text()
    reg = {r["key"]: r for r in remote()}
    slots = _numbers(config, "TX_SLOTS_SOD")
    hours = _numbers(config, "AUDIO_HOURS_UTC")
    firmware = "Firmware update (config.h); over-the-air updates are not built yet"
    radio = "By radio, from Settings → Buoys"

    def row(key, label, value, change=firmware, status="decided", note="", source="firmware/src/config.h"):
        return {"key": key, "label": label, "value": value, "change": change, "status": status,
                "note": note, "source": source}

    def span(key):
        r = reg[key]
        return ", ".join(map(str, r["choices"])) if "choices" in r else f"{r['min']}–{r['max']}"

    lib = "firmware/lib/scout_settings/scout_settings.h"
    return [
        row("tx_count", "Transmits a day", f"{span('tx_count')} (default {reg['tx_count']['default']})",
            change=radio, note="Treated as signed off (SCO-198)", source=lib),
        row("tx_slots", "Transmit slots", " · ".join(f"{_hhmm(s)} UTC" for s in slots),
            change=radio, source=lib,
            note=f"At slot phase 0. A count of 1 uses the first slot; 2 the first and last; 3 all three. "
                 f"The slot phase ({span('slot_phase_h')} h) moves them later"),
        row("sample_interval", "Sensor readings",
            f"every {reg['sample_interval_min']['default']} min ({span('sample_interval_min')})",
            change=radio, source=lib),
        row("audio", "Hydrophone recordings",
            f"{reg['audio_clip_s']['default']} s at "
            + ", ".join(f"{h:02d}:00" for h in hours)
            + f" UTC · {int(_number(config, 'ACOUSTIC_SAMPLE_RATE_HZ')):,} Hz",
            change=radio, source=lib,
            note=f"Clip {span('audio_clip_s')} s by radio (0 = off); the sample rate is firmware only "
                 "(ADR-0011). Normal power mode only"),
        row("power_modes", "Power-saving thresholds",
            f"conserve below {reg['conserve_mv']['default'] / 1000:.2f} V · "
            f"critical below {reg['critical_mv']['default'] / 1000:.2f} V",
            change=radio, status="provisional", source=lib,
            note="Defaults depend on the final battery pack (ADR-0007)"),
        row("humidity_alert", "Housing humidity alert", f"{reg['humidity_alert_pct']['default']} %RH",
            change=radio, status="provisional", source=lib,
            note="Default is a placeholder until the leak calibration (SCO-204)"),
        row("radio", "Radio", f"{_number(config, 'LORA_FREQUENCY_MHZ'):g} MHz · "
            f"+{int(_number(config, 'LORA_TX_POWER_DBM'))} dBm · BW 500 kHz · SF12 · CR 4/8",
            note="Set by the FCC grant; never changed by radio (config.h)"),
        row("downlink", "Settings downlink listen window",
            f"{_number(config, 'DOWNLINK_LISTEN_MS') / 1000:g} s after each send",
            note="Never changed by radio, so a wrong value cannot lock a buoy out"),
        row("firmware", "Firmware",
            f"v{int(_number(config, 'FW_MAJOR'))}.{int(_number(config, 'FW_MINOR'))}.{int(_number(config, 'FW_PATCH'))}"
            f" · packet v{int(_number(packet, 'SCOUT_PACKET_VERSION'))}",
            note="What the buoy reports is in its packets; this is the firmware in the repo"),
    ]


def render() -> str:
    data = {"source": "firmware/src/config.h and library headers, via scripts/export_buoy_config.py",
            "settings": settings(), "remote": remote(),
            "tierGapMv": _settings_macros()["SCOUT_SET_MIN_TIER_GAP_MV"]}
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    OUT.write_text(render())
    print(f"wrote {OUT.relative_to(_ROOT)}")  # noqa: T201 — CLI output
