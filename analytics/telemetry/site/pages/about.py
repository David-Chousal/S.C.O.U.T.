"""About — the team, the institution, the advisors, and the story."""

from __future__ import annotations

from .. import components as c
from ..context import SiteContext
from ..layout import REPO_URL

TITLE = "About · S.C.O.U.T."
DESCRIPTION = (
    "S.C.O.U.T. is a Santa Clara University Senior Design Capstone (2026–2027): a three-person "
    "team building a low-cost nearshore reef-monitoring buoy, advised by Jes Kuczenski and "
    "Navid Shaghaghi."
)

# (name, role, disc, initials, hue, _h2, bio, linkedin, photo). ``photo`` is a basename under
# assets/img/ (or None → circular monogram fallback).
_TEAM = [
    ("David Chousal Cantu", "Software lead", "CSEN", "DC", 165, 165,
     "Leads the software: firmware on the buoy, the shore-station receiver, and the telemetry "
     "pipeline that produces the metrics on this site.",
     "https://www.linkedin.com/in/david-chousal-749010297", "team/david.jpg"),
    ("John Ryan Myrdal", "Field &amp; mechanical lead", "GENG", "JM", 32, 30,
     "Leads the physical build: hull, enclosure, mooring, and deployment. This is the part of "
     "the system exposed directly to the ocean.",
     "https://www.linkedin.com/in/john-ryan-myrdal-33a292298/", "team/john.jpg"),
    ("Isabella Rodriguez", "Hardware lead", "ECEN", "IR", 210, 200,
     "Leads the electrical design: the PCB, the power system, and the sensor and radio front "
     "end, all of which have to run for a year in salt water on solar power.",
     "https://www.linkedin.com/in/isabellarodriguez17/", "team/isabella.jpg"),
]

_PHASES = [
    ("Phase 0", "Kickoff", "Aug – Sep 2026", True),
    ("Phase 1", "Subsystem bring-up", "Sep – Oct 2026", False),
    ("Phase 2", "System integration", "Oct – Nov 2026", False),
    ("Phase 3", "Enclosure &amp; waterproofing", "Nov 2026 – Jan 2027", False),
    ("Phase 4", "Field prototype deployment", "Jan – Feb 2027", False),
    ("Phase 5", "Hawaii deployment prep", "Mar 2027", False),
    ("Phase 6", "Hawaii live deployment", "Mar – May 2027", False),
]


def _overview() -> str:
    inner = (
        c.head_block(
            "The project",
            "A monitoring platform, not a one-off buoy",
            "S.C.O.U.T., the Santa Clara Oceanic Utilities Transmitter, is a low-cost, "
            "solar-powered buoy that carries several sensing signals at once. Coral-reef health is "
            "the first mission, and the platform is built to take on others.")
        + '<div class="bento" style="align-items:start;margin-top:2.6rem">'
        '<div class="col-4 prose reveal">'
        "<p>S.C.O.U.T. addresses a specific gap in ocean monitoring. Satellites map "
        "sea-surface temperature at scale but lose accuracy in the shallow nearshore water where "
        "reefs actually live, and research-grade moorings cost too much to place in the numbers "
        "real coverage would need. The result is thin ground-truth data in exactly the places "
        "that matter most for reef health. S.C.O.U.T. is a buoy <strong>cheap and rugged enough "
        "to put there and leave in place</strong>.</p>"
        "<p>A single buoy wakes about every half hour to log water temperature, turbidity, and "
        "battery health, then sleeps to conserve power. Once a day it sends one small summary to "
        "a shore station over a long-range 915&nbsp;MHz radio link; the full raw archive, audio "
        "included, never leaves the buoy. On shore, a Raspberry&nbsp;Pi runs quality control and "
        "NOAA Coral Reef Watch thermal-stress metrics, then regenerates this public site, with no "
        "server to keep running.</p>"
        "<p>Every choice serves one constraint: it has to survive. The buoy must run "
        "<strong>more than a year unattended</strong> on solar power in salt water, stay under a "
        "cost ceiling a small program can actually afford, and be simple enough for a "
        "three-person team to build, deploy, and maintain. The sensor payload is modular, so the "
        "same platform can grow past temperature and turbidity as the science asks for more.</p>"
        "</div>"
        '<div class="col-2 reveal">'
        + c.spec([
            ("Platform", "Nearshore monitoring buoy"),
            ("First mission", "Coral-reef health"),
            ("Target cost", "Under $5,000"),
            ("Autonomy", "1+ year unattended"),
            ("Power", "Solar"),
            ("Deployment depth", "2–8 m"),
            ("Shore link", "915 MHz LoRa · ~2 km"),
            ("First site", "Hawaii · Spring 2027"),
            ("License", "Open source · MIT"),
        ])
        + "</div></div>"
    )
    # Extra breathing room: `margin-top` opens space below the "About the project" hero;
    # the padding-top bump adds a little more above the "The project" heading.
    return (
        '<section class="section" id="overview" '
        'style="margin-top:clamp(1.6rem,0.9rem + 2vw,3rem);'
        'padding-top:calc(var(--section) + 1.2rem + 5px)">'
        f'<div class="wrap">{inner}</div></section>'
    )


