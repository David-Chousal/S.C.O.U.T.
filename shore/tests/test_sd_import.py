"""Merging a physically retrieved SD card into the shore station's record.

The buoy transmits each daily packet a few times and never waits for an acknowledgement. If
shore misses every copy — a power cut, a storm, the station down for maintenance — that reading
exists only on the buoy's SD card, and nothing brought it back. The analytics pipeline could
already *read* a card (`load_dir` takes any directory of CSVs), but nothing merged the two
record sets, so a deployment ended with a gappy shore CSV and a complete card that never met.

The card is also the *better* record, not merely an equal one. A LoRa packet is a lossy 30-byte
compression of a CSV row: `turbidity_v`, `turbidity_ntu` and the audio filename do not fit and
are dropped. So where both sides hold the same reading, the card's row wins.
"""

from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from scout_shore.schema import COLUMNS
from scout_shore.sd_import import ImportResult, import_card


def _row(seq: int, day: str = "20260814", *, turbidity_v: str = "", audio: str = "",
         buoy: str = "SCOUT-01", temp: str = "26.42") -> dict[str, str]:
    base = {c: "" for c in COLUMNS}
    base.update({
        "schema_version": "1", "buoy_id": buoy,
        "timestamp_utc": f"{day[:4]}-{day[4:6]}-{day[6:]}T{seq % 24:02d}:00:00Z",
        "record_seq": str(seq), "temp_c": temp, "turbidity_adc": "3300",
        "turbidity_v": turbidity_v, "battery_v": "3.28", "uptime_s": str(seq * 1800),
        "audio_file": audio, "flags": "", "soh": "", "fw_version": "v0.1.0",
    })
    return base


def _write(directory: Path, day: str, rows: list[dict[str, str]], buoy: str = "SCOUT-01") -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{buoy}_{day}.csv"
    with path.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    return path


