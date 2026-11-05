"""The console's buoy settings come from the firmware and cannot drift from it (SCO-198 follow-up).

scripts/export_buoy_config.py reads firmware/src/config.h and two library headers into
console/worker/buoy-config.json, which the console's Settings page shows.
"""

import importlib.util
import json
import unittest
from pathlib import Path

from scout_shore import settings as registry
from scout_shore import tx_schedule

REPO = Path(__file__).resolve().parents[2]


def _export():
    spec = importlib.util.spec_from_file_location("export_buoy_config", REPO / "scripts" / "export_buoy_config.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


EXPORT = _export()
DATA = json.loads(EXPORT.OUT.read_text())
SETTINGS = {s["key"]: s for s in DATA["settings"]}


class BuoyConfigExport(unittest.TestCase):
    def test_committed_json_matches_the_firmware(self):
        self.assertEqual(EXPORT.OUT.read_text(), EXPORT.render())

    def test_reads_the_default_sample_interval_from_the_registry(self):
        self.assertEqual(SETTINGS["sample_interval"]["value"], "Every 30 min")

    def test_slots_agree_with_the_shore_schedule(self):
        expected = " · ".join(f"{s // 3600:02d}:{s % 3600 // 60:02d}" for s in tx_schedule.TX_SLOTS_SOD) + " UTC"
        self.assertEqual(SETTINGS["tx_slots"]["value"], expected)

    def test_radio_parameters_and_the_listen_window_never_change_by_radio(self):
        by_radio = {key for key, s in SETTINGS.items() if s["change"] == "radio"}
        self.assertEqual(by_radio, {"tx_count", "tx_slots", "sample_interval", "audio", "power_modes",
                                    "humidity_alert"})

    def test_remote_registry_matches_the_shore_mirror(self):
        exported = [(r["id"], r["key"], r["default"], tuple(r.get("choices", ())), r.get("min", 0),
                     r.get("max", 0), r.get("step", 0)) for r in DATA["remote"]]
        mirror = [(s.id, s.key, s.default, s.choices, s.minimum, s.maximum, s.step) for s in registry.SPECS]
        self.assertEqual(exported, mirror)
        self.assertEqual(DATA["tierGapMv"], registry.MIN_TIER_GAP_MV)

    def test_every_row_says_what_it_does_and_how_it_changes(self):
        for key, setting in SETTINGS.items():
            with self.subTest(key):
                self.assertIn(setting["change"], ("radio", "firmware"))
                self.assertTrue(setting["description"].endswith("."))

    def test_placeholder_defaults_say_so(self):
        self.assertIn("placeholder", SETTINGS["humidity_alert"]["description"])
        self.assertIn("retuned", SETTINGS["power_modes"]["description"])

    def test_descriptions_name_no_tickets_or_adrs(self):
        for key, setting in SETTINGS.items():
            with self.subTest(key):
                self.assertNotRegex(setting["description"], r"SCO-\d|ADR-\d")


if __name__ == "__main__":
    unittest.main()
