"""The design-system CSS is pinned byte for byte while ``theme`` is restructured.

These digests were taken from ``theme.styles()`` on main at dc664e9, before ``theme.py`` was
split into a package. A pure refactor must keep them; a deliberate design change updates them
in the same commit, with the reason in the commit message.
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
            "7f9086d3a819a4814f4cee6a2ff96c7a483a66d737c20ddb581c242a3f5f214b",
        )

    def test_styles_with_fonts_at_the_site_root_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="", fonts_present=True)),
            "989f22565c68ab93cb3f82dcfb91bc5c6ac4c983c76de9004c8b6ce926495d1c",
        )

    def test_styles_with_fonts_one_level_deep_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="../", fonts_present=True)),
            "14af10a24a8df3064e6d99cd3a90832e32172e54a459a07677c5f8a1e9c5b929",
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
