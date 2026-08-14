"""Science — the reef methodology behind the numbers (thermal stress, turbidity, bioacoustics)."""

from __future__ import annotations

from .. import assets, components as c
from ..context import SiteContext

TITLE = "Science · S.C.O.U.T."
DESCRIPTION = (
    "The science behind SCOUT: NOAA Coral Reef Watch thermal-stress metrics (HotSpot, Maximum "
    "Monthly Mean, bleaching threshold, Degree Heating Weeks), turbidity anomaly detection, "
    "reef bioacoustics (ACI, BI, NDSI, H, ADI and an Acoustic Quality Score), and Mann-Kendall "
    "trends, with their limitations."
)

_REPO = "https://github.com/David-Chousal/S.C.O.U.T."
_DOC_ACOUSTIC = f"{_REPO}/blob/main/docs/analysis/coral-bioacoustic-methodology.md"
_DOC_ENV = f"{_REPO}/blob/main/docs/analysis/telemetry-methodology.md"

_ALERT_ROWS = [
    ["No Stress", "HotSpot ≤ 0", "At or below the climatological maximum"],
    ["Bleaching Watch", "0 < HotSpot < 1 °C", "Warm, not yet stressful"],
    ["Bleaching Warning", "HotSpot ≥ 1 °C, DHW < 4", "Stress accumulating"],
    ["Alert Level 1", "HotSpot ≥ 1 °C, 4 ≤ DHW < 8", "Significant bleaching likely"],
    ["Alert Level 2", "HotSpot ≥ 1 °C, DHW ≥ 8", "Severe bleaching + mortality likely"],
]

_TRACK_ROWS = [
    ["Water temperature", "Digital thermometer (DS18B20)",
     "Daily mean, HotSpot, Degree Heating Weeks, bleaching alert level"],
    ["Turbidity", "Optical sensor (SEN0189)",
     "Daily median, relative anomaly events (runoff, resuspension, plumes)"],
    ["Battery & power", "Bus voltage",
     "Daily minimum, state-of-health, data completeness"],
    ["Reef soundscape", "Hydrophone",
     "ACI, BI, NDSI, H, ADI, an Acoustic Quality Score, and their trends"],
    ["Dissolved oxygen · light · chlorophyll", "Roadmap",
     "Planned additions to the modular sensing payload"],
]

_INDICES = [
    ("sound", "ACI", "Acoustic Complexity Index",
     "Captures the rapid intensity fluctuations typical of biological sound (fish and "
     "invertebrate calls) while ignoring steady background noise."),
    ("sound", "BI", "Bioacoustic Index",
     "The acoustic energy in the biophony frequency band, a proxy for how much biological sound "
     "the reef is producing."),
    ("waves", "NDSI", "Soundscape Index",
     "The balance between biological and anthropogenic frequency bands. A higher value means a "
     "more natural soundscape."),
    ("leaf", "H", "Acoustic Entropy",
     "The evenness of acoustic energy across time and frequency. A richer, more even soundscape "
     "scores higher."),
    ("waves", "ADI", "Acoustic Diversity Index",
     "The diversity of occupied frequency bands, a Shannon index computed across the spectrum."),
    ("sound", "AQS", "Acoustic Quality Score",
     "A single reef-health score per session, from a PCA that combines the five indices into "
     "one number."),
]

