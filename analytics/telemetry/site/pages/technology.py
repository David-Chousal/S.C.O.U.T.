"""Technology — how S.C.O.U.T. works, from sleeping buoy to public dashboard."""

from __future__ import annotations

from .. import components as c, docnav, drawings
from ..context import SiteContext

TITLE = "Technology · S.C.O.U.T."
DESCRIPTION = (
    "How the S.C.O.U.T. buoy works: battery power, a duty-cycled sensing state machine built to run "
    "unattended for a year, a 44-byte LoRa packet in three fixed slots a day to a shore station, and a "
    "self-contained telemetry pipeline that publishes the dashboard."
)

# (section id, sidebar label) — ids must match the `sid=` on each section below.
_NAV = [
    ("glance", "At a glance"),
    ("how", "Data path"),
    ("cycle", "Operating cycle"),
    ("subsystems", "Subsystems"),
    ("platform", "Platform"),
    ("packet", "The packet"),
    ("link", "Shore link"),
    ("mechanical", "Mechanical"),
    ("references", "References"),
]

_REPO = "https://github.com/David-Chousal/S.C.O.U.T."
_DOC = f"{_REPO}/blob/main/docs"

# The spec block: (label, value, facts.md row, evidence that row must contain). Every value comes
# from docs/hub/facts.md; test_instrument_layer.py fails if a row stops saying it. The LoRa
# spreading factor is left out on purpose: facts.md gives SF12 in "LoRa modem config" and SF7 in
# "Delivery scheme", and that contradiction is for the team to settle, not this page.
SPEC = (
    ("Deployment depth", "2–8 m", "Deployment depth", ("2–8 m",)),
    ("Endurance", "1+ year unattended (target)", "Autonomous deployment", ("1+ year",)),
    ("Build platform", "Feather M0 + RFM95", "MCU + radio (build)", ("Feather M0 + RFM95",)),
    ("Radio", "915 MHz LoRa · BW 500 kHz · +11 dBm", "LoRa modem config",
     ("915.0 MHz", "BW 500 kHz", "+11 dBm")),
    ("Transmit", "3 slots a day · 00:10 / 08:10 / 16:10 UTC", "Daily packet",
     ("3 fixed TX slots per day", "00:10 / 08:10 / 16:10 UTC")),
    ("Range", "~2 km line of sight (datasheet)", "LoRa range", ("~2 km line of sight",)),
    ("Water temperature", "DS18B20 · ±0.5 °C", "Temperature", ("DS18B20", "±0.5 °C")),
    ("Turbidity", "Raw ADC counts · higher = clearer", "Turbidity polarity", ("CLEARER",)),
    ("Power", "Two primary lithium D cells (direction, not final)",
     "Battery chemistry (deployment)", ("two primary lithium D cells",)),
    ("Electronics housing", "4.4 in ID × 5 in tall", "Enclosure dimensions",
     ("4.4 in inside diameter × 5 in tall",)),
    ("Cost", "< $5,000 (engineering target)", "Total system cost",
     ("< $5,000", "Engineering target only")),
)


