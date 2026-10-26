#!/usr/bin/env python3
"""Write console/worker/battery-life.json from analytics/telemetry/battery_life.py (SCO-198).

The console shows the same battery-life estimates as the public dashboard. The model is Python;
the console is a Worker, so it reads this export instead of a second copy of the arithmetic.
analytics/telemetry/tests/test_battery_life.py fails if the committed file drifts from the
model, so rerun this after changing a power-budget figure:

    python3 scripts/export_battery_life.py
"""

from __future__ import annotations

import json
import pathlib
import sys

_ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT / "analytics"))

from telemetry.battery_life import as_json_dict  # noqa: E402

OUT = _ROOT / "console" / "worker" / "battery-life.json"


def render() -> str:
    return json.dumps(as_json_dict(), indent=2) + "\n"


if __name__ == "__main__":
    OUT.write_text(render())
    print(f"wrote {OUT.relative_to(_ROOT)}")  # noqa: T201 — CLI output