def _read(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as fh:
        return list(csv.DictReader(fh))


class SdImportTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        self.card = root / "card"
        self.shore = root / "shore"

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_readings_shore_never_received_are_recovered(self) -> None:
        """The entire point: fill the gaps LoRa lost."""
        _write(self.shore, "20260814", [_row(1), _row(3)])
        _write(self.card, "20260814", [_row(1), _row(2), _row(3), _row(4)])
        result = import_card(self.card, self.shore)
        self.assertEqual(result.added, 2)
        seqs = [r["record_seq"] for r in _read(self.shore / "SCOUT-01_20260814.csv")]
        self.assertEqual(sorted(seqs, key=int), ["1", "2", "3", "4"])

    def test_readings_already_held_are_not_duplicated(self) -> None:
        _write(self.shore, "20260814", [_row(1), _row(2)])
        _write(self.card, "20260814", [_row(1), _row(2)])
        result = import_card(self.card, self.shore)
        self.assertEqual(result.added, 0)
        self.assertEqual(len(_read(self.shore / "SCOUT-01_20260814.csv")), 2)

    def test_the_card_row_wins_because_the_packet_was_lossy(self) -> None:
        """turbidity_v and the audio filename do not fit in 30 bytes, so the shore copy has
        empty cells the card can fill."""
        _write(self.shore, "20260814", [_row(1)])  # arrived over LoRa: no turbidity_v, no audio
        _write(self.card, "20260814", [_row(1, turbidity_v="1.65", audio="SCOUT-01_x.wav")])
        result = import_card(self.card, self.shore)
        stored = _read(self.shore / "SCOUT-01_20260814.csv")[0]
        self.assertEqual(stored["turbidity_v"], "1.65")
        self.assertEqual(stored["audio_file"], "SCOUT-01_x.wav")
        self.assertEqual(result.enriched, 1)
        self.assertEqual(result.added, 0, "an enriched row is not a new reading")

    def test_shore_rows_absent_from_the_card_survive(self) -> None:
        """A partial retrieval — a card pulled mid-deployment — must not delete history."""
        _write(self.shore, "20260814", [_row(1), _row(2)])
        _write(self.card, "20260814", [_row(2)])
        import_card(self.card, self.shore)
        self.assertEqual(len(_read(self.shore / "SCOUT-01_20260814.csv")), 2)

    def test_rows_land_in_the_daily_file_their_timestamp_names(self) -> None:
        _write(self.card, "20260815", [_row(50, day="20260815")])
        import_card(self.card, self.shore)
        self.assertTrue((self.shore / "SCOUT-01_20260815.csv").exists())

    def test_a_second_import_of_the_same_card_changes_nothing(self) -> None:
        """Idempotent: re-running after a failure must be safe."""
        _write(self.card, "20260814", [_row(1), _row(2)])
        import_card(self.card, self.shore)
        before = (self.shore / "SCOUT-01_20260814.csv").read_text()
        second = import_card(self.card, self.shore)
        self.assertEqual(second.added, 0)
        self.assertEqual(second.enriched, 0)
        self.assertEqual((self.shore / "SCOUT-01_20260814.csv").read_text(), before)

    def test_a_malformed_row_is_reported_not_swallowed(self) -> None:
        """Silently skipping a row the card holds is data loss disguised as success."""
        bad = _row(2); bad["record_seq"] = "not-a-number"
        _write(self.card, "20260814", [_row(1), bad])
        result = import_card(self.card, self.shore)
        self.assertEqual(result.added, 1)
        self.assertEqual(len(result.skipped), 1)
        self.assertIn("record_seq", result.skipped[0])

    def test_one_bad_row_does_not_abort_the_import(self) -> None:
        bad = _row(9); bad["record_seq"] = ""
        _write(self.card, "20260814", [bad, _row(1), _row(2)])
        result = import_card(self.card, self.shore)
        self.assertEqual(result.added, 2, "good rows either side of a bad one still import")

    def test_dry_run_writes_nothing(self) -> None:
        _write(self.shore, "20260814", [_row(1)])
        _write(self.card, "20260814", [_row(1), _row(2)])
        before = (self.shore / "SCOUT-01_20260814.csv").read_text()
        result = import_card(self.card, self.shore, dry_run=True)
        self.assertEqual((self.shore / "SCOUT-01_20260814.csv").read_text(), before)
        self.assertEqual(result.added, 0)

    def test_dry_run_still_reports_what_it_would_do(self) -> None:
        """Otherwise there is no way to inspect a card before committing to it."""
        _write(self.shore, "20260814", [_row(1)])
        _write(self.card, "20260814", [_row(1), _row(2), _row(3)])
        result = import_card(self.card, self.shore, dry_run=True)
        self.assertEqual(result.would_add, 2)

    def test_output_keeps_canonical_column_order(self) -> None:
        """The pipeline indexes by name, but data-schema.md calls the order canonical."""
        _write(self.card, "20260814", [_row(1)])
        import_card(self.card, self.shore)
        with (self.shore / "SCOUT-01_20260814.csv").open(newline="") as fh:
            self.assertEqual(tuple(next(csv.reader(fh))), COLUMNS)

    def test_rows_are_written_in_time_order(self) -> None:
        """Recovered rows are interleaved with existing ones, not appended at the end — QC's
        gap detection sorts anyway, but a human reading the CSV should not see 1,3,2,4."""
        _write(self.shore, "20260814", [_row(1), _row(3)])
        _write(self.card, "20260814", [_row(2), _row(4)])
        import_card(self.card, self.shore)
        seqs = [r["record_seq"] for r in _read(self.shore / "SCOUT-01_20260814.csv")]
        self.assertEqual(seqs, ["1", "2", "3", "4"])

    def test_multiple_buoys_stay_in_their_own_files(self) -> None:
        _write(self.card, "20260814", [_row(1, buoy="SCOUT-01")], buoy="SCOUT-01")
        _write(self.card, "20260814", [_row(1, buoy="SCOUT-02")], buoy="SCOUT-02")
        import_card(self.card, self.shore)
        self.assertTrue((self.shore / "SCOUT-01_20260814.csv").exists())
        self.assertTrue((self.shore / "SCOUT-02_20260814.csv").exists())

    def test_an_empty_card_is_not_an_error(self) -> None:
        self.card.mkdir(parents=True)
        result = import_card(self.card, self.shore)
        self.assertEqual(result.added, 0)
        self.assertEqual(result.cards_read, 0)

    def test_a_missing_card_directory_says_so(self) -> None:
        with self.assertRaises(FileNotFoundError):
            import_card(self.card / "nope", self.shore)


if __name__ == "__main__":
    unittest.main()
