"""Battery life against the daily transmit count (SCO-198).

The model moves only the radio line of the power budget's own scenarios, so it must reproduce
the budget where the budget speaks (3 sends of 30 B) and change by exactly the radio's share
when the count or the packet changes.
"""

import importlib.util
import unittest
from pathlib import Path

from telemetry import battery_life as bl

REPO = Path(__file__).resolve().parents[3]
BEST, PESSIMISTIC = bl.SCENARIOS


def _load_airtime_script():
    spec = importlib.util.spec_from_file_location("lora_airtime", REPO / "scripts" / "lora_airtime.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ReproducesTheBudget(unittest.TestCase):
    def test_best_case_one_cell_is_the_budgets_735_days(self):
        # PB 2026-10-25: 16.2 mAh/day → 735 d on one cell; the 44 B packet costs ~0.01 mAh/day more.
        one_cell = bl.estimate(BEST, 3, 1)
        self.assertAlmostEqual(one_cell.days, 735, delta=2)

    def test_pessimistic_one_cell_is_the_budgets_316_days(self):
        self.assertAlmostEqual(bl.estimate(PESSIMISTIC, 3, 1).days, 316, delta=1)

    def test_pessimistic_two_cells_is_the_budgets_631_days(self):
        self.assertAlmostEqual(bl.estimate(PESSIMISTIC, 3, 2).days, 631, delta=2)

    def test_packet_airtime_matches_the_airtime_script(self):
        airtime = _load_airtime_script().airtime_ms(44 + 4, 12, 500_000, coding_rate=4) / 1000
        self.assertAlmostEqual(bl.PACKET_AIRTIME_S, airtime, places=4)

    def test_budget_airtime_matches_the_airtime_script(self):
        airtime = _load_airtime_script().airtime_ms(30 + 4, 12, 500_000, coding_rate=4) / 1000
        self.assertAlmostEqual(bl.BUDGET_AIRTIME_S, airtime, places=3)


class TransmitCount(unittest.TestCase):
    def test_fewer_transmits_never_shortens_life(self):
        days = [bl.estimate(BEST, n, 2).days for n in (1, 2, 3)]
        self.assertEqual(days, sorted(days, reverse=True))

    def test_each_send_costs_one_44_byte_airtime_at_111_ma(self):
        step = bl.daily_mah(BEST, 3) - bl.daily_mah(BEST, 2)
        self.assertAlmostEqual(step, 111 * 0.6902 / 3600, places=6)

    def test_the_radio_is_under_one_percent_of_the_best_case_draw(self):
        radio = bl.daily_mah(BEST, 3) - bl.daily_mah(BEST, 1)
        self.assertLess(radio / bl.daily_mah(BEST, 3), 0.01)

    def test_counts_outside_one_to_three_are_rejected(self):
        for bad in (0, 4, -1):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                bl.daily_mah(BEST, bad)

    def test_cell_counts_other_than_one_or_two_are_rejected(self):
        with self.assertRaises(ValueError):
            bl.estimate(BEST, 3, 3)


class ListenWindow(unittest.TestCase):
    def test_three_one_second_windows_cost_the_ota_designs_0_019_mah(self):
        extra = bl.daily_mah(BEST, 3, listen_window=True) - bl.daily_mah(BEST, 3)
        self.assertAlmostEqual(extra, 0.019, places=3)

    def test_window_cost_scales_with_the_count(self):
        one = bl.daily_mah(BEST, 1, listen_window=True) - bl.daily_mah(BEST, 1)
        three = bl.daily_mah(BEST, 3, listen_window=True) - bl.daily_mah(BEST, 3)
        self.assertAlmostEqual(three, 3 * one, places=9)


class JsonExport(unittest.TestCase):
    def test_every_combination_is_present_and_marked_an_estimate(self):
        data = bl.as_json_dict()
        self.assertTrue(data["estimate"])
        self.assertEqual(len(data["without_listen_window"]), 2 * 3 * 2)
        self.assertEqual(len(data["with_listen_window"]), 2 * 3 * 2)

    def test_months_are_days_over_the_budgets_month_length(self):
        e = bl.estimate(BEST, 1, 1)
        self.assertAlmostEqual(e.months, e.days / 30.4375, places=9)


class ConsoleExport(unittest.TestCase):
    def test_the_consoles_copy_matches_the_model(self):
        # The console (a Worker) reads this export; regenerate with scripts/export_battery_life.py.
        spec = importlib.util.spec_from_file_location(
            "export_battery_life", REPO / "scripts" / "export_battery_life.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self.assertEqual(module.OUT.read_text(), module.render())


if __name__ == "__main__":
    unittest.main()
