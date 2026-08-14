"""Science — the reef thermal-stress methodology behind the numbers."""

from __future__ import annotations

from .. import assets, components as c
from ..context import SiteContext

TITLE = "Science · S.C.O.U.T."
DESCRIPTION = (
    "The science behind SCOUT's dashboard: NOAA Coral Reef Watch thermal-stress metrics "
    "(HotSpot, Maximum Monthly Mean, the bleaching threshold, and Degree Heating Weeks), plus "
    "turbidity anomaly detection and Mann-Kendall trends, with their limitations."
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
        c.head_block("Thermal stress", "Thermal stress metrics",
                     "SCOUT uses NOAA Coral Reef Watch's operational framework, the standard "
                     "method for anticipating mass coral bleaching.")
        + '<div class="bento" style="margin-top:2.4rem;align-items:start">'
        '<div class="col-3 prose">'
        + c.spec([
            ("MMM", "The Maximum Monthly Mean: the warmest of the site's climatological monthly "
                    "mean temperatures, taken from a long baseline rather than the deployment. "
                    "It is a required input."),
            ("HotSpot", "max(0, daily SST − MMM), the amount by which a day is warmer than the "
                        "climatological maximum."),
            ("Threshold", "MMM + 1 °C. Sustained temperature above this drives stress."),
            ("DHW", "The trailing 12-week sum of HotSpots ≥ 1 °C, in °C-weeks: "
                    "Σ(HotSpot ≥ 1 over 84 days) ⁄ 7."),
        ])
        + "</div>"
        '<figure class="figure-card col-3 reveal">'
        + assets.dhw_svg()
        + "<figcaption>When daily temperature crosses the bleaching threshold, the excess "
        "accumulates as Degree Heating Weeks, a measure of the reef's heat exposure over "
        "time.</figcaption></figure>"
        "</div>"
    )


def _alerts() -> str:
    return c.section(
        c.head_block("Alert levels", "Bleaching alert levels")
        + '<div style="margin-top:2rem">'
        + c.data_table(
            "NOAA Coral Reef Watch bleaching alert levels. Warning and above require a current "
            "HotSpot of at least 1 °C. If the water cools, accumulated DHW no longer raises the "
            "alert.",
            ["Level", "Condition", "Meaning"], _ALERT_ROWS)
        + "</div>",
        cls="section-sm",
    )


def _pipeline() -> str:
    stages = [
        ("cpu", "01 · Quality control", "Quality control",
         "The pipeline reports completeness against the 30-minute cadence, along with gaps, "
         "duplicates, and implausible readings. It does not drop or interpolate data."),
        ("temp", "02 · Daily aggregation", "Daily aggregation",
         "A day is given a mean temperature only if at least 50% of its samples are present. "
         "Sparse days keep their place on the calendar but contribute no temperature."),
        ("turbidity", "03 · Turbidity", "Turbidity",
         "Because the sensor is uncalibrated, it reports relative events rather than NTU, using "
         "an Iglewicz–Hoaglin modified z-score on the raw samples."),
        ("waves", "04 · Trends", "Trends",
         "A non-parametric, outlier-robust test for monotonic change, with an autocorrelation "
         "correction when available. Statistical power is limited early in a deployment."),
    ]
    grid = "".join(
        f'<div class="col-3">{c.feature_card(g, k, t, b)}</div>' for g, k, t, b in stages
    )
    return c.section(
        c.head_block("The pipeline", "The analysis pipeline",
                     "Every stage runs on the Python standard library, so it executes and is "
                     "unit-tested on a bare Raspberry Pi.")
        + f'<div class="bento" style="margin-top:2.4rem">{grid}</div>',
        cls="section-sm",
    )


def _caveats() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-2">'
        + c.head_block("Limitations", "Limitations")
        + "</div>"
        '<div class="col-4 prose">'
        "<p><strong>Diurnal bias.</strong> CRW builds daily SST from nighttime satellite "
        "retrievals to suppress skin warming. A shallow surface buoy sees a real diurnal cycle, "
        "so its daily mean can run slightly warm. The pipeline reports daily coverage so this "
        "is auditable.</p>"
        "<p><strong>Gap bias.</strong> DHW over a window with missing days sums only the days "
        "present, which biases it low. The pipeline reports each day's window coverage.</p>"
        "<p><strong>MMM dependency.</strong> Results are only as good as the supplied climatology. "
        "For Hawaii, the MMM is read from the CRW 5 km product for the deployment cell.</p>"
        "<p><strong>Uncalibrated turbidity.</strong> Output is in ADC counts, not NTU, so SCOUT "
        "reports relative events only. A calibration curve against turbidity standards is a "
        "documented follow-up.</p>"
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
                      "The science",
                      "SCOUT's readings only mean something in the context of established reef "
                      "science. This page explains the methods it uses and their limitations.")
        + _thermal()
        + _alerts()
        + _pipeline()
        + _caveats()
        + _refs()
        + c.cta("See it live", "The metrics on live data",
                '<a class="btn btn-primary" href="../analytics/">Open the dashboard</a>'
                '<a class="btn" href="../technology/">How the data gets there</a>')
    )
