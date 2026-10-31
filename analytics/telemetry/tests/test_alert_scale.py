"""Every NOAA Coral Reef Watch alert level is styled wherever an alert is shown (SCO-212).

The alert-to-class map is kept local to the page builder, so a level added to
``bleaching.ALERT_LEVELS`` without a map entry would render unstyled with no error.
"""

import unittest

from telemetry import bleaching
from telemetry.site import build, theme


class EveryLevelIsMapped(unittest.TestCase):
    def test_the_alert_class_map_covers_every_level(self):
        self.assertEqual(set(build._ALERT_CLASS), set(bleaching.ALERT_LEVELS))


class EveryLevelIsStyled(unittest.TestCase):
    def test_text_rules_exist_for_every_mapped_class(self):
        css = theme.styles()
        for cls in build._ALERT_CLASS.values():
            with self.subTest(cls=cls):
                self.assertIn(f".{cls}{{", css)


if __name__ == "__main__":
    unittest.main()
