"""The design-system CSS is pinned byte for byte while ``theme`` is restructured.

A pure refactor must keep these digests; a deliberate design change updates them in the same
commit, with the reason in the commit message. History: taken on main at 563a1f7 (after #189)
before the package split; re-pinned when the Tideline token tiers were added (every rendered
page within 3/255 per channel of the previous output), and when the fonts changed (step 3).
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
            "c936ab013fd9ff45eb13b033a5eac462fcc7360d6e889a838d7393d7908ea583",
        )

    def test_styles_with_fonts_at_the_site_root_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="", fonts_present=True)),
            "c96d045950160fb5d91262ae42424449439afdf93f3ff6ac90ea0653ea73e3d0",
        )

    def test_styles_with_fonts_one_level_deep_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="../", fonts_present=True)),
            "bd8380004ed72b28a2b4cc45f22615f9a96da931bc959feab471c244723e0177",
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