def _glance() -> str:
    rows = "".join(f'<div class="spec-row"><dt>{label}</dt><dd class="mono">{value}</dd></div>'
                   for label, value, _, _ in SPEC)
    return c.section(
        c.head_block("At a glance", "The buoy in numbers")
        + f'<dl class="spec-block spec stack-6">{rows}</dl>'
        + f'<p class="subtle stack-4">Every value is the canonical one in the project\'s '
        f'<a href="{_REPO}/blob/main/docs/hub/facts.md">Knowledge Hub facts</a>. Targets are '
        "marked as targets; nothing here is a field measurement yet.</p>",
        cls="section-sm",
        sid="glance",
    )

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
    ("Shore Station (ESP32-S3)", f"{_DOC}/engineering/shore-station.md"),
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
        '<div class="bento align-start">'
        '<div class="col-3">'
        + c.head_block("Operating cycle", "Built to run unattended for a year",
                       "Battery life is the whole game, so the buoy spends almost all of its time "
                       "asleep and wakes only to do a small, fixed amount of work.")
        + '<div class="prose stack-4">'
        "<p>The controller sits in a low-power standby state and wakes on a real-time-clock alarm "
        "roughly every 30 minutes. It samples, appends one row to the microSD log, checks the "
        "battery, and returns to sleep. It transmits only in <strong>three fixed slots a day</strong>, "
        "at 00:10, 08:10 and 16:10 UTC, not on every wake.</p>"
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
        ("battery", "Power", "Long-life primary cells",
         "The buoy runs on two sealed 3.6 V lithium-thionyl-chloride D cells with "
         "no solar panel, with the electronics sleeping between wake-ups and every part running "
         "on a single 3.3 V rail. The "
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
        ("cpu", "Shore", "ESP32-S3 base station",
         "A Feather ESP32-S3 with a LoRa radio receives each packet and forwards it over WiFi. "
         "A standard-library Python pipeline validates it, runs the analysis, and regenerates "
         "this site."),
    ]
    entries = "".join(c.feature_plain(g, k, t, b) for g, k, t, b in specs)
    return c.section(
        '<div class="sticky-split">'
        '<div class="sticky-split-head">'
        + c.head_block("Inside the buoy", "The subsystems")
        + "</div>"
        + f'<div class="sticky-split-body">{entries}</div>'
        + "</div>",
        cls="section-sm",
        sid="subsystems",
    )


def _platform(ctx: SiteContext) -> str:
    return c.section(
        '<div class="bento align-start">'
        '<div class="col-3">'
        + c.head_block("MCU and radio", "Hardware platform",
                       "The microcontroller and radio are settled in ADR-0001, which lets "
                       "firmware and wiring proceed. A production PCB target is kept on the shelf.")
        + '<div class="prose stack-4"><p>The confirmed build platform is the '
        "<strong>Adafruit Feather M0 with an RFM95 radio</strong>: an Arduino SAMD21 core with "
        "the RadioHead <code>RH_RF95</code> driver, an Adalogger FeatherWing for the microSD "
        "card and PCF8523 real-time clock. An ESP32-C3 with an SX1262 radio is kept as the "
        "future production-PCB target; current firmware is written for the SAMD21.</p>"
        "<p>The current Rev A schematic — the project's first full electrical baseline — is "
        "ERC-clean and has undergone pre-hardware schematic and integration verification "
        "against manufacturer documentation. Physical assembly and bench validation are the "
        "next step.</p></div></div>"
        '<div class="col-3">'
        + c.spec([
            ("Microcontroller", "Adafruit Feather M0 (SAMD21)"),
            ("Radio", "RFM95 LoRa · RadioHead RH_RF95 · 915 MHz"),
            ("Clock", "PCF8523 RTC (wake alarm + timestamps)"),
            ("Storage", "microSD via Adalogger FeatherWing"),
            ("Power", "Rev A prototype: 1S LiPo through an Adafruit PID 6106 charger/boost "
                      "board, regulated 5 V system rail. Longer-term deployment battery "
                      "architecture remains under evaluation (ADR-0002)"),
            ("Temperature", "DS18B20 digital thermometer (±0.5 °C)"),
            ("Turbidity", "Seeed Grove 101020752 optical transmittance sensor at 3.3 V, "
                          "wired straight to the ADC — bench validation pending"),
            ("Acoustic", "Planned for a later electrical revision; hydrophone/interface "
                         "selection under review"),
            ("Enclosure", "3D-printed flange housing, large O-ring seal, 4.4 in bore"),
            ("Future PCB", "ESP32-C3 + SX1262"),
            ("Decision", "ADR-0001, accepted 2026-08-14"),
        ])
        + "</div></div>"
        + drawings.schematic(
            ctx.base, eyebrow="Electrical design", heading="Rev A electrical schematic",
            sub="SCOUT's Rev A electrical prototype establishes the controller/radio, power, "
                "temperature, turbidity and logging architecture. The schematic is ERC-clean "
                "and has undergone pre-hardware schematic and integration verification "
                "against manufacturer documentation — physical assembly and bench validation "
                "are the next step. Click to view full resolution.",
            caption="Rev A prototype electrical design"),
        cls="section-sm",
        sid="platform",
    )


