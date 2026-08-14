"""Technology — how SCOUT works, from sleeping buoy to public dashboard."""

from __future__ import annotations

from .. import assets, components as c
from ..context import SiteContext

TITLE = "Technology · S.C.O.U.T."
DESCRIPTION = (
    "How the S.C.O.U.T. buoy works: solar power, a duty-cycled sensing state machine, an "
    "82-byte daily LoRa packet to a Raspberry Pi shore station, and a self-contained telemetry "
    "pipeline that publishes the dashboard."
)


def _architecture() -> str:
    return c.section(
        c.head_block("Architecture", "The data path",
                     "The buoy senses and sleeps. Once a day it sends a small packet to shore. "
                     "The shore station processes those packets and republishes the dashboard. "
                     "No server runs continuously.")
        + '<figure class="figure-card reveal" style="margin-top:2.4rem">'
        + assets.datapath_svg()
        + "<figcaption>The buoy transmits to a shore Raspberry Pi over LoRa, which processes the "
        "data and publishes this dashboard. Each stage is built around a once-per-day, 82-byte "
        "summary.</figcaption></figure>"
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
    grid = "".join(
        f'<div class="col-2">{c.feature_card(g, k, t, b)}</div>' for g, k, t, b in specs
    )
    return c.section(
        c.head_block("Subsystems", "The subsystems")
        + f'<div class="bento" style="margin-top:2.4rem">{grid}</div>',
        cls="section-sm",
    )


def _packet() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-3">'
        + c.head_block("The daily packet", "82 bytes, once a day")
        + '<div class="prose" style="margin-top:1.4rem"><p>The binding constraint on a LoRa link '
        "is bandwidth. The buoy stores full data locally and transmits only a compact daily "
        "summary of statistics rather than raw waveforms.</p>"
        '<p class="callout"><strong>Raw audio is never transmitted.</strong> There is not enough '
        "LoRa bandwidth for waveform data, so the buoy stores audio on board and sends only the "
        "82-byte summary. This is a settled design decision.</p></div></div>"
        '<div class="col-3">'
        + c.spec([
            ("Packet size", "82 bytes"),
            ("Cadence", "1 transmission / day"),
            ("Sampling", "1 record / 30 min (48 / day)"),
            ("Carries", "Daily temperature, turbidity &amp; battery summaries"),
            ("Schema", "Versioned; byte-identical buoy ↔ shore codec"),
            ("Link", "LoRa · 915 MHz · ~2 km line of sight"),
        ])
        + "</div></div>",
    )


def _platform() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-3">'
        + c.head_block("Build platform", "Hardware platform",
                       "The microcontroller and radio are settled in ADR-0001. This lets "
                       "firmware and wiring proceed.")
        + '<div class="prose" style="margin-top:1rem"><p>The confirmed build platform is the '
        "<strong>Adafruit Feather M0 with an RFM95 radio</strong>: an Arduino SAMD21 core with "
        "the RadioHead <code>RH_RF95</code> driver. An ESP32-C3 with SX1262 is kept as the "
        "future production-PCB target. Current firmware is written for the SAMD21.</p></div></div>"
        '<div class="col-3">'
        + c.spec([
            ("Microcontroller", "Adafruit Feather M0 (SAMD21)"),
            ("Radio", "RFM95 LoRa (RadioHead RH_RF95)"),
            ("Temperature", "DS18B20 digital thermometer"),
            ("Turbidity", "SEN0189 optical (uncalibrated → relative events)"),
            ("Future PCB", "ESP32-C3 + SX1262"),
            ("Decision", "ADR-0001, accepted 2026-08-14"),
        ])
        + "</div></div>",
        cls="section-sm",
    )


def body(ctx: SiteContext) -> str:
    return (
        c.page_header("Technology",
                      "How the buoy works",
                      "SCOUT runs for a long time because it spends most of its time asleep. The "
                      "design follows from one constraint: a solar-powered buoy that transmits a "
                      "single small packet per day.")
        + _architecture()
        + _subsystems()
        + _packet()
        + _platform()
        + c.cta("Next", "The science behind the metrics",
                '<a class="btn btn-primary" href="../science/">Read the science</a>'
                '<a class="btn" href="../analytics/">See live data</a>')
    )
