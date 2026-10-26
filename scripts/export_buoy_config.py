#!/usr/bin/env python3
"""Write console/worker/buoy-config.json: the buoy's firmware settings, read from the firmware.

The console's Settings page shows what each buoy is set to. All but one of those settings live
in firmware (firmware/src/config.h and two library headers), so the values are read from there,
never retyped: a firmware change and the console cannot disagree. Only the daily transmit count
can be changed by radio (SCO-198); every other setting needs a firmware update, and OTA is not
built (SCO-197).

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
    both branches (SAMPLE_INTERVAL_S) reads as the deployed one, not the bench one."""
    return re.sub(r"#ifdef SCOUT_BENCH\n.*?#else\n", "", text, count=1, flags=re.S)


def _number(text: str, name: str) -> float:
    return float(re.sub(r"[uUfF]$", "", _raw(text, name)))


def _numbers(text: str, name: str) -> list[int]:
    return [int(v) for v in re.findall(r"\d+", _raw(text, name))]


def _hhmm(seconds_of_day: int) -> str:
    return f"{seconds_of_day // 3600:02d}:{seconds_of_day % 3600 // 60:02d}"


def settings() -> list[dict]:
    config = _deployed(CONFIG_H.read_text())
    scheduler, packet = SCHEDULER_H.read_text(), PACKET_H.read_text()
    slots = _numbers(config, "TX_SLOTS_SOD")
    hours = _numbers(config, "AUDIO_HOURS_UTC")
    firmware = "Firmware update (config.h); over-the-air updates are not built yet"

    def row(key, label, value, change=firmware, status="decided", note="", source="firmware/src/config.h"):
        return {"key": key, "label": label, "value": value, "change": change, "status": status,
                "note": note, "source": source}

    return [
        row("tx_count", "Transmits a day",
            f"{int(_number(scheduler, 'SCOUT_TX_COUNT_MIN'))}–{int(_number(scheduler, 'SCOUT_TX_COUNT_MAX'))} "
            f"(default {int(_number(scheduler, 'SCOUT_TX_COUNT_DEFAULT'))})",
            change="By radio, from the Fleet page, once the settings downlink is switched on",
            status="pending sign-off", note="Range pending the electrical lead's power sign-off (SCO-198)",
            source="firmware/lib/scout_scheduler/scout_scheduler.h"),
        row("tx_slots", "Transmit slots", " · ".join(f"{_hhmm(s)} UTC" for s in slots),
            note="A count of 1 uses the first slot; 2 the first and last; 3 all three"),
        row("sample_interval", "Sensor readings", f"every {int(_number(config, 'SAMPLE_INTERVAL_S')) // 60} min"),
        row("audio", "Hydrophone recordings",
            f"{int(_number(config, 'ACOUSTIC_CLIP_SECONDS'))} s at "
            + ", ".join(f"{h:02d}:00" for h in hours)
            + f" UTC · {int(_number(config, 'ACOUSTIC_SAMPLE_RATE_HZ')):,} Hz",
            note="Normal power mode only (ADR-0011)"),
        row("power_modes", "Power-saving thresholds",
            f"conserve below {_number(config, 'BATTERY_CONSERVE_MV') / 1000:.2f} V · "
            f"critical below {_number(config, 'BATTERY_CRITICAL_MV') / 1000:.2f} V",
            status="provisional", note="Depends on the final battery pack (ADR-0007)"),
        row("humidity_alert", "Housing humidity alert", f"{_number(config, 'HUMIDITY_ALERT_RH_PCT'):g} %RH",
            status="provisional", note="Placeholder until the leak calibration (SCO-204)"),
        row("radio", "Radio", f"{_number(config, 'LORA_FREQUENCY_MHZ'):g} MHz · "
            f"+{int(_number(config, 'LORA_TX_POWER_DBM'))} dBm · BW 500 kHz · SF12 · CR 4/8",
            note="Set by the FCC grant; not a free choice (config.h)"),
        row("downlink", "Settings downlink listen window",
            f"{_number(config, 'DOWNLINK_LISTEN_MS') / 1000:g} s after each send · off in shipped builds",
            status="pending sign-off", note="Built behind SCOUT_DOWNLINK; needs power sign-off and the FCC check"),
        row("firmware", "Firmware",
            f"v{int(_number(config, 'FW_MAJOR'))}.{int(_number(config, 'FW_MINOR'))}.{int(_number(config, 'FW_PATCH'))}"
            f" · packet v{int(_number(packet, 'SCOUT_PACKET_VERSION'))}",
            note="What the buoy reports is in its packets; this is the firmware in the repo"),
    ]


def render() -> str:
    data = {"source": "firmware/src/config.h and library headers, via scripts/export_buoy_config.py",
            "settings": settings()}
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    OUT.write_text(render())
    print(f"wrote {OUT.relative_to(_ROOT)}")  # noqa: T201 — CLI output
