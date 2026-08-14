"""About — the team, the institution, the advisors, and the story."""

from __future__ import annotations

from .. import components as c
from ..context import SiteContext
from ..layout import REPO_URL

TITLE = "About — S.C.O.U.T."
DESCRIPTION = (
    "S.C.O.U.T. is a Santa Clara University Senior Design Capstone (2026–2027): a three-person "
    "team building a low-cost nearshore reef-monitoring buoy, advised by Jes Kuczenski and "
    "Navid Shaghaghi."
)

_TEAM = [
    ("Isabella Rodriguez", "Hardware lead", "ECEN", "IR", 210, 200,
     "Owns the electrical design — the PCB, the power system, and the sensor and radio "
     "front end that has to survive a year in salt water on a solar budget."),
    ("John Ryan Myrdal", "Field &amp; mechanical lead", "GENG", "JM", 32, 30,
     "Owns the physical buoy — hull, enclosure, mooring and deployment. The part of SCOUT that "
     "meets the ocean directly and has to come back working."),
    ("David Chousal Cantu", "Software lead", "CSEN", "DC", 165, 165,
     "Owns the software path end to end — firmware on the buoy, the shore-station receiver, and "
     "the telemetry pipeline that turns packets into the metrics on this site."),
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


def _story() -> str:
    return c.section(
        '<div class="bento" style="align-items:start">'
        '<div class="col-2 reveal"><p class="eyebrow">The story</p>'
        '<p class="quote">We asked reef scientists what they actually needed. They did not say '
        '"another satellite."</p></div>'
        '<div class="col-4 prose reveal">'
        "<p>SCOUT began as a Santa Clara University Senior Design Capstone with a question rather "
        "than a product: where is the real gap in reef monitoring? Interviews with three NOAA "
        "coral-reef researchers pointed consistently at the same answer — not replacing existing "
        "systems, but providing <strong>affordable, accessible ground-truth measurements</strong> "
        "in shallow nearshore water, exactly where satellite products degrade.</p>"
        "<p>So we set out to build a buoy that a small program could actually afford to deploy and "
        "leave alone: solar-powered, low-maintenance, modular, and honest about its own data "
        "quality. Coral-reef health is the first application; the platform is meant to outlast it.</p>"
        "</div></div>",
    )


def _team() -> str:
    cards = "".join(
        c.member(name, role, disc, bio, initials, uid, hue)
        for uid, (name, role, disc, initials, hue, _h2, bio) in enumerate(_TEAM, start=1)
    )
    return c.section(
        c.head_block("The team", "Three disciplines, one buoy",
                     "A cross-disciplinary team — electrical, mechanical, and software — each "
                     "owning the part of SCOUT their field is built to get right.")
        + f'<div class="team" style="margin-top:2.4rem">{cards}</div>',
        cls="section-sm",
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
        c.head_block("Roadmap", "Kickoff to a live reef, in seven phases",
                     "Re-baselined August 2026. The plan runs from campus bring-up to a live "
                     "deployment on a Hawaiian reef.")
        + f'<dl class="spec" style="margin-top:2rem">{rows}</dl>',
        cls="section-sm",
    )


def body(ctx: SiteContext) -> str:
    return (
        c.page_header("About",
                      "A capstone with a buoy in the water",
                      "SCOUT is built by three Santa Clara University seniors across electrical, "
                      "mechanical and software engineering — with a real deployment as the "
                      "deadline.")
        + _story()
        + _team()
        + _institution()
        + _roadmap()
        + c.cta("Open source", "The whole project is public, under the MIT License",
                f'<a class="btn btn-primary" href="{REPO_URL}">View on GitHub</a>'
                '<a class="btn" href="../analytics/">See the live data</a>')
    )
