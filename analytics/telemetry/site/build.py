"""Assemble the full static site from a telemetry report.

Layout emitted into ``out_dir``::

    index.html                 Home
    technology/index.html      How it works
    science/index.html         Methodology
    about/index.html           Team & story
    analytics/index.html       Live dashboard  (telemetry.web.write_site)
    analytics/telemetry_daily.csv, telemetry_summary.json
    fleet/index.html           Fleet overview  (telemetry.fleet_web, when records are supplied)
    fleet/<buoy_id>/index.html per-buoy dashboards + fleet_summary.json
    assets/…                   copied static assets (fonts, images) + credits.html

Every page is self-contained; the Analytics and per-buoy pages additionally satisfy the strict
no-external-reference contract in ``telemetry/tests/test_web.py``.
"""

from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path

from . import imagery, layout
from .context import LiveStats, SiteContext
from .pages import about, home, science, technology

# Alert → CSS class, mirroring telemetry.web (kept local to avoid importing web at module load).
_ALERT_CLASS = {
    "No Stress": "a-nostress",
    "Bleaching Watch": "a-watch",
    "Bleaching Warning": "a-warning",
    "Alert Level 1": "a-alert1",
    "Alert Level 2": "a-alert2",
}

_STATIC = Path(__file__).parent / "static"

# Docs bundled into the chat assistant's knowledge (Hub first — the current source of truth —
# then core engineering/science docs). Relative to the repo root; missing files are skipped.
# Capped so the Groq prompt stays well inside the model's context window.
_CHAT_DOCS = (
    "docs/hub/facts.md",
    "docs/hub/decision-log.md",
    "docs/hub/status.md",
    "docs/hub/design-notes.md",
    "docs/hub/research/open-questions.md",
    "docs/hub/research/sources.md",
    "docs/overview/mvp-system-overview.md",
    "docs/overview/project-update-2026-07.md",
    "docs/engineering/engineering-design-document.md",
    "docs/engineering/data-schema.md",
    "docs/engineering/shore-station.md",
    "docs/engineering/sensor-selection.md",
    "docs/analysis/telemetry-methodology.md",
    "docs/analysis/coral-bioacoustic-methodology.md",
    "docs/decisions/0001-mcu-and-radio-selection.md",
    "docs/decisions/0002-lifepo4-charging-path.md",
    "docs/decisions/0003-single-point-sensing.md",
)
_CHAT_CONTEXT_CAP = 120_000
_CHAT_PER_FILE_CAP = 16_000


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


def _live_stats(report, banner: str | None) -> LiveStats:
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
    )


def build_site(
    report,
    out_dir: str | Path,
    *,
    banner: str | None = None,
    generated_at: datetime | None = None,
    records=None,
    mmm_by_buoy: dict[str, float] | None = None,
    default_mmm: float | None = None,
) -> Path:
    """Build the whole site into ``out_dir`` and return the site root path.

    ``report`` is the primary (single-stream) analysis that drives Home and the Analytics page.
    When ``records`` are supplied, the **Fleet** page is additionally built: the records are
    grouped by ``buoy_id`` and analysed per buoy (each with its own MMM from ``mmm_by_buoy``,
    falling back to ``default_mmm``) — never blended, since that would corrupt daily means and
    DHW. With a single buoy the Fleet page simply shows one tile.
    """
    from .. import web  # lazy: web imports this package's layout

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    assets_out = out / "assets"
    _copy_static(assets_out)

    generated_at = generated_at or datetime.now(timezone.utc)
    generated = generated_at.strftime("%Y-%m-%d %H:%M UTC")
    fonts_present = (assets_out / "fonts" / "dmsans-latin.woff2").exists()
    img_dir = assets_out / "img"
    # No site-wide ribbon: the sample-data notice appears on the Home live band and the
    # Analytics banner instead.
    ribbon = None
    live = _live_stats(report, banner)

    def page(base: str, active: str, mod, body_html: str) -> str:
        return layout.document(
            title=mod.TITLE, description=mod.DESCRIPTION, active=active, body=body_html,
            base=base, ribbon=ribbon, generated=generated, fonts_present=fonts_present,
            external=True,
        )

    ctx_root = SiteContext(live, "", fonts_present, img_dir, ribbon, banner)
    ctx_deep = SiteContext(live, "../", fonts_present, img_dir, ribbon, banner)

    _write(out / "index.html", page("", "home", home, home.body(ctx_root)))
    _write(out / "technology" / "index.html",
           page("../", "technology", technology, technology.body(ctx_deep)))
    _write(out / "science" / "index.html",
           page("../", "science", science, science.body(ctx_deep)))
    _write(out / "about" / "index.html", page("../", "about", about, about.body(ctx_deep)))

    # Analytics — the data-driven page + raw data, held to the strict self-contained contract.
    web.write_site(report, out / "analytics", banner=banner, generated_at=generated_at,
                   base="../", fonts_present=fonts_present)

    # Fleet — the network view: one overview page + a full dashboard per buoy. Built whenever
    # the raw records are available (so buoys can be analysed in isolation, not blended).
    if records is not None:
        from .. import fleet as fleet_mod
        from .. import fleet_web

        fleet = fleet_mod.analyze_fleet(records, mmm_by_buoy=mmm_by_buoy, default_mmm=default_mmm)
        fleet_web.write_fleet_site(fleet, out / "fleet", banner=banner,
                                   generated_at=generated_at, base="../", fonts_present=fonts_present)

    # Image-credits page (required by the Ocean Image Bank licence when photos are placed).
    _write(assets_out / "credits.html", layout.document(
        title="Image credits · S.C.O.U.T.", description="Photography attributions for the "
        "S.C.O.U.T. site.", active="", body=imagery.credits_page_body(img_dir), base="../",
        fonts_present=fonts_present, external=True,
    ))

    # Knowledge context for the "Ask S.C.O.U.T." chat proxy (chatbot/worker.js reads this).
    _write_chat_context(out)
    return out


def _write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
