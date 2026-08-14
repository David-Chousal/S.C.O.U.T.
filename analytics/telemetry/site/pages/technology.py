"""Technology — how SCOUT works, from sleeping buoy to public dashboard."""

from __future__ import annotations

from .. import assets, components as c
from ..context import SiteContext

TITLE = "Technology — S.C.O.U.T."
DESCRIPTION = (
    "How the S.C.O.U.T. buoy works: solar power, a duty-cycled sensing state machine, an "
    "82-byte daily LoRa packet to a Raspberry Pi shore station, and a self-contained telemetry "
    "pipeline that publishes the dashboard."
)


def _architecture() -> str:
    return c.section(
        c.head_block("Architecture", "One data path, end to end",
                     "The buoy senses and sleeps; once a day it sends a single tiny packet to "
                     "shore; the shore station turns packets into science and republishes the "
                     "dashboard. No server runs between them.")
        + '<figure class="figure-card reveal" style="margin-top:2.4rem">'
        + assets.datapath_svg()
        + "<figcaption>Buoy → LoRa → shore Raspberry Pi → this dashboard. Every hop is "
        "designed around a once-per-day, 82-byte summary.</figcaption></figure>"
    )


def _subsystems() -> str:
    specs = [
        ("solar", "Power", "Solar + LiFePO₄",
         "A solar panel and MPPT charger keep a lithium-iron-phosphate battery topped up. The "
         "target is autonomous operation for 1+ year deployments."),
        ("cpu", "Compute", "Duty-cycled state machine",
         "The microcontroller sleeps most of the time, waking on an RTC alarm to sense, log, "
         "and periodically transmit — the key to a year on a battery."),
        ("radio", "Comms", "LoRa, not cellular",
         "A 915 MHz LoRa link reaches roughly 2 km line-of-sight to shore, with no cellular "
         "service or internet required at the buoy."),
        ("cpu", "Firmware", "SAMD21, verified codec",
         "Firmware targets the Feather M0 (Arduino SAMD21). The packet codec is byte-identical "
         "to the shore decoder and unit-verified; the scheduler too."),
        ("anchor", "Mechanical", "Sealed, moored, serviceable",
         "Electronics stay sealed above the waterline; one sensor of each modality sits at a "
         "single point beneath the buoy, with field spares on hand."),
        ("cpu", "Shore", "Raspberry Pi pipeline",
         "The shore Pi validates each packet, stores it, runs QC → DHW → trends, and "
         "regenerates this static site — on the Python standard library."),
    ]
    grid = "".join(
        f'<div class="col-2">{c.feature_card(g, k, t, b)}</div>' for g, k, t, b in specs
    )
    return c.section(
        c.head_block("Subsystems", "Six parts, one discipline: do less, less often")
        + f'<div class="bento" style="margin-top:2.4rem">{grid}</div>',
        cls="section-sm",
    )


def _packet() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-3">'
        + c.head_block("The daily packet", "82 bytes, once a day")
        + '<div class="prose" style="margin-top:1.4rem"><p>Bandwidth, not storage, is the '
        "binding constraint on a LoRa link. So the buoy stores everything locally and transmits "
        "only a compact daily <em>summary</em> — statistics, not waveforms.</p>"
        '<p class="callout"><strong>Raw audio is never transmitted.</strong> Moving waveform '
        "data over LoRa is not bandwidth-feasible; the buoy stores audio onboard and sends the "
        "82-byte summary instead. This is settled design, not an open question.</p></div></div>"
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
        + c.head_block("Build platform", "Decided, and unblocking",
                       "The microcontroller and radio are settled (ADR-0001), which unblocks "
                       "firmware and wiring.")
        + '<div class="prose" style="margin-top:1rem"><p>The <strong>Adafruit Feather M0 + '
        "RFM95</strong> is the confirmed build platform — an Arduino SAMD21 core with the "
        "RadioHead <code>RH_RF95</code> driver. An ESP32-C3 + SX1262 is retained as the future "
        "production-PCB target; firmware is written against the SAMD21 today.</p></div></div>"
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
                      "Do less, less often — for a year at a time",
                      "SCOUT earns its endurance by sleeping. Everything below follows from one "
                      "constraint: a solar buoy that sends a single tiny packet a day.")
        + _architecture()
        + _subsystems()
        + _packet()
        + _platform()
        + c.cta("Next", "The science that turns temperature into a warning",
                '<a class="btn btn-primary" href="../science/">Read the science</a>'
                '<a class="btn" href="../analytics/">See live data</a>')
    )