_REFS_THERMAL = [
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

_REFS_ACOUSTIC = [
    ("Sueur, J. et al. (2008). Rapid acoustic survey for biodiversity appraisal (Acoustic "
     "Entropy). <em>PLoS ONE</em> 3(12), e4065.",
     "https://doi.org/10.1371/journal.pone.0004065"),
    ("Pieretti, N., Farina, A. &amp; Morri, D. (2011). A new methodology to infer the singing "
     "activity of an avian community: the Acoustic Complexity Index. <em>Ecological "
     "Indicators</em> 11(3).",
     "https://doi.org/10.1016/j.ecolind.2010.11.005"),
    ("Bertucci, F. et al. (2016). Acoustic indices provide information on the status of coral "
     "reefs. <em>Scientific Reports</em> 6, 33326.",
     "https://doi.org/10.1038/srep33326"),
    ("Kasten, E. P. et al. (2012). The remote environmental assessment laboratory's acoustic "
     "library (NDSI). <em>Ecological Informatics</em> 12.", ""),
    ("Villanueva-Rivera, L. J. et al. (2011). A primer of acoustic analysis for landscape "
     "ecologists (ADI). <em>Landscape Ecology</em> 26.", ""),
    ("Boelman, N. T. et al. (2007). Multi-trophic invasion resistance in Hawaii: bioacoustics "
     "(Bioacoustic Index). <em>Ecological Applications</em> 17(8).", ""),
]


def _tracks() -> str:
    return c.section(
        c.head_block("What SCOUT tracks", "The signals and what we derive",
                     "SCOUT samples a small set of environmental signals and turns each into a "
                     "reviewed metric. Temperature and turbidity transmit daily; the reef "
                     "soundscape is recorded and analysed on board.")
        + '<div style="margin-top:2rem">'
        + c.data_table(
            "Each signal, its sensor, and the metrics the pipeline produces.",
            ["Signal", "Sensor", "What SCOUT derives"], _TRACK_ROWS)
        + "</div>",
    )


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
        "</div>",
        cls="section-sm",
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


def _soundscape() -> str:
    cards = "".join(
        f'<div class="col-2">{c.feature_card(g, k, t, b)}</div>' for g, k, t, b in _INDICES
    )
    return c.section(
        c.head_block("Reef soundscapes", "Listening to the reef",
                     "A healthy reef is loud: snapping shrimp, fish choruses, and the movement "
                     "of the reef itself. SCOUT records the soundscape and reduces it to "
                     "established bioacoustic indices, a biological signal that complements the "
                     "temperature and turbidity record.")
        + f'<div class="bento" style="margin-top:2.6rem">{cards}</div>'
        + '<div class="bento" style="margin-top:2.4rem;align-items:start">'
        '<div class="col-3 prose">'
        "<h3>How the indices stay honest</h3>"
        "<p>A <strong>three-zone frequency model</strong> carves out a 200–1000 Hz mixed band "
        "and excludes it from NDSI, because the usual two-way split misclassified reef-fish "
        "choruses as anthropogenic noise. <strong>Median aggregation</strong> and an "
        "<strong>abiotic contamination filter</strong> keep the indices robust against wind- "
        "and rain-affected recordings at 1.5 m depth.</p>"
        "<p>Health scoring uses a PCA fit <strong>within each session</strong>, so scores are "
        "not comparable across sessions; a separate global PCA drives longitudinal trend "
        "detection with modified Mann-Kendall tests.</p>"
        "</div>"
        '<div class="col-3 prose">'
        "<h3>Validation, and what stays on board</h3>"
        "<p>The pipeline is validated on a published reef dataset from <strong>Sesoko Island, "
        "Okinawa</strong>: eight monthly sessions from August 2017 to July 2018, a stand-in "
        "until SCOUT records its own audio.</p>"
        '<p class="callout"><strong>Raw audio never leaves the buoy.</strong> Waveform data is '
        "far too large for the daily LoRa packet, so the buoy stores recordings on board and "
        "transmits only summary statistics.</p>"
        f'<p><a class="textlink" href="{_DOC_ACOUSTIC}">Full bioacoustic methodology</a></p>'
        "</div></div>",
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
                     "Every environmental stage runs on the Python standard library, so it "
                     "executes and is unit-tested on a bare Raspberry Pi.")
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
        "<p><strong>Acoustic scores are relative.</strong> The indices track change within a "
        "deployment rather than an absolute measure of biodiversity, and they are validated "
        "against a single reference reef. SCOUT has not yet recorded its own audio.</p>"
        "</div></div>",
        cls="section-sm",
    )


def _refs() -> str:
    def render(items: list[tuple[str, str]]) -> str:
        parts = []
        for text, url in items:
            link = f' <a href="{url}">{url.split("//")[-1]}</a>' if url else ""
            parts.append(f"<li>{text}{link}</li>")
        return "".join(parts)

    return c.section(
        c.head_block("References", "The literature these methods rest on",
                     "Thermal-stress and turbidity methods, then reef bioacoustics. Full "
                     "citations with DOIs are in the methodology documents.")
        + '<div class="bento" style="margin-top:2rem;align-items:start">'
        '<div class="col-3 prose"><h3>Thermal stress &amp; turbidity</h3>'
        f'<ul style="line-height:1.6">{render(_REFS_THERMAL)}</ul>'
        f'<p><a class="textlink" href="{_DOC_ENV}">Environmental telemetry methodology</a></p>'
        "</div>"
        '<div class="col-3 prose"><h3>Reef bioacoustics</h3>'
        f'<ul style="line-height:1.6">{render(_REFS_ACOUSTIC)}</ul>'
        f'<p><a class="textlink" href="{_DOC_ACOUSTIC}">Coral bioacoustic methodology</a></p>'
        "</div></div>",
        cls="section-sm",
    )


def body(ctx: SiteContext) -> str:
    return (
        c.page_header("Science",
                      "The science",
                      "SCOUT's readings only mean something in the context of established reef "
                      "science. This page explains what it tracks, the thermal-stress and "
                      "bioacoustic methods behind the numbers, and their limitations.")
        + _tracks()
        + _thermal()
        + _alerts()
        + _soundscape()
        + _pipeline()
        + _caveats()
        + _refs()
        + c.cta("See it live", "The metrics on live data",
                '<a class="btn btn-primary" href="../analytics/">Open the dashboard</a>'
                '<a class="btn" href="../technology/">How the data gets there</a>')
    )
