"""The design-system CSS is pinned byte for byte while ``theme`` is restructured.

A pure refactor must keep these digests; a deliberate design change updates them in the same
commit, with the reason in the commit message. History: taken on main at 563a1f7 (after #189)
before the package split; re-pinned when the Tideline token tiers were added (every rendered
page within 3/255 per channel of the previous output), when the fonts changed (step 3), for the
accessibility pass (step 4), for shape, space and motion (step 5),
for the chart rebuild (step 6), and for
minified, bundled output (step 7), for the instrument layer
(step 8), and for the view-data toggle and the sand mobile header and its height token (step 8 review), and for NOAA
Alert Levels 3–5 with the badge label colours moved to the dashboard bundle (SCO-212), and for the status
glyph shared with the Home hero strip, paid for by moving dashboard-only tokens out of the site
bundle, and for the Reef sound panel (acoustic summary series colour and band bars, SCO-233;
dashboard bundle only, the site bundle is byte-identical), and for the stability-explorer
frame on the Technology page (``.sim-frame``), and for dropping the dashboard bundle once the
Analytics and Fleet pages moved to the console (2026-10-30): the pins are now the site bundle,
byte-identical to what the authored pages already shipped, and for drawing every link to
the console as a console key with the console's focus ring (2026-11-13).
"""

import hashlib
import unittest

from telemetry.site import theme


def _digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


class ThemeOutputIsUnchanged(unittest.TestCase):
    def test_styles_without_fonts_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles()),
            "8386f8224eeeb273aba6767b463be858c2a8b3d802addaa2f65113b43bd0fdf0",
        )

    def test_styles_with_fonts_at_the_site_root_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="", fonts_present=True)),
            "e76902cbe0bbeb85670903321bb6a615f2d684d6e98076799948cc0ff36fc687",
        )

    def test_styles_with_fonts_one_level_deep_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="../", fonts_present=True)),
            "4c3aa8dd9d1cbe7064bc17bbbe3136980f54be9673e92348a638bff9c4354090",
        )

    def test_favicon_is_unchanged(self):
        self.assertEqual(
            _digest(theme.FAVICON),
            "b29b9ad23bffc540560e02f8d30f818df8b30a1184e6edf3e150da352d666d70",
        )

    def test_series_labels_are_unchanged(self):
        self.assertEqual(theme.SERIES, {
            "temp": "Daily mean temperature",
            "dhw": "Degree Heating Weeks",
            "turb": "Turbidity (relative)",
            "batt": "Battery minimum",
        })


if __name__ == "__main__":
    unittest.main()
