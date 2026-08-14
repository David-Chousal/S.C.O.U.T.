"""Home — the hero: what SCOUT is, the mission, live signal, and reef atmosphere."""

from __future__ import annotations

from .. import assets, components as c, imagery
from ..context import SiteContext

TITLE = "S.C.O.U.T. — Nearshore Ocean Monitoring Buoy"
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
    hero_media = assets.reef_atmosphere("sunlit", 10)
    return (
        '<section class="hero"><div class="wrap">'
        '<p class="eyebrow">Nearshore reef monitoring · Santa Clara University</p>'
        '<h1 class="hero-title">S.C.O.U.T.</h1>'
        '<p class="hero-expand">Santa Clara Oceanic Utilities Transmitter</p>'
        '<p class="hero-lead">A low-cost, solar-powered buoy that watches a reef the way a reef '
        "needs watching — patiently, for years, and for a fraction of the cost.</p>"
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
        f'<figure class="hero-figure">{hero_media}<div class="pill-scrim"></div>'
        '<figcaption>Shallow, sunlit nearshore water — the habitat SCOUT is built for, and '
        "where satellite products struggle most.</figcaption></figure>"
        "</div></section>"
    )


def _mission() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-2"><p class="eyebrow">The mission</p>'
        '<p class="quote">Affordable ground-truth for the reefs satellites see worst.</p></div>'
        '<div class="col-4 prose">'
        "<p>Coral reefs are among the most threatened ecosystems on Earth, yet the instruments "
        "that monitor them cost tens of thousands of dollars and are serviced only every few "
        "years. Reef scientists told us the highest-value gap is not another satellite — it is "
        "<strong>affordable measurements from the shallow nearshore water where satellite "
        "products degrade badly</strong>.</p>"
        "<p>SCOUT is built to be left alone: solar-powered, low-maintenance, and modular, with "
        "a target system cost well below the $5,000 ceiling researchers named as practical.</p>"
        "</div></div>",
        sid="mission",
    )


def _senses() -> str:
    signals = [
        ("temp", "Signal", "Water temperature",
         "A precision digital thermometer feeds NOAA Coral Reef Watch thermal-stress metrics — "
         "the community standard for anticipating bleaching."),
        ("turbidity", "Signal", "Turbidity",
         "An optical sensor flags runoff, resuspension and sediment plumes as relative events "
         "against the site's own baseline."),
        ("battery", "Signal", "Battery &amp; health",
         "State-of-health and daily minimum voltage keep a year-long solar deployment honest "
         "about its own power budget."),
    ]
    cards = "".join(f'<div class="col-2">{c.feature_card(g, k, t, b)}</div>'
                    for g, k, t, b in signals)
    platform = (
        '<article class="col-6 card card-accent">'
        '<div class="bento" style="align-items:center;gap:1.2rem">'
        '<div class="col-4"><p class="kicker">Platform, not instrument</p>'
        '<h3>One buoy, many signals, many sites</h3>'
        "<p>The sensing payload is modular by design. Dissolved oxygen, light, chlorophyll and "
        "reef soundscapes are on the roadmap — coral-reef health is the first mission, not the "
        "boundary.</p></div>"
        '<div class="col-2" style="text-align:left">'
        '<a class="textlink" href="technology/">See the architecture ' + _ARROW + "</a></div>"
        "</div></article>"
    )
    return c.section(
        c.head_block("What it senses", "A stack of signals from a single point",
                     "One sensor of each modality beneath the buoy, electronics sealed above the "
                     "waterline, everything logged locally and summarized to shore.")
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
        c.head_block("The habitat", "Built for shallow, complicated water",
                     "The nearshore zone SCOUT is designed for — beautiful, biodiverse, and "
                     "exactly where remote sensing struggles most.")
        + f'<div class="pill-row" style="margin-top:2.8rem">{pills}</div>'
        + '<div style="margin-top:1.8rem">'
        + c.render_slot("Coming soon", "Buoy wall-art renders",
                        "Studio renders of the SCOUT buoy will live here — a considered look at "
                        "the hardware, above and below the waterline.")
        + "</div>",
        cls="section-sm",
        sid="habitat",
    )


def _how() -> str:
    steps = c.steps([
        ("Sense", "On an RTC alarm the buoy wakes, samples temperature and turbidity, reads "
                  "battery, then returns to deep sleep."),
        ("Store", "Every reading is written to onboard flash. Raw data never leaves the buoy "
                  "over radio — the archive stays local."),
        ("Transmit", "Once a day an 82-byte summary packet goes to shore over LoRa radio — no "
                     "cellular, no internet at the buoy."),
        ("Publish", "The shore Raspberry Pi validates, runs the pipeline, and republishes the "
                    "dashboard you can read now."),
    ])
    return c.section(
        c.head_block("How it works", "From a sleeping buoy to a public dashboard")
        + f'<div style="margin-top:2.8rem">{steps}</div>',
        cls="section-sm",
        sid="how",
    )


def _live_band(ctx: SiteContext) -> str:
    live = ctx.live
    note = ("Sample data — simulated until the buoy is live."
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
