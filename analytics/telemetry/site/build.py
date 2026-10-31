"""Assemble the full static site from a telemetry report.

Layout emitted into ``out_dir``::

    index.html                 Home
    technology/index.html      How it works
    science/index.html         Methodology
    about/index.html           Team & story
    analytics/, fleet/         forwarding pages to the console (the data moved there 2026-10-30)
    assets/…                   copied static assets (fonts, images) + credits.html

Every page is self-contained. The live data is shown only in the team console
(``console.scoutscu.com``), where guests can sign in to read it.
"""

from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path

from . import components, imagery, layout
from .layout import CONSOLE_URL
from .context import LiveStats, SiteContext
from .pages import about, home, science, technology

# Alert → CSS class (colour lives in the design tokens, theme-aware).
_ALERT_CLASS = {
    "No Stress": "a-nostress",
    "Bleaching Watch": "a-watch",
    "Bleaching Warning": "a-warning",
    "Alert Level 1": "a-alert1",
    "Alert Level 2": "a-alert2",
    "Alert Level 3": "a-alert3",
    "Alert Level 4": "a-alert4",
    "Alert Level 5": "a-alert5",
}

_STATIC = Path(__file__).parent / "static"

# Docs bundled into the chat assistant's knowledge, in priority order: the plain-language
# overview and the Hub (the current source of truth) first, then core sensor/schema/decision
# reference, then deep methodology docs last. Relative to the repo root; missing files skipped.
#
# The caps are sized for Groq's FREE-tier rate limit, not the model's context window. The whole
# knowledge base (~29k tokens) blows past the ceiling, so every request 429s. That ceiling is
# now 8k tokens/minute (it was 12k; Groq tightened it), and the context is re-sent on every
# question, so it sets the per-question cost directly: ~2.2k tokens of context + system prompt
# + turns + the reply reservation lands near ~2.9k, giving roughly 2-3 questions a minute across
# ALL visitors to the public site -- the limit is per-organization, not per-user.
# Lowest-priority docs fall off the end first when the total cap bites, so the essentials always
# survive. If the account moves to a paid Groq tier, these caps can be raised well past this.
_CHAT_DOCS = (
    "docs/overview/mvp-system-overview.md",
    "docs/hub/facts.md",
    "docs/hub/status.md",
    "docs/hub/decision-log.md",
    "docs/engineering/sensor-selection.md",
    "docs/engineering/data-schema.md",
    "docs/hub/design-notes.md",
    "docs/hub/research/open-questions.md",
    "docs/decisions/0001-mcu-and-radio-selection.md",
    "docs/decisions/0002-lifepo4-charging-path.md",
    "docs/decisions/0003-single-point-sensing.md",
    "docs/overview/project-update-2026-07.md",
    "docs/engineering/shore-station.md",
    "docs/hub/research/sources.md",
    "docs/analysis/telemetry-methodology.md",
    "docs/analysis/coral-bioacoustic-methodology.md",
    "docs/engineering/engineering-design-document.md",
)
_CHAT_CONTEXT_CAP = 9_000
_CHAT_PER_FILE_CAP = 1_800


def _write_chat_context(out: Path) -> None:
    """Emit ``chat-context.txt`` — the Hub + core docs concatenated — for the chat proxy to read
    and inject as knowledge. Sourced from the repo's ``docs/`` (three levels up from this
    package); if that isn't present (e.g. building outside the repo) the file is simply skipped."""
    repo_root = Path(__file__).resolve().parents[3]
    if not (repo_root / "docs").is_dir():
        return
    parts = [
        "S.C.O.U.T. project knowledge — concatenated from the repo's Knowledge Hub and core "
        "engineering and science docs. Answer questions about the project using only this.\n"
    ]
    total = 0
    for rel in _CHAT_DOCS:
        p = repo_root / rel
        if not p.exists():
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except OSError:
            continue
        if len(text) > _CHAT_PER_FILE_CAP:
            text = text[:_CHAT_PER_FILE_CAP] + "\n…(truncated)…\n"
        block = f"\n\n===== {rel} =====\n{text}"
        if total + len(block) > _CHAT_CONTEXT_CAP:
            break
        parts.append(block)
        total += len(block)
    _write(out / "chat-context.txt", "".join(parts))


def _copy_static(assets_out: Path) -> None:
    """Copy bundled static assets (fonts, images) into ``<out>/assets`` if any are present."""
    if not _STATIC.exists():
        return
    for child in _STATIC.iterdir():
        if child.name.startswith(".") or child.name == "README.md":
            continue
        dest = assets_out / child.name
        if child.is_dir():
            shutil.copytree(child, dest, dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns(".*"))
        else:
            assets_out.mkdir(parents=True, exist_ok=True)
            shutil.copy2(child, dest)


