"""The design-system CSS is pinned byte for byte while ``theme`` is restructured.

These digests were taken from ``theme.styles()`` on main at 563a1f7 (after #189), before ``theme.py`` was
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
            "774deb1ef1a745fba71c8ca01e4b08bc9d336114c85d1d4f77a3826ddf35da4b",
        )

    def test_styles_with_fonts_at_the_site_root_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="", fonts_present=True)),
            "11f6f7ccc366b762d0ea0f06d14491ea512ece68181d27d55d9fae879fc75df7",
        )

    def test_styles_with_fonts_one_level_deep_matches_the_pinned_css(self):
        self.assertEqual(
            _digest(theme.styles(base="../", fonts_present=True)),
            "35b1d78ef52916c0250991f48cde38f66d3f453b8e1656d803f8686a7fb7a7c4",
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
