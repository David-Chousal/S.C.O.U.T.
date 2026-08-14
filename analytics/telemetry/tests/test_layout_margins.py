"""CI guard for the layout-margin invariants fixed during the centering / mobile work.

These are the exact rules that, when missing, caused visible bugs this session:

- Content figures (the `.pill` cards, the hero) are ``<figure>`` elements, which carry the
  browser default ``margin: 1em 40px``. Left unreset, that 40px shoves grid items sideways —
  the "leaning right" pills. The reset must exist **and stay scoped to ``main``**, never a
  global ``figure{}`` rule, so the header/footer figures keep their own layout.
- ``.pill`` must keep ``width:100%`` so each card fills its grid track (otherwise the
  aspect-ratio sizes it off the row height and it no longer centres).
- The nearshore pill gap is pinned to the value we set (9px).

They are one-line CSS declarations that are easy to drop in a refactor and hard to catch by
eye, so we assert them here. Runs in CI via ``python -m unittest discover -s telemetry/tests``.
"""

import re
import unittest

from telemetry.site import theme

# Collapse runs of whitespace to a single space so `main figure` (a descendant selector) is
# preserved, while formatting/indentation differences don't matter.
CSS = re.sub(r"\s+", " ", theme.styles())
# Whitespace-free copy for simple declaration containment checks.
CSS_TIGHT = CSS.replace(" ", "")

# (selector, body) for every top-level and nested rule (bodies here contain no nested braces).
_RULES = re.findall(r"([^{}]+)\{([^{}]*)\}", CSS)


class LayoutMarginGuardTest(unittest.TestCase):
    def test_content_figure_margin_reset_is_present_and_scoped_to_main(self):
        self.assertRegex(
            CSS, r"main figure\s*\{\s*margin:\s*0\s*\}",
            "content figures must reset the UA margin via `main figure{margin:0}` "
            "(without it the pill/hero figures inherit margin:1em 40px and mis-align)",
        )

    def test_figure_margin_reset_is_never_global(self):
        """A bare `figure{...margin...}` would also reset the header/footer figures — forbidden.

        The reset is deliberately scoped to `main` so it only touches page content."""
        for selector, body in _RULES:
            if "margin" not in body:
                continue
            individual = {s.strip() for s in selector.split(",")}
            self.assertNotIn(
                "figure", individual,
                "the figure margin reset must stay scoped to `main figure` — never a global "
                "`figure{}` rule that would reach the header or footer",
            )

    def test_pill_card_fills_its_grid_track(self):
        match = re.search(r"\.pill\s*\{([^{}]*)\}", CSS)
        self.assertIsNotNone(match, ".pill rule not found in the design-system CSS")
        self.assertIn(
            "width:100%", match.group(1).replace(" ", ""),
            ".pill must keep width:100% so it fills its grid track and stays centred",
        )

    def test_nearshore_pill_gap_is_pinned(self):
        self.assertRegex(
            CSS_TIGHT, r"\.pill-row\{[^{}]*gap:9px",
            ".pill-row gap must stay 9px (the value set this session)",
        )


if __name__ == "__main__":
    unittest.main()
