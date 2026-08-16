"""Technology — how S.C.O.U.T. works, from sleeping buoy to public dashboard."""

from __future__ import annotations

from .. import components as c, docnav, drawings
from ..context import SiteContext

TITLE = "Technology · S.C.O.U.T."
DESCRIPTION = (
    "How the S.C.O.U.T. buoy works: solar power, a duty-cycled sensing state machine built to run "
    "unattended for a year, an 82-byte daily LoRa packet to a Raspberry Pi shore station, and a "
    "self-contained telemetry pipeline that publishes the dashboard."
)

# (section id, sidebar label) — ids must match the `sid=` on each section below.
_NAV = [
    ("how", "Data path"),
    ("cycle", "Operating cycle"),
    ("subsystems", "Subsystems"),
    ("platform", "Platform"),
    ("packet", "Daily packet"),
    ("link", "Shore link"),
    ("mechanical", "Mechanical"),
    ("references", "References"),
]

_REPO = "https://github.com/David-Chousal/S.C.O.U.T."
_DOC = f"{_REPO}/blob/main/docs"

# LoRa-over-water propagation — the evidence behind the range target and the shore-antenna plan.
_REFS_COMMS = [
    ("Jovalekić, N., Drndarević, V., Pietrosemoli, E., Darby, I. &amp; Zennaro, M. (2018). "
     "Experimental Study of LoRa Transmission over Seawater. <em>Sensors</em> 18(9), 2853.",
     "https://doi.org/10.3390/s18092853"),
    ("Gutiérrez-Gómez, A. et al. (2021). A Propagation Study of LoRa P2P Links for IoT "
     "Applications: The Case of Near-Surface Measurements over Semitropical Rivers. "
     "<em>Sensors</em> 21(20), 6872.",
     "https://doi.org/10.3390/s21206872"),
]

# The design records on the repo that this page summarises.
_REFS_DOCS = [
    ("Engineering Design Document", f"{_DOC}/engineering/engineering-design-document.md"),
    ("Shore Station (Raspberry Pi)", f"{_DOC}/engineering/shore-station.md"),
    ("On-Board CSV Data Schema", f"{_DOC}/engineering/data-schema.md"),
    ("ADR-0001 · MCU and radio selection", f"{_DOC}/decisions/0001-mcu-and-radio-selection.md"),
    ("ADR-0003 · Single-point sensing", f"{_DOC}/decisions/0003-single-point-sensing.md"),
]


def _architecture() -> str:
    # The data-path section is shared verbatim with the Home page via components.data_path()
    # (a `.section-sm` with id "how"), so the two never drift and the first-section gap is the
    # standard one used everywhere else on the page.
    return c.data_path()


def _cycle() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-3">'
        + c.head_block("Operating cycle", "Built to run unattended for a year",
                       "Battery life is the whole game, so the buoy spends almost all of its time "
                       "asleep and wakes only to do a small, fixed amount of work.")
        + '<div class="prose" style="margin-top:1.2rem">'
        "<p>The controller sits in a low-power standby state and wakes on a real-time-clock alarm "
        "roughly every 30 minutes. It samples, appends one row to the microSD log, checks the "
        "battery, and returns to sleep. A full transmission happens only <strong>once a day</strong>, "
        "not on every wake.</p>"
        "<p>Running untended for a year is a firmware problem as much as a hardware one. A "
        "hardware watchdog resets the buoy if it ever hangs, and the record counter and "
        "last-transmit time are held in retained memory, so a reset resumes the record cleanly "
        "instead of starting over. As the battery falls the buoy conserves first: it transmits "
        "less often and pauses non-essential sensing before it ever risks the core temperature "
        "record. A State-of-Health field rides in every packet, so resets and init failures are "
        "visible from shore without a site visit.</p></div></div>"
        '<div class="col-3">'
        + c.spec([
            ("Wake cadence", "~30 min RTC alarm (48 samples / day)"),
            ("Transmit cadence", "1 packet / day"),
            ("Between samples", "Standby sleep; radio powered down"),
            ("Recovery", "Hardware watchdog resets a hung buoy"),
            ("Continuity", "Record counter &amp; last-TX retained across resets"),
            ("Low battery", "Throttle transmission, pause non-essential sensing"),
            ("Health", "State-of-Health flags travel in every packet"),
        ])
        + "</div></div>",
        cls="section-sm",
        sid="cycle",
    )


