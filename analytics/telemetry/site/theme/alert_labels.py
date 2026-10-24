"""Alert-badge label colours (``--alert-*-on``), for the dashboard pages only.

Analytics and Fleet paint NOAA alert levels as solid badges, whose label needs the computed
on-fill colour. The authored pages show an alert as coloured text, so the site bundle skips
these declarations to stay inside the CSS budget.
"""

from . import tokens

CSS = tokens.ALERT_ON_CSS
