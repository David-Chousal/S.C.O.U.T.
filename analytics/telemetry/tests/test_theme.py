"""The design-system CSS is pinned byte for byte while ``theme`` is restructured.

A pure refactor must keep these digests; a deliberate design change updates them in the same
commit, with the reason in the commit message. History: taken on main at 563a1f7 (after #189)
before the package split; re-pinned when the Tideline token tiers were added (every rendered
page within 3/255 per channel of the previous output), when the fonts changed (step 3), for the
accessibility pass (step 4), and for shape, space and motion (step 5).
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
            "52a54aa03cb8aca45a36e608da12632b5a0d8d5d5c6765bcd503c785f6821e57",
        )

    def test_styles_with_fonts_at_the_site_root_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="", fonts_present=True)),
            "6746070a7bbd4afdc8d9fe8e5ac14268ad9ff729a15f62b1a96474885da07e51",
        )

    def test_styles_with_fonts_one_level_deep_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="../", fonts_present=True)),
            "7797b32373cb23431022d69de0b4cbc6325b3bb0d5ac1da21b36d5c92f29a020",
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
