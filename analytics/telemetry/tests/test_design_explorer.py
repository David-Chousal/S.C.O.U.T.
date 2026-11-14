"""The stability stage's data builder: it reads the simulator's numbers faithfully and puts each keel in the right place."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from telemetry.site import design_explorer as dx

_REPO = Path(__file__).resolve().parents[3]
_EXPLORER = _REPO / "mechanical/simulations/buoy-stability/results/2026-09-29/stability-explorer.html"


class SolverResults(unittest.TestCase):
    def test_reads_series_leads_designs_and_cap_tops_from_the_generated_page(self):
        html = ('<script>\nconst D={"a_0":[[0,1]]}, LEAD={"3.0": 2.2}, ITS=[{"id":"a"}], K=150;\n'
                'const CAPTOP={"3.0":8.5};\n</script>')
        out = dx.solver_results(html)
        self.assertEqual((out["D"], out["LEAD"], out["ITS"], out["CAPTOP"]),
                         ({"a_0": [[0, 1]]}, {"3.0": 2.2}, [{"id": "a"}], {"3.0": 8.5}))

    def test_fails_loudly_when_the_simulator_page_changes_shape(self):
        with self.assertRaises(ValueError):
            dx.solver_results("<script>const X=1;</script>")


class Labels(unittest.TestCase):
    def test_chip_date_is_concept_for_undated_designs_even_with_a_date_in_the_text(self):
        self.assertEqual(dx._chip_date("concept #1, undated (before 2026-08-17)"), "concept")

    def test_chip_date_is_the_first_date_otherwise(self):
        self.assertEqual(dx._chip_date("2026-11-12, CAD exported 2026-11-13"), "2026-11-12")

    def test_short_names_keep_more_of_the_name_where_labels_would_repeat(self):
        self.assertEqual(dx._short_names(["v10 — snap", "v10 — bottom ring", "Full buoy assembly v5 (3.0 in caps)"]),
                         ["v10 snap", "v10 bottom ring", "Assembly v5"])


class Keel(unittest.TestCase):
    def test_recorded_keel_height_wins(self):
        self.assertEqual(dx._keel_mm({"keel_z_mm": 63.5}, {"bbox_mm": [[0, 0, 63.0], [1, 1, 254]]}), 63.5)

    def test_falls_back_to_the_models_lowest_point(self):
        self.assertEqual(dx._keel_mm({}, {"bbox_mm": [[0, 0, -127.9], [1, 1, 136.8]]}), -127.9)


class RealData(unittest.TestCase):
    """Built from the committed simulator output and models, so a registry or model change that breaks the stage fails here."""

    @classmethod
    def setUpClass(cls):
        cls.data = dx.build_data(dx.solver_results(_EXPLORER.read_text(encoding="utf-8")), dx._models())

    def test_every_design_in_the_registry_is_on_the_stage_in_order(self):
        reg = json.loads(dx._REGISTRY.read_text(encoding="utf-8"))["iterations"]
        self.assertEqual([d["id"] for d in self.data["designs"]], [it["id"] for it in reg])

    def test_every_design_with_a_result_has_its_series(self):
        for d in self.data["designs"]:
            if d["hydro"]:
                with self.subTest(design=d["id"]):
                    self.assertIn(d["hydro"]["cap"] + "_0", self.data["series"])

    def test_every_series_row_has_37_tilt_angles(self):
        for key, rows in self.data["series"].items():
            with self.subTest(series=key):
                self.assertTrue(all(len(r[8]) == 37 for r in rows))


if __name__ == "__main__":
    unittest.main()
