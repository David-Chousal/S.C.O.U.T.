"""The Pages workflow must never publish simulated data over real data.

Today the workflow regenerates 30 days of simulated telemetry on every run — hourly, on a
cron — and builds the site from it. There is no branch in that logic: if the shore station
ever lands real CSVs in the repo, the next scheduled run overwrites the dashboard with
simulated readings and labels them with the sample-data banner. Nobody would see an error;
the site would just quietly stop showing the deployment.

:mod:`scout_shore.publish` is the decision that fixes it. These tests pin the behaviour the
workflow depends on, because the workflow itself is not unit-testable.
"""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scout_shore.publish import SAMPLE_BANNER, select_source


def _write_csv(directory: Path, name: str = "SCOUT-01_20260814.csv") -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / name
    path.write_text("schema_version,buoy_id,timestamp_utc\n1,SCOUT-01,2026-08-14T00:00:00Z\n")
    return path


class SelectSourceTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.live = self.root / "data-live"
        self.sample = self.root / "data"

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_real_data_wins_over_the_simulator(self) -> None:
        """The whole point: when real CSVs exist, they are what gets published."""
        _write_csv(self.live)
        choice = select_source(live_dir=self.live, sample_dir=self.sample)
        self.assertEqual(choice.source, self.live)
        self.assertFalse(choice.simulate)

    def test_real_data_is_not_labelled_as_a_simulation(self) -> None:
        """A live dashboard carrying "simulated, not a live deployment" is a lie to the reader."""
        _write_csv(self.live)
        choice = select_source(live_dir=self.live, sample_dir=self.sample)
        self.assertIsNone(choice.banner)

    def test_falls_back_to_the_simulator_when_no_real_data_exists(self) -> None:
        choice = select_source(live_dir=self.live, sample_dir=self.sample)
        self.assertEqual(choice.source, self.sample)
        self.assertTrue(choice.simulate)

    def test_simulated_data_is_always_labelled(self) -> None:
        """The inverse lie — sample numbers presented as a real deployment."""
        choice = select_source(live_dir=self.live, sample_dir=self.sample)
        self.assertEqual(choice.banner, SAMPLE_BANNER)

    def test_an_empty_live_directory_is_not_real_data(self) -> None:
        """A committed .gitkeep must not convince the workflow the buoy is live."""
        self.live.mkdir(parents=True)
        (self.live / ".gitkeep").write_text("")
        (self.live / "README.md").write_text("# landing zone\n")
        choice = select_source(live_dir=self.live, sample_dir=self.sample)
        self.assertTrue(choice.simulate)

    def test_the_simulator_never_writes_into_the_live_directory(self) -> None:
        """The regeneration step is what would destroy real data, so it targets its own dir."""
        _write_csv(self.live)
        live_choice = select_source(live_dir=self.live, sample_dir=self.sample)
        sample_choice = select_source(live_dir=self.root / "absent", sample_dir=self.sample)
        self.assertNotEqual(sample_choice.source, self.live)
        # And when live data is chosen there is nothing to regenerate at all.
        self.assertFalse(live_choice.simulate)

    def test_choice_renders_as_github_actions_output(self) -> None:
        """The workflow reads these as step outputs; the names are part of the contract."""
        _write_csv(self.live)
        rendered = dict(
            line.split("=", 1) for line in select_source(
                live_dir=self.live, sample_dir=self.sample
            ).as_github_output().splitlines()
        )
        self.assertEqual(set(rendered), {"source", "simulate", "banner"})
        self.assertEqual(rendered["simulate"], "false")

    def test_simulate_flag_is_lowercase_for_the_shell(self) -> None:
        """`if: steps.x.outputs.simulate == 'true'` — Python's True would silently never match."""
        rendered = select_source(live_dir=self.live, sample_dir=self.sample).as_github_output()
        self.assertIn("simulate=true", rendered)


if __name__ == "__main__":
    unittest.main()


class OutputSafetyTests(unittest.TestCase):
    """`$GITHUB_OUTPUT` is line-oriented, so a multi-line value is not just malformed — the
    remainder gets parsed as further step outputs."""

    def test_a_multiline_banner_is_refused_not_silently_truncated(self) -> None:
        from scout_shore.publish import SourceChoice

        choice = SourceChoice(source=Path("data"), simulate=True, banner="line one\nsimulate=false")
        with self.assertRaises(ValueError):
            choice.as_github_output()

    def test_the_real_banner_is_a_safe_single_line(self) -> None:
        self.assertNotIn("\n", SAMPLE_BANNER)
