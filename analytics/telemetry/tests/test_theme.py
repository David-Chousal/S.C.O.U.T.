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
frame on the Technology page (``.sim-frame``).
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
            "71567f2c4bac2766c164fc3247d793985d55a686a7dd2cf71c40bbc4de4906d6",
        )

    def test_styles_with_fonts_at_the_site_root_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="", fonts_present=True)),
            "102a55ec7efa8c97b839cff9336ec2df7940ae2c3b87d0ebe52bc8b10fb0d57c",
        )

    def test_styles_with_fonts_one_level_deep_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="../", fonts_present=True)),
            "7b78e282ccb504642c80a48008779171e675fb1a76c971819ed20dcdbb895faf",
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