def _packet() -> str:
    return c.section(
        '<div class="bento align-start">'
        '<div class="col-3">'
        + c.head_block("The packet", "44 bytes, three times a day")
        + '<div class="prose stack-5"><p>The binding constraint on a LoRa link '
        "is bandwidth. The buoy stores full data locally and transmits only its latest compact "
        "reading, three times a day, rather than raw waveforms. The packet layout is a versioned "
        "contract: the firmware encoder and the shore decoder are byte-identical, checked by a "
        "cross-language test so the two can never silently drift apart.</p>"
        '<p class="callout"><strong>Raw audio is never transmitted.</strong> There is not enough '
        "LoRa bandwidth for waveform data, so the buoy stores audio on board and sends a 14-byte "
        "summary of each recording in the 44-byte packet. This is a settled design decision.</p>"
        "</div></div>"
        '<div class="col-3">'
        + c.spec([
            ("Packet size", "44 bytes (140-byte ceiling)"),
            ("Cadence", "3 fixed slots / day: 00:10, 08:10 and 16:10 UTC"),
            ("Sampling", "1 record / 30 min (48 / day)"),
            ("Carries", "The latest temperature, turbidity &amp; battery reading"),
            ("Integrity", "Counter + CRC; malformed frames dropped"),
            ("Schema", "Versioned; byte-identical buoy ↔ shore codec"),
        ])
        + "</div></div>",
        sid="packet",
    )


def _link() -> str:
    return c.section(
        '<div class="bento align-start">'
        '<div class="col-3">'
        + c.head_block("The shore link", "LoRa to a base station on shore",
                       "The buoy talks to an ESP32-S3 base station on shore over a 915 MHz LoRa "
                       "link. LoRa "
                       "is built for exactly this: tiny payloads, long range, very low power.")
        + '<div class="prose stack-4">'
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
        + c.head_block("On shore", "What happens on shore")
        + '<div class="stack-4">'
        + c.spec([
            ("Receive", "An ESP32-S3 base station listens for the buoy's LoRa packets"),
            ("Forward", "It pushes each packet over WiFi toward the dashboard"),
            ("Validate", "Check the counter and CRC; drop malformed frames"),
            ("Analyse", "Run the standard-library telemetry pipeline"),
            ("Publish", "Regenerate and push this static site"),
            ("Range target", "~2 km line of sight (conservative)"),
        ])
        + "</div></div></div>",
        cls="section-sm",
        sid="link",
    )


def _stability(ctx: SiteContext) -> str:
    """The buoy stability explorer (static/stability/) with a plain-language write-up."""
    src = f"{ctx.base}assets/stability/index.html"
    return (
        '<div class="drawings sim">'
        '<div class="drawings-head reveal"><p class="eyebrow">Mechanical design</p>'
        "<h3>Will it stay upright?</h3>"
        '<p class="drawings-sub">A buoy that carries its battery, electronics and antenna above the '
        "waterline is top-heavy by nature. Before printing anything, we float every flotation design "
        "in software and check that waves and boat wakes cannot roll it over.</p></div>"
        '<div class="prose reveal">'
        "<p>The <strong>stability explorer</strong> takes the real CAD of each design, fills it with "
        "water in 3 mm cubes, and loads it with the current payload: housing, battery, boards, "
        "cabling, mooring hardware and sensor pod. For a given total mass it finds the "
        "<strong>waterline</strong> where the water the buoy displaces weighs exactly as much as the "
        "buoy. It then tilts the buoy in 5° steps and recomputes where the buoyancy acts. If the "
        "buoyant force ends up pushing the buoy back upright, the design is stable at that angle.</p>"
        "<p>Slide through the fifteen designs we have modelled, oldest to newest, and change the "
        "housing weight to see what a heavier payload does. Each design shows the same readout:</p>"
        + c.spec([
            ("Draft", "How deep the buoy sits. Too deep and waves wash over the antenna and housing"),
            ("Freeboard", "Height of the top above the waterline"),
            ("GM", "Metacentric height: how stiffly the buoy resists a small tilt. Positive is stable; "
                   "larger is stiffer"),
            ("Max righting", "The strongest upright-restoring moment, in newton-metres, and the angle it peaks at"),
            ("Tips over at", "The angle past which the buoy keeps rolling. \u201cNever\u201d means it "
                             "rights itself from any angle"),
        ])
        + "</div>"
        f'<iframe class="sim-frame reveal" src="{src}" title="Buoy stability explorer: draft, freeboard '
        'and righting-arm curve for each flotation design" loading="lazy"></iframe>'
        f'<p class="drawings-sub"><a class="textlink" href="{src}">Open the explorer full screen</a></p>'
        '<div class="prose reveal">'
        "<p>The solver was checked against a plain cylinder, where the answer is known "
        "in closed form, and matches draft and stiffness to about 1%.</p>"
        "<p><strong>What it does not tell us yet.</strong> Part masses for the concept designs are "
        "estimated from their CAD volume, not weighed. Only parts that have been printed and weighed "
        "(the bolted-wedge parts and the mushroom float) use measured weights, so those results are the "
        "ones to trust most. Sealed chambers are assumed watertight, "
        "and the model is still water only, with no waves, wind or mooring pull. Every "
        "estimate is listed in the simulator's "
        f'<a class="textlink" href="{_REPO}/blob/main/mechanical/simulations/buoy-stability/README.md">README</a>, '
        "and measured weights replace them as parts are printed.</p></div></div>"
    )


