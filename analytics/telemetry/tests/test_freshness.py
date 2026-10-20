"""Freshness is judged against the buoy's transmit schedule, not wall-clock seconds.

Three fixed slots a day, 00:10 / 08:10 / 16:10 UTC (docs/hub/facts.md, SCO-196). A packet
belongs to the first slot at or after its timestamp; each later slot that has passed (plus a
30-minute grace for the blind repeats) without one is a missed slot.
"""

import unittest
from datetime import datetime, timezone

from telemetry import freshness


def _t(day: int, hh: int, mm: int) -> datetime:
    return datetime(2026, 10, day, hh, mm, tzinfo=timezone.utc)


class Assess(unittest.TestCase):
    def test_a_packet_for_the_latest_slot_is_live(self):
        f = freshness.assess(_t(20, 8, 0), now=_t(20, 9, 0))
        self.assertEqual((f.status, f.missed), ("live", 0))

    def test_the_next_slot_is_not_missed_until_its_grace_has_passed(self):
        self.assertEqual(freshness.assess(_t(20, 8, 0), now=_t(20, 16, 30)).status, "live")
        self.assertEqual(freshness.assess(_t(20, 8, 0), now=_t(20, 16, 41)).missed, 1)

    def test_one_or_two_missed_slots_are_stale(self):
        self.assertEqual(freshness.assess(_t(20, 0, 0), now=_t(20, 9, 0)).status, "stale")
        f = freshness.assess(_t(20, 0, 0), now=_t(20, 17, 0))
        self.assertEqual((f.status, f.missed), ("stale", 2))

    def test_three_missed_slots_is_offline(self):
        # The 15:00 packet belongs to the 19th's 16:10 slot; the 20th's three slots then pass.
        f = freshness.assess(_t(19, 15, 0), now=_t(20, 17, 0))
        self.assertEqual((f.status, f.missed), ("offline", 3))

    def test_no_packets_at_all_is_offline(self):
        self.assertEqual(freshness.assess(None, now=_t(20, 9, 0)).status, "offline")

    def test_a_flagged_latest_packet_is_a_fault_unless_the_buoy_is_offline(self):
        self.assertEqual(
            freshness.assess(_t(20, 8, 0), now=_t(20, 9, 0), faults=frozenset({"low_batt"})).status,
            "fault")
        self.assertEqual(
            freshness.assess(_t(18, 8, 0), now=_t(20, 9, 0), faults=frozenset({"low_batt"})).status,
            "offline")


class SlotHistory(unittest.TestCase):
    def test_marks_each_passed_slot_received_or_missed_and_leaves_future_slots_open(self):
        received = [_t(20, 0, 0), _t(20, 16, 0)]
        history = freshness.slot_history(received, now=_t(20, 17, 0), days=1)
        self.assertEqual([state for _, state in history], [True, False, True])

    def test_future_slots_are_none(self):
        history = freshness.slot_history([_t(20, 0, 0)], now=_t(20, 9, 0), days=1)
        self.assertEqual([state for _, state in history], [True, False, None])

    def test_spans_the_requested_days_ending_today(self):
        history = freshness.slot_history([], now=_t(20, 12, 0), days=7)
        self.assertEqual(len(history), 21)
        self.assertEqual(history[0][0], _t(14, 0, 10))


class BeforeDeployment(unittest.TestCase):
    def test_slots_before_the_first_ever_packet_are_not_counted_as_missed(self):
        history = freshness.slot_history([_t(20, 8, 0)], now=_t(20, 17, 0), days=2)
        self.assertEqual([state for _, state in history], [None, None, None, None, True, False])


class Describe(unittest.TestCase):
    def test_a_reading_whose_slot_has_not_come_yet_is_described_by_its_own_time(self):
        text = freshness.describe(freshness.assess(_t(20, 23, 30), now=_t(20, 23, 55)))
        self.assertIn("23:30 UTC", text)
        self.assertNotIn("00:10", text)

    def test_states_the_last_packet_slot_in_utc(self):
        text = freshness.describe(freshness.assess(_t(20, 8, 0), now=_t(20, 9, 0)))
        self.assertIn("08:10 UTC", text)

    def test_says_how_many_slots_were_missed(self):
        text = freshness.describe(freshness.assess(_t(20, 0, 0), now=_t(20, 17, 0)))
        self.assertIn("2 slots missed", text)


if __name__ == "__main__":
    unittest.main()
