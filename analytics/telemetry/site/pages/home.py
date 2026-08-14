"""Home — the hero: what SCOUT is, the mission, live signal, and reef atmosphere."""

from __future__ import annotations

from .. import components as c, imagery
from ..context import SiteContext

TITLE = "S.C.O.U.T. · Nearshore Ocean Monitoring Buoy"
DESCRIPTION = (
    "S.C.O.U.T. is a low-cost, solar-powered nearshore monitoring buoy measuring reef "
    "temperature, turbidity and health, and computing NOAA Coral Reef Watch thermal-stress "
    "metrics. Santa Clara University Senior Design Capstone, 2026–2027."
)

_ARROW = ('<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" '
          'aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" '
          'stroke-linejoin="round"/></svg>')


def _hero(ctx: SiteContext) -> str:
    live = ctx.live
    hero_media, hero_credit = imagery.hero(ctx.base, ctx.img_dir)
    return (
        '<section class="hero"><div class="wrap">'
        '<p class="eyebrow">Nearshore reef monitoring · Santa Clara University</p>'
        '<h1 class="hero-title">S.C.O.U.T.</h1>'
        '<p class="hero-expand">Santa Clara Oceanic Utilities Transmitter</p>'
        '<p class="hero-lead">A low-cost, solar-powered buoy that monitors nearshore reef '
        "conditions for a year or more on a single deployment.</p>"
        '<div class="btn-row">'
        f'<a class="btn btn-primary" href="analytics/">Explore the live data {_ARROW}</a>'
        '<a class="btn" href="technology/">How it works</a>'
        "</div>"
        '<div class="signals">'
        '<span class="signal">Temperature</span>'
        '<span class="signal">Turbidity</span>'
        '<span class="signal">Battery &amp; health</span>'
        '<span class="signal soon">Dissolved oxygen</span>'
        '<span class="signal soon">Reef soundscape</span>'
        "</div>"
        f'<figure class="hero-figure">{hero_media}<div class="pill-scrim"></div>{hero_credit}'
        '<figcaption>Shallow nearshore water, where SCOUT operates and where satellite data is '
        "least accurate.</figcaption></figure>"
        "</div></section>"
    )


def _mission() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-2"><p class="eyebrow">Background</p>'
        '<p class="quote">The gap is affordable data from shallow, nearshore water.</p></div>'
        '<div class="col-4 prose">'
        "<p>Coral reefs are among the most threatened ecosystems on Earth, but the instruments "
        "used to monitor them cost tens of thousands of dollars and are often serviced only "
        "every few years. When we interviewed reef scientists, they pointed to the same gap: "
        "<strong>affordable measurements in the shallow nearshore water where satellite products "
        "lose accuracy</strong>.</p>"
        "<p>SCOUT is designed to run unattended, with solar power, low maintenance, and a modular "
        "sensor payload. The target system cost is under $5,000, the figure researchers gave as "
        "a practical ceiling.</p>"
        "</div></div>",
        sid="mission",
    )


def _senses() -> str:
    signals = [
        ("temp", "Signal", "Water temperature",
         "A digital thermometer provides the temperature record used to compute NOAA Coral Reef "
         "Watch thermal-stress metrics."),
        ("turbidity", "Signal", "Turbidity",
         "An optical sensor detects runoff, resuspension, and sediment plumes as changes "
         "relative to the site's baseline."),
        ("battery", "Signal", "Battery &amp; health",
         "Battery state-of-health and daily minimum voltage track whether the solar power budget "
         "is holding up over a long deployment."),
    ]
    cards = "".join(f'<div class="col-2">{c.feature_card(g, k, t, b)}</div>'
                    for g, k, t, b in signals)
    platform = (
        '<article class="col-6 card card-accent">'
        '<div class="bento" style="align-items:center;gap:1.2rem">'
        '<div class="col-4"><p class="kicker">A platform</p>'
        '<h3>One buoy, several possible signals</h3>'
        "<p>The sensor payload is modular. Dissolved oxygen, light, chlorophyll, and reef "
        "soundscapes are on the roadmap. Coral-reef health is the first application, with others "
        "planned.</p></div>"
        '<div class="col-2" style="text-align:left">'
        '<a class="textlink" href="technology/">See the architecture ' + _ARROW + "</a></div>"
        "</div></article>"
    )
    return c.section(
        c.head_block("What it measures", "The signals SCOUT records",
                     "One sensor per measurement sits below the buoy. The electronics stay sealed "
                     "above the waterline, and readings are logged on board before transmission.")
        + f'<div class="bento" style="margin-top:2.8rem">{cards}{platform}</div>',
        sid="senses",
    )


