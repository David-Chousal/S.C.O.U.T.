"""S.C.O.U.T. static website — a self-contained, script-free, theme-aware multi-page site.

The whole site is generated from Python (standard library only). Every page is a standalone
HTML document with the design-system CSS inlined and all graphics as inline SVG — no external
scripts, fonts, stylesheets, or network requests. It renders offline, passes a strict CSP, and
the light/dark themes follow ``prefers-color-scheme``. Motion is pure CSS and always degrades
to "content visible" under ``prefers-reduced-motion``.

The live data is shown in the team console (``console.scoutscu.com``), not here: Home carries a
status band computed from a :class:`~telemetry.pipeline.TelemetryReport` on every publish, and
the old Analytics and Fleet addresses forward to the console.

Entry point: :func:`telemetry.site.build.build_site`.
"""

from __future__ import annotations

from .build import build_site

__all__ = ["build_site"]