def _subsystems() -> str:
    specs = [
        ("solar", "Power", "Solar and LiFePO₄",
         "A solar panel and MPPT charger keep a lithium-iron-phosphate battery charged. The "
         "target is over a year of unattended operation."),
        ("cpu", "Compute", "Duty-cycled state machine",
         "The microcontroller sleeps most of the time and wakes on a timer to sense, log, and "
         "occasionally transmit."),
        ("radio", "Comms", "LoRa radio",
         "A 915 MHz LoRa link reaches roughly 2 km line-of-sight to shore, with no cellular "
         "service or internet required at the buoy."),
        ("cpu", "Firmware", "SAMD21 firmware",
         "Firmware targets the Feather M0 (Arduino SAMD21). The packet codec is byte-identical "
         "to the shore decoder, and both the codec and scheduler are unit-tested."),
        ("anchor", "Mechanical", "Enclosure and mooring",
         "The electronics stay sealed above the waterline. One sensor of each type sits at a "
         "single point below the buoy, with spares kept for field replacement."),
        ("cpu", "Shore", "Raspberry Pi pipeline",
         "The shore Raspberry Pi validates and stores each packet, runs the analysis, and "
         "regenerates this site, using only the Python standard library."),
    ]
    grid = "".join(c.feature_plain(g, k, t, b) for g, k, t, b in specs)
    return c.section(
        c.head_block("Subsystems", "The subsystems")
        + f'<div class="subsystem-grid">{grid}</div>',
        cls="section-sm",
        sid="subsystems",
    )


def _platform() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-3">'
        + c.head_block("Build platform", "Hardware platform",
                       "The microcontroller and radio are settled in ADR-0001, which lets "
                       "firmware and wiring proceed. A production PCB target is kept on the shelf.")
        + '<div class="prose" style="margin-top:1rem"><p>The confirmed build platform is the '
        "<strong>Adafruit Feather M0 with an RFM95 radio</strong>: an Arduino SAMD21 core with "
        "the RadioHead <code>RH_RF95</code> driver, an Adalogger FeatherWing for the microSD "
        "card and PCF8523 real-time clock. An ESP32-C3 with an SX1262 radio is kept as the "
        "future production-PCB target; current firmware is written for the SAMD21.</p></div></div>"
        '<div class="col-3">'
        + c.spec([
            ("Microcontroller", "Adafruit Feather M0 (SAMD21)"),
            ("Radio", "RFM95 LoRa · RadioHead RH_RF95 · 915 MHz"),
            ("Clock", "PCF8523 RTC (wake alarm + timestamps)"),
            ("Storage", "microSD via Adalogger FeatherWing"),
            ("Power", "Solar + MPPT into a LiFePO₄ pack (path open, ADR-0002)"),
            ("Temperature", "DS18B20 digital thermometer (±0.5 °C)"),
            ("Turbidity", "DFRobot SEN0189 optical (uncalibrated)"),
            ("Enclosure", "4-inch Schedule 40 PVC, O-ring end caps"),
            ("Future PCB", "ESP32-C3 + SX1262"),
            ("Decision", "ADR-0001, accepted 2026-08-14"),
        ])
        + "</div></div>",
        cls="section-sm",
        sid="platform",
    )


def _packet() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-3">'
        + c.head_block("The daily packet", "82 bytes, once a day")
        + '<div class="prose" style="margin-top:1.4rem"><p>The binding constraint on a LoRa link '
        "is bandwidth. The buoy stores full data locally and transmits only a compact daily "
        "summary of statistics rather than raw waveforms. The packet layout is a versioned "
        "contract: the firmware encoder and the shore decoder are byte-identical, checked by a "
        "cross-language test so the two can never silently drift apart.</p>"
        '<p class="callout"><strong>Raw audio is never transmitted.</strong> There is not enough '
        "LoRa bandwidth for waveform data, so the buoy stores audio on board and sends only the "
        "82-byte summary. This is a settled design decision.</p></div></div>"
        '<div class="col-3">'
        + c.spec([
            ("Packet size", "82 bytes"),
            ("Cadence", "1 transmission / day"),
            ("Sampling", "1 record / 30 min (48 / day)"),
            ("Carries", "Daily temperature, turbidity &amp; battery summaries"),
            ("Integrity", "Counter + CRC; malformed frames dropped"),
            ("Schema", "Versioned; byte-identical buoy ↔ shore codec"),
        ])
        + "</div></div>",
        sid="packet",
    )