def _fmt(value: float | None, unit: str, digits: int = 1) -> str:
    return f"{value:.{digits}f} {unit}" if value is not None else "—"


def _live_stats(report, banner: str | None, status_html: str) -> LiveStats:
    daily = report.daily
    latest_temp = next((d.temp_mean for d in reversed(daily) if d.temp_mean is not None), None)
    latest_batt = next((d.battery_min_v for d in reversed(daily) if d.battery_min_v is not None), None)
    ts = report.thermal_summary
    alert = report.thermal[-1].alert if report.thermal else "No data"
    span = (f"{report.qc.first:%Y-%m-%d} → {report.qc.last:%Y-%m-%d}"
            if report.qc.first and report.qc.last else "no data")
    mmm = "MMM %.2f °C" % report.mmm if report.mmm is not None else "no MMM set"
    return LiveStats(
        current_alert=alert,
        alert_class=_ALERT_CLASS.get(alert, ""),
        latest_temp=_fmt(latest_temp, "°C", 1),
        latest_batt=_fmt(latest_batt, "V", 2),
        completeness=f"{report.qc.completeness_pct:g}%",
        peak_dhw=f"{ts.peak_dhw:g} °C-wk" if ts else "—",
        turbidity_events=len(report.turbidity_anomalies.events),
        n_records=report.qc.n_records,
        span=span,
        mmm=mmm,
        is_sample=bool(banner),
        status_html=status_html,
    )


def build_site(
    report,
    out_dir: str | Path,
    *,
    banner: str | None = None,
    generated_at: datetime | None = None,
) -> Path:
    """Build the whole site into ``out_dir`` and return the site root path.

    ``report`` is the primary (single-stream) analysis behind Home's live status band.
    """
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    assets_out = out / "assets"
    _copy_static(assets_out)

    generated_at = generated_at or datetime.now(timezone.utc)
    generated = generated_at.strftime("%Y-%m-%d %H:%M UTC")
    fonts_present = (assets_out / "fonts" / "dmsans-latin.woff2").exists()
    img_dir = assets_out / "img"
    # No site-wide ribbon: the sample-data notice appears on the Home live band instead.
    ribbon = None
    from .. import freshness
    fresh = freshness.assess(report.received[-1] if report.received else None,
                             now=generated_at, faults=report.latest_flags,
                             tx_count=report.tx_count)
    live = _live_stats(report, banner, components.status_line(fresh))

    def page(base: str, active: str, mod, body_html: str) -> str:
        return layout.document(
            title=mod.TITLE, description=mod.DESCRIPTION, active=active, body=body_html,
            base=base, ribbon=ribbon, generated=generated, fonts_present=fonts_present,
        )

    ctx_root = SiteContext(live, "", fonts_present, img_dir, ribbon, banner)
    ctx_deep = SiteContext(live, "../", fonts_present, img_dir, ribbon, banner)

    _write(out / "index.html", page("", "home", home, home.body(ctx_root)))
    _write(out / "technology" / "index.html",
           page("../", "technology", technology, technology.body(ctx_deep)))
    _write(out / "science" / "index.html",
           page("../", "science", science, science.body(ctx_deep)))
    _write(out / "about" / "index.html", page("../", "about", about, about.body(ctx_deep)))

    # The Analytics and Fleet pages moved to the console; links people already shared land here.
    for old in ("analytics", "fleet"):
        _write(out / old / "index.html", _forward_page(CONSOLE_URL))

    # Image-credits page (required by the Ocean Image Bank licence when photos are placed).
    _write(assets_out / "credits.html", layout.document(
        title="Image credits · S.C.O.U.T.", description="Photography attributions for the "
        "S.C.O.U.T. site.", active="", body=imagery.credits_page_body(img_dir), base="../",
        fonts_present=fonts_present,
    ))

    # Knowledge context for the "Ask S.C.O.U.T." chat proxy (chatbot/worker.js reads this).
    _write_chat_context(out)
    return out


def _forward_page(url: str) -> str:
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        f'<meta http-equiv="refresh" content="0; url={url}">'
        '<meta name="robots" content="noindex"><title>Moved to the console · S.C.O.U.T.</title>'
        f'</head><body><p>The live data is now in the <a href="{url}">S.C.O.U.T. console</a>.</p>'
        "</body></html>"
    )


def _write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
