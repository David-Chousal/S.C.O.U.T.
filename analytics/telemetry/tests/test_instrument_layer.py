"""Tideline step 8: the instrument layer on the authored pages.

The hero states the project's true phase (or live status once real packets exist), the slot rule
divides sections as the transmit schedule, Technology opens with a spec block whose every value
traces to docs/hub/facts.md, and no page still says the buoy transmits once a day.
"""

import re
import unittest
from pathlib import Path

from telemetry.site import context, project
from telemetry.site.pages import home, technology

_REPO = Path(__file__).resolve().parents[3]
_SITE = Path(__file__).resolve().parents[1] / "site"


def _ctx(is_sample: bool = True) -> context.SiteContext:
    live = context.LiveStats(
        current_alert="No Stress", alert_class="a-nostress", latest_temp="26.4 °C",
        latest_batt="3.61 V", completeness="100%", peak_dhw="0 °C-wk", turbidity_events=0,
        n_records=48, span="1 day", mmm="27.6 °C", is_sample=is_sample,
        status_html='<span class="status status-live">Live</span>')
    return context.SiteContext(live=live, base="", fonts_present=False, img_dir=None,
                               ribbon=None, banner=None)


def _facts_row(label: str) -> str:
    facts = (_REPO / "docs" / "hub" / "facts.md").read_text()
    row = re.search(rf"^\| {re.escape(label)} \|(.*)$", facts, re.M)
    return row.group(1) if row else ""


class HeroStrip(unittest.TestCase):
    def test_sample_data_states_the_project_phase_not_a_live_feed(self):
        html = home.body(_ctx(is_sample=True))
        strip = re.search(r'<p class="hero-strip[^"]*">(.*?)</p>', html).group(1)
        self.assertIn(project.PHASE_LABEL, strip)
        self.assertNotIn("status-live", strip)

    def test_real_packets_switch_the_strip_to_live_status(self):
        html = home.body(_ctx(is_sample=False))
        strip = re.search(r'<p class="hero-strip[^"]*">(.*?)</p>', html).group(1)
        self.assertIn("status-live", strip)

    def test_the_phase_matches_the_knowledge_hub(self):
        status = (_REPO / "docs" / "hub" / "status.md").read_text()
        self.assertIn(f"**{project.PHASE}**", status)


class SlotDivider(unittest.TestCase):
    def test_home_and_technology_carry_the_schedule_rule(self):
        for html in (home.body(_ctx()), technology.body(_ctx())):
            with self.subTest():
                self.assertIn('class="slot-divider"', html)
                self.assertIn("00:10 · 08:10 · 16:10 UTC", html)

    def test_the_marketing_rule_never_claims_a_packet_arrived(self):
        divider = re.search(r'<div class="slot-divider".*?</div>', home.body(_ctx()), re.S).group(0)
        self.assertNotIn("got", divider)


class SpecBlock(unittest.TestCase):
    def test_technology_opens_with_the_spec_block(self):
        html = technology.body(_ctx())
        self.assertLess(html.index('class="spec-block'), html.index('id="how"'))

    def test_every_value_traces_to_its_facts_row(self):
        for label, value, fact, evidence in technology.SPEC:
            row = _facts_row(fact)
            with self.subTest(label=label):
                self.assertTrue(row, f"facts.md has no row '{fact}'")
                for token in evidence:
                    self.assertIn(token, row)

    def test_values_are_set_in_the_instrument_face(self):
        block = re.search(r'<dl class="spec-block.*?</dl>', technology.body(_ctx()), re.S).group(0)
        self.assertEqual(block.count('<dd class="mono">'), len(technology.SPEC))


class Cadence(unittest.TestCase):
    def test_no_page_says_the_buoy_transmits_once_a_day(self):
        for path in [*_SITE.glob("*.py"), *(_SITE / "pages").glob("*.py")]:
            text = path.read_text().lower()
            with self.subTest(file=path.name):
                self.assertNotIn("once a day", text)
                self.assertNotIn("1 transmission / day", text)
                self.assertNotIn("single small packet per day", text)

    def test_technology_states_the_three_slots(self):
        self.assertIn("00:10, 08:10 and 16:10 UTC", technology.body(_ctx()))


if __name__ == "__main__":
    unittest.main()
