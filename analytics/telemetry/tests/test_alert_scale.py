"""Every NOAA Coral Reef Watch alert level is styled wherever an alert is shown (SCO-212).

The alert-to-class maps are kept local to each page builder, so a level added to
``bleaching.ALERT_LEVELS`` without a map entry would render unstyled with no error.
"""

import unittest

from telemetry import bleaching, fleet_web, web
from telemetry.site import build, theme


class EveryLevelIsMapped(unittest.TestCase):
    def test_each_alert_class_map_covers_every_level(self):
        maps = {"web": web._ALERT_CLASS, "fleet_web": fleet_web._ALERT_CLASS,
                "fleet_web badge": fleet_web._ALERT_LEVEL, "site build": build._ALERT_CLASS}
        for name, mapping in maps.items():
            with self.subTest(map=name):
                self.assertEqual(set(mapping), set(bleaching.ALERT_LEVELS))


class EveryLevelIsStyled(unittest.TestCase):
    def setUp(self):
        self.css = theme.styles(bundle="all")

    def test_text_band_swatch_and_badge_rules_exist_for_levels_3_to_5(self):
        for n in (3, 4, 5):
            for rule in (f".a-alert{n}{{", f".band-alert{n}{{", f".sw-alert{n}{{",
                         f".alert-badge.lvl-alert{n}{{"):
                with self.subTest(rule=rule):
                    self.assertIn(rule, self.css)

    def test_badge_label_colours_ship_with_the_badges(self):
        # The on-fill colours live only in the dashboard bundle, where badges are painted.
        dash = theme.styles(bundle="dashboard")
        for n in range(1, 6):
            with self.subTest(level=n):
                self.assertIn(f"--alert-alert{n}-on:", dash)
        self.assertNotIn("-on:", theme.styles(bundle="site"))


if __name__ == "__main__":
    unittest.main()
