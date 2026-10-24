"""Tokens only the dashboard pages use: chart series and categorical colours, spare z-index and
motion steps, and the small section space.

No authored page references them, so the site bundle skips these declarations to stay inside
the CSS budget (``tokens.DASHBOARD_CSS``).
"""

from . import tokens

CSS = tokens.DASHBOARD_CSS