def _mechanical(ctx: SiteContext) -> str:
    return c.section(
        '<div class="bento align-start">'
        '<div class="col-2">'
        + c.head_block("Mechanical", "Sealed above, sensing below")
        + "</div>"
        '<div class="col-4 prose">'
        "<p>The electronics stay dry in a sealed housing above the waterline: a "
        "<strong>3D-printed flange housing</strong> (4.4 in bore, 5 in tall) closed by a bolted lid "
        "and sealed with a large off-the-shelf O-ring, with cable glands in the lid. It sits in a "
        "printed float that holds it upright at the waterline, with the antenna above and the "
        "mooring attached to the float.</p>"
        "<p>Below the housing, S.C.O.U.T. uses <strong>one sensor of each type at a single "
        "point</strong> rather than a multi-depth string (<a class=\"textlink\" "
        f'href="{_DOC}/decisions/0003-single-point-sensing.md">ADR-0003</a>); the extra units on '
        "the bill of materials are field spares. The mooring is fixed and reef-safe, chosen to "
        "hold station with minimal disturbance to what it is measuring.</p></div></div>"
        + drawings.gallery(
            ctx.base, eyebrow="Mechanical design", heading="The printed parts",
            sub="John Ryan Myrdal's CAD for the two printed floats, the electronics housing "
                "and its cap, and the turbidity-sensor housing, printed in PETG. Each drawing links to its full sheet.")
        + _stability(ctx),
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
        + '<div class="bento stack-6 align-start">'
        '<div class="col-3 prose"><h3>Communications over water</h3>'
        f'<ul class="refs">{render(_REFS_COMMS)}</ul></div>'
        '<div class="col-3 prose"><h3>Design records</h3>'
        f'<ul class="refs">{docs}</ul></div>'
        "</div>",
        cls="section-sm",
        sid="references",
    )


def body(ctx: SiteContext) -> str:
    content = (
        c.page_header("Technology",
                      "How the buoy works",
                      "S.C.O.U.T. runs for a long time because it spends most of its time asleep. One "
                      "constraint shapes the whole design: a battery-powered buoy, deployed for a year "
                      "or more, that can transmit only a small packet three times a day.")
        + _glance()
        + c.slot_divider()
        + _architecture()
        + _cycle()
        + _subsystems()
        + _platform(ctx)
        + _packet()
        + _link()
        + _mechanical(ctx)
        + _refs()
        + c.cta("Next", "The science behind the metrics",
                '<a class="btn btn-primary" href="../science/">Read the science</a>'
                '<a class="btn" href="../analytics/">See live data</a>')
    )
    return docnav.page(title="Technology", items=_NAV, content=content, base=ctx.base)
