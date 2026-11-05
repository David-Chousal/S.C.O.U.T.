"""The remote settings registry: the Python mirror, the C table it mirrors, and the v2 frame.

``firmware/lib/scout_settings`` is the one source. These tests parse its table and defaults and
fail if ``scout_shore.settings`` drifts from them, and pin the digest the firmware test also pins.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

from scout_shore import downlink
from scout_shore import settings as registry

_LIB = Path(__file__).resolve().parents[2] / "firmware" / "lib" / "scout_settings"
_CONFIG_H = Path(__file__).resolve().parents[2] / "firmware" / "src" / "config.h"
_KEY = bytes(range(32))


def _c_table() -> list[tuple[int, str, int, int, int, int, tuple[int, ...]]]:
    header = (_LIB / "scout_settings.h").read_text()
    source = re.sub(r"\s+", " ", (_LIB / "scout_settings.cpp").read_text())
    macros = {name: int(value) for name, value in re.findall(r"#define (SCOUT_\w+) (\d+)u", header)}
    macros.update({"SCOUT_TX_COUNT_MIN": 1, "SCOUT_TX_COUNT_MAX": 3})
    rows = re.findall(r"\{ ?(SCOUT_SET_\w+), \"(\w+)\", (\w+), (\w+), (\w+), (\d+), (\d), \{([\d, ]+)\}\}",
                      source)
    value = lambda token: macros[token] if token in macros else int(token)  # noqa: E731
    return [(value(i), key, value(d), value(lo), value(hi), int(step), tuple(int(c) for c in choices.split(","))[:int(n)])
            for i, key, d, lo, hi, step, n, choices in rows]


class RegistryMatchesFirmware(unittest.TestCase):
    def test_the_python_table_equals_the_c_table(self) -> None:
        table = _c_table()
        self.assertEqual(len(table), len(registry.SPECS))
        for (cid, key, default, low, high, step, choices), spec in zip(table, registry.SPECS):
            with self.subTest(key):
                self.assertEqual((cid, key, default, choices), (spec.id, spec.key, spec.default, spec.choices))
                if not choices:
                    self.assertEqual((low, high, step), (spec.minimum, spec.maximum, spec.step))

    def test_layout_and_tier_gap_match(self) -> None:
        header = (_LIB / "scout_settings.h").read_text()
        self.assertIn(f"#define SCOUT_SETTINGS_LAYOUT {registry.LAYOUT}u", header)
        self.assertIn(f"#define SCOUT_SET_MIN_TIER_GAP_MV {registry.MIN_TIER_GAP_MV}u", header)

    def test_the_longest_clip_is_the_capture_maximum(self) -> None:
        clip = re.search(r"ACOUSTIC_CLIP_SECONDS = (\d+)", _CONFIG_H.read_text())
        audio = next(s for s in registry.SPECS if s.key == "audio_clip_s")
        self.assertEqual(max(audio.choices), int(clip.group(1)))
        self.assertEqual(audio.default, int(clip.group(1)))


class Registry(unittest.TestCase):
    def test_default_digest_is_the_shared_vector(self) -> None:
        self.assertEqual(registry.digest_hex(registry.DEFAULTS), "e674")

    def test_defaults_are_valid(self) -> None:
        self.assertEqual(registry.check(registry.DEFAULTS), registry.DEFAULTS)

    def test_refuses_a_value_off_the_table(self) -> None:
        with self.assertRaises(registry.SettingsError):
            registry.check((3, 0, 45, 60, 3200, 3100, 3, 70))

    def test_refuses_inverted_power_tiers(self) -> None:
        with self.assertRaises(registry.SettingsError):
            registry.check((3, 0, 30, 60, 3200, 3160, 3, 70))

    def test_refuses_the_wrong_number_of_values(self) -> None:
        with self.assertRaises(registry.SettingsError):
            registry.check((3, 0, 30))


class SettingsFrame(unittest.TestCase):
    def test_round_trips(self) -> None:
        command = downlink.SettingsCommand(1, 1803859200, (2, 1, 15, 30, 3300, 3200, 2, 80))
        frame = downlink.encode_settings(command, _KEY)
        self.assertEqual(len(frame), downlink.SETTINGS_SIZE)
        self.assertEqual(downlink.decode_settings(frame, _KEY), command)

    def test_a_snapshot_the_buoy_would_refuse_is_never_built(self) -> None:
        with self.assertRaises(downlink.DownlinkError):
            downlink.SettingsCommand(1, 1803859200, (2, 1, 45, 30, 3300, 3200, 2, 80))

    def test_a_corrupt_or_foreign_frame_is_refused(self) -> None:
        frame = bytearray(downlink.encode_settings(
            downlink.SettingsCommand(1, 1803859200, registry.DEFAULTS), _KEY))
        frame[12] ^= 1
        with self.assertRaises(downlink.DownlinkError):
            downlink.decode_settings(bytes(frame), _KEY)
        good = downlink.encode_settings(downlink.SettingsCommand(1, 1803859200, registry.DEFAULTS), _KEY)
        with self.assertRaises(downlink.DownlinkError):
            downlink.decode_settings(good, bytes(32))


if __name__ == "__main__":
    unittest.main()