def _story() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-2 reveal"><p class="eyebrow">The story</p>'
        '<p class="quote">It started from a question: where is the real gap in reef '
        "monitoring?</p></div>"
        '<div class="col-4 prose reveal">'
        "<p>S.C.O.U.T. began as a Santa Clara University senior design capstone. Early on, we "
        "interviewed three NOAA coral-reef researchers to understand where the need was "
        "greatest. They consistently pointed to the same gap: <strong>affordable ground-truth "
        "measurements in shallow nearshore water</strong>, where satellite products lose "
        "accuracy. The aim is to add coverage where it is currently missing.</p>"
        "<p>The result is a buoy a small program can afford to deploy and leave in place, with "
        "solar power, low maintenance, a modular sensor payload, and data-quality reporting "
        "built in. Coral-reef health is the first application, and the platform is designed to "
        "support others.</p>"
        "</div></div>",
    )


def _team(base: str) -> str:
    cards = "".join(
        c.member(name, role, disc, bio, initials, uid, hue, linkedin,
                 photo=f"{base}assets/img/{photo}" if photo else None)
        for uid, (name, role, disc, initials, hue, _h2, bio, linkedin, photo)
        in enumerate(_TEAM, start=1)
    )
    return c.section(
        c.head_block("The team", "The team",
                     "Three students, one each from electrical, mechanical, and software "
                     "engineering, each responsible for the part of the system in their field.")
        + f'<div class="team" style="margin-top:2.4rem">{cards}</div>',
        cls="section-sm",
        sid="team",
    )


def _institution() -> str:
    return c.section(
        '<div class="bento" style="align-items:center">'
        '<div class="col-3 reveal"><p class="eyebrow">Institution &amp; advisors</p>'
        '<h2>Santa Clara University</h2>'
        '<p class="lead" style="margin-top:0.8rem">School of Engineering · Senior Design '
        "Capstone · 2026–2027</p></div>"
        '<div class="col-3 reveal">'
        + c.spec([
            ("Faculty advisor", "Jes Kuczenski"),
            ("Faculty advisor", "Navid Shaghaghi"),
            ("Program", "Senior Design Capstone"),
            ("Deployment target", "Hawaii · Spring 2027"),
        ])
        + "</div></div>",
        cls="section-sm",
    )


def _roadmap() -> str:
    rows = ""
    for tag, name, window, active in _PHASES:
        chip = '<span class="chip info">In progress</span>' if active else \
               '<span class="chip">Planned</span>'
        rows += (
            '<div class="spec-row" style="grid-template-columns:6rem 1fr auto auto;gap:1rem">'
            f'<dt style="color:var(--accent)">{tag}</dt><dd style="color:var(--ink)">{name}</dd>'
            f'<dd style="text-align:right">{window}</dd><dd>{chip}</dd></div>'
        )
    return c.section(
        c.head_block("Roadmap", "Project phases",
                     "Re-baselined in August 2026. The plan runs from campus bring-up to a field "
                     "deployment in Hawaii.")
        + f'<dl class="spec" style="margin-top:2rem">{rows}</dl>',
        cls="section-sm",
    )


def body(ctx: SiteContext) -> str:
    return (
        c.page_header("About",
                      "About the project",
                      "S.C.O.U.T. is a Santa Clara University senior design capstone, built by three "
                      "students in electrical, mechanical, and software engineering, with a field "
                      "deployment as the goal.")
        + _overview()
        + _story()
        + _team(ctx.base)
        + _institution()
        + _roadmap()
        + c.cta("Open source", "The project is open source under the MIT License",
                f'<a class="btn btn-primary" href="{REPO_URL}">View on GitHub</a>'
                '<a class="btn" href="../analytics/">See the live data</a>')
    )