def _habitat(ctx: SiteContext) -> str:
    pills = "".join([
        imagery.pill("shallow-reef", ctx.base, uid=101, img_dir=ctx.img_dir),
        imagery.pill("coral-detail", ctx.base, uid=102, img_dir=ctx.img_dir),
        imagery.pill("kelp-column", ctx.base, uid=103, img_dir=ctx.img_dir),
        imagery.pill("open-water", ctx.base, uid=104, img_dir=ctx.img_dir),
    ])
    return c.section(
        c.head_block("The environment", "The nearshore zone",
                     "SCOUT is built for shallow nearshore water. It is biodiverse and "
                     "productive, and it is also where remote sensing is least accurate.")
        + f'<div class="pill-row" style="margin-top:2.8rem">{pills}</div>'
        + '<div style="margin-top:1.8rem">'
        + c.render_slot("Coming soon", "Buoy renders",
                        "Studio renders of the buoy will go here, showing the hardware above and "
                        "below the waterline.")
        + "</div>",
        cls="section-sm",
        sid="habitat",
    )


def _how() -> str:
    steps = c.steps([
        ("Sense", "The buoy wakes on a timer, samples temperature and turbidity, records "
                  "battery voltage, and returns to sleep."),
        ("Store", "Every reading is written to onboard storage. Raw data is not transmitted, so "
                  "the full archive stays on the buoy."),
        ("Transmit", "Once a day the buoy sends an 82-byte summary to shore over LoRa radio. It "
                     "uses no cellular or internet connection."),
        ("Publish", "The shore Raspberry Pi validates each packet, runs the analysis pipeline, "
                    "and regenerates this dashboard."),
    ])
    return c.section(
        c.head_block("How it works", "The data path")
        + f'<div style="margin-top:2.8rem">{steps}</div>',
        cls="section-sm",
        sid="how",
    )


def _live_band(ctx: SiteContext) -> str:
    live = ctx.live
    note = ("Sample data, simulated until the buoy is deployed."
            if live.is_sample else "Latest publish.")
    stat = (lambda label, value, cls="": (
        f'<div class="stat"><p class="stat-label">{label}</p>'
        f'<p class="stat-value {cls}">{value}</p></div>'))
    return c.section(
        '<article class="card card-ink">'
        '<div class="bento" style="align-items:center;gap:1.4rem 1.8rem">'
        '<div class="col-3"><p class="kicker">From the buoy</p>'
        '<h2>Current reef status</h2>'
        f'<p style="margin:0.6rem 0 0">{note} Span {live.span}.</p>'
        '<div class="btn-row" style="margin-top:1.6rem">'
        f'<a class="btn btn-primary" href="analytics/">Open the dashboard {_ARROW}</a></div></div>'
        '<div class="col-3"><div class="cards" style="margin:0">'
        + stat("Bleaching alert", live.current_alert, live.alert_class)
        + stat("Latest temp", live.latest_temp)
        + stat("Completeness", live.completeness)
        + stat("Turbidity events", str(live.turbidity_events))
        + "</div></div>"
        "</div></article>",
        sid="live",
    )


def body(ctx: SiteContext) -> str:
    return (
        _hero(ctx)
        + _mission()
        + '<div class="wrap"><div class="divider"></div></div>'
        + _senses()
        + _habitat(ctx)
        + _how()
        + _live_band(ctx)
    )
