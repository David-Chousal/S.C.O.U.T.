"""Science — the reef thermal-stress methodology behind the numbers."""

from __future__ import annotations

from .. import assets, components as c
from ..context import SiteContext

TITLE = "Science — S.C.O.U.T."
DESCRIPTION = (
    "The science behind SCOUT's dashboard: NOAA Coral Reef Watch thermal-stress metrics — "
    "HotSpot, Maximum Monthly Mean, the bleaching threshold and Degree Heating Weeks — plus "
    "turbidity anomaly detection and Mann-Kendall trends, with their limitations stated plainly."
)

_ALERT_ROWS = [
    ["No Stress", "HotSpot ≤ 0", "At or below the climatological maximum"],
    ["Bleaching Watch", "0 < HotSpot < 1 °C", "Warm, not yet stressful"],
    ["Bleaching Warning", "HotSpot ≥ 1 °C, DHW < 4", "Stress accumulating"],
    ["Alert Level 1", "HotSpot ≥ 1 °C, 4 ≤ DHW < 8", "Significant bleaching likely"],
    ["Alert Level 2", "HotSpot ≥ 1 °C, DHW ≥ 8", "Severe bleaching + mortality likely"],
]

_REFS = [
    ("Liu, G. et al. (2014). Reef-scale thermal stress monitoring of coral ecosystems: new "
     "5-km global products from NOAA Coral Reef Watch. <em>Remote Sensing</em> 6(11).",
     "https://doi.org/10.3390/rs61111579"),
    ("Skirving, W. et al. (2020). CoralTemp and the Coral Reef Watch coral bleaching heat "
     "stress product suite v3.1. <em>Remote Sensing</em> 12(23), 3856.",
     "https://doi.org/10.3390/rs12233856"),
    ("Hamed, K. H. &amp; Rao, A. R. (1998). A modified Mann-Kendall trend test for "
     "autocorrelated data. <em>Journal of Hydrology</em> 204(1–4).",
     "https://doi.org/10.1016/S0022-1694(97)00125-X"),
    ("Iglewicz, B. &amp; Hoaglin, D. C. (1993). <em>How to Detect and Handle Outliers.</em> "
     "ASQC Quality Press.", ""),
]


def _thermal() -> str:
    return c.section(
        c.head_block("Thermal stress", "How temperature becomes a bleaching warning",
                     "SCOUT uses NOAA Coral Reef Watch's operational framework — the community "
                     "standard for anticipating mass bleaching.")
        + '<div class="bento" style="margin-top:2.4rem;align-items:start">'
        '<div class="col-3 prose">'
        + c.spec([
            ("MMM", "Maximum Monthly Mean — the warmest climatological monthly SST for the site, "
                    "from a long baseline (not the deployment). A required input."),
            ("HotSpot", "max(0, daily SST − MMM) — the positive thermal anomaly."),
            ("Threshold", "MMM + 1 °C. Sustained temperature above this drives stress."),
            ("DHW", "The trailing 12-week sum of HotSpots ≥ 1 °C, in °C-weeks: "
                    "Σ(HotSpot ≥ 1 over 84 days) ⁄ 7."),
        ])
        + "</div>"
        '<figure class="figure-card col-3 reveal">'
        + assets.dhw_svg()
        + "<figcaption>Once daily SST crosses the bleaching threshold, the excess accumulates "
        "into Degree Heating Weeks — the reef's heat dose over time.</figcaption></figure>"
        "</div>"
    )


def _alerts() -> str:
    return c.section(
        c.head_block("Alert levels", "Five states, from calm to critical")
        + '<div style="margin-top:2rem">'
        + c.data_table(
            "NOAA Coral Reef Watch Bleaching Alert Levels. Warning and above require a current "
            "HotSpot ≥ 1 °C — if the water cools, accumulated DHW no longer raises the alert.",
            ["Level", "Condition", "Meaning"], _ALERT_ROWS)
        + "</div>",
        cls="section-sm",
    )


def _pipeline() -> str:
    stages = [
        ("cpu", "01 · Quality control", "Measured, never repaired",
         "Completeness against the 30-min cadence, gaps, duplicates and implausible readings — "
         "reported, never silently dropped or interpolated."),
        ("temp", "02 · Daily aggregation", "Honest daily means",
         "A day earns a mean temperature only if ≥ 50% of its samples are present; sparse days "
         "keep their calendar slot but add no temperature."),
        ("turbidity", "03 · Turbidity", "Relative events, not NTU",
         "The uncalibrated sensor flags positive excursions with an Iglewicz–Hoaglin modified "
         "z-score on the raw per-sample series."),
        ("waves", "04 · Trends", "Mann-Kendall + Sen's slope",
         "A non-parametric, outlier-robust test for monotonic change, with an autocorrelation "
         "correction when available. Power is limited early on."),
    ]
    grid = "".join(
        f'<div class="col-3">{c.feature_card(g, k, t, b)}</div>' for g, k, t, b in stages
    )
    return c.section(
        c.head_block("The pipeline", "From raw records to reviewed metrics",
                     "Every stage runs on the Python standard library — it executes, and is "
                     "unit-tested, on a bare Raspberry Pi.")
        + f'<div class="bento" style="margin-top:2.4rem">{grid}</div>',
        cls="section-sm",
    )


def _caveats() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-2">'
        + c.head_block("Stated plainly", "What these numbers can't tell you")
        + "</div>"
        '<div class="col-4 prose">'
        "<p><strong>Diurnal bias.</strong> CRW builds daily SST from nighttime satellite "
        "retrievals to suppress skin warming; a shallow surface buoy sees a real diurnal cycle, "
        "so its daily mean can run slightly warm. Daily coverage is exposed so this is "
        "auditable.</p>"
        "<p><strong>Gap bias.</strong> DHW over a window with missing days sums only the days "
        "present, biasing it low — so each day's window coverage is reported, not hidden.</p>"
        "<p><strong>MMM dependency.</strong> Results are only as good as the supplied climatology. "
        "For Hawaii, the MMM is read from the CRW 5 km product for the deployment cell.</p>"
        "<p><strong>Uncalibrated turbidity.</strong> Output is ADC counts, not NTU; SCOUT reports "
        "relative events only. A calibration curve against turbidity standards is a documented "
        "follow-up.</p>"
        "</div></div>",
        cls="section-sm",
    )


def _refs() -> str:
    parts = []
    for text, url in _REFS:
        link = f' <a href="{url}">{url.split("//")[-1]}</a>' if url else ""
        parts.append(f"<li>{text}{link}</li>")
    items = "".join(parts)
    return c.section(
        c.head_block("References", "The literature these methods rest on")
        + f'<ul class="prose" style="margin-top:1.4rem;line-height:1.6">{items}</ul>',
        cls="section-sm",
    )


def body(ctx: SiteContext) -> str:
    return (
        c.page_header("Science",
                      "Turning a temperature into a warning",
                      "A number on a buoy is not yet knowledge. Here is the established reef "
                      "science that makes SCOUT's readings mean something — and the honest limits "
                      "of what they can say.")
        + _thermal()
        + _alerts()
        + _pipeline()
        + _caveats()
        + _refs()
        + c.cta("See it live", "Watch the metrics move on real telemetry",
                '<a class="btn btn-primary" href="../analytics/">Open the dashboard</a>'
                '<a class="btn" href="../technology/">How the data gets there</a>')
    )