def _link() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-3">'
        + c.head_block("The shore link", "LoRa to a Raspberry Pi on shore",
                       "The buoy talks to a Raspberry Pi on shore over a 915 MHz LoRa link. LoRa "
                       "is built for exactly this: tiny payloads, long range, very low power.")
        + '<div class="prose" style="margin-top:1.2rem">'
        "<p>Over seawater, the water itself is not the problem. Field studies of LoRa over open "
        "seawater have measured clear line-of-sight links out to tens of kilometres, and conclude "
        "the sea surface does not limit the link. The real constraint for S.C.O.U.T. is "
        "<strong>antenna height</strong>: the buoy's antenna sits only centimetres above the "
        "waterline, and near-surface links lose margin as the antenna drops toward the water.</p>"
        "<p>So the roughly 2 km target is deliberately conservative. The plan is to raise the "
        "<em>shore</em> antenna to recover the link budget the low buoy antenna cannot provide, "
        "and to measure real over-saltwater range in the Phase 4 range test rather than trust a "
        "datasheet line-of-sight figure. The evidence for both bounds is in the references "
        "below.</p></div></div>"
        '<div class="col-3">'
        + c.head_block("On shore", "What the Raspberry Pi does")
        + '<div style="margin-top:1.2rem">'
        + c.spec([
            ("Receive", "Listen for the buoy's daily LoRa packet"),
            ("Validate", "Check the counter and CRC; drop malformed frames"),
            ("Store", "Append to CSV, the same schema the buoy logs"),
            ("Analyse", "Run the standard-library telemetry pipeline"),
            ("Publish", "Regenerate and push this static site"),
            ("Range target", "~2 km line of sight (conservative)"),
        ])
        + "</div></div></div>",
        cls="section-sm",
        sid="link",
    )


def _mechanical(ctx: SiteContext) -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-2">'
        + c.head_block("Mechanical", "Sealed above, sensing below")
        + "</div>"
        '<div class="col-4 prose">'
        "<p>The electronics stay dry in a sealed housing above the waterline: a "
        "<strong>4-inch Schedule 40 PVC</strong> body with O-ring end caps, cable glands, and "
        "heat-set inserts for serviceable reassembly. The form is a simple cylinder at the "
        "waterline, tapering to a mooring point below and an antenna above.</p>"
        "<p>Below the housing, S.C.O.U.T. uses <strong>one sensor of each type at a single "
        "point</strong> rather than a multi-depth string (<a class=\"textlink\" "
        f'href="{_DOC}/decisions/0003-single-point-sensing.md">ADR-0003</a>); the extra units on '
        "the bill of materials are field spares. The mooring is fixed and reef-safe, chosen to "
        "hold station with minimal disturbance to what it is measuring.</p></div></div>"
        + drawings.gallery(
            ctx.base, eyebrow="Mechanical design", heading="The printed parts",
            sub="John Ryan Myrdal's CAD for the flotation collar and the turbidity-sensor "
                "housing, printed in PETG. Each drawing links to its full sheet."),
        cls="section-sm",
        sid="mechanical",
    )


def _refs() -> str:
    def render(items: list[tuple[str, str]]) -> str:
        parts = []
        for text, url in items:
            link = f' <a href="{url}">{url.split("//")[-1]}</a>' if url else ""
            parts.append(f"<li>{text}{link}</li>")
        return "".join(parts)

    docs = "".join(f'<li><a href="{url}">{name}</a></li>' for name, url in _REFS_DOCS)
    return c.section(
        c.head_block("References", "Where these choices are grounded",
                     "The communications design leans on published LoRa-over-water propagation "
                     "studies; the rest is specified in the project's own engineering records.")
        + '<div class="bento" style="margin-top:2rem;align-items:start">'
        '<div class="col-3 prose"><h3>Communications over water</h3>'
        f'<ul style="line-height:1.6">{render(_REFS_COMMS)}</ul></div>'
        '<div class="col-3 prose"><h3>Design records</h3>'
        f'<ul style="line-height:1.8">{docs}</ul></div>'
        "</div>",
        cls="section-sm",
        sid="references",
    )


def body(ctx: SiteContext) -> str:
    content = (
        c.page_header("Technology",
                      "How the buoy works",
                      "S.C.O.U.T. runs for a long time because it spends most of its time asleep. One "
                      "constraint shapes the whole design: a solar-powered buoy, deployed for a year "
                      "or more, that can transmit only a single small packet per day.")
        + _architecture()
        + _cycle()
        + _subsystems()
        + _platform()
        + _packet()
        + _link()
        + _mechanical(ctx)
        + _refs()
        + c.cta("Next", "The science behind the metrics",
                '<a class="btn btn-primary" href="../science/">Read the science</a>'
                '<a class="btn" href="../analytics/">See live data</a>')
    )
    return (c.side_critter(ctx.base, "turtle", "right", "1666/1607")
            + docnav.page(title="Technology", items=_NAV, content=content, base=ctx.base))
