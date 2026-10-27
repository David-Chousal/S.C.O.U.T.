"""Housing humidity (SCO-205): the CSV columns load, and the card reads the newest packet."""

import csv
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from telemetry import analyze, load_csv
from telemetry.model import TelemetryRecord
from telemetry.web import housing_humidity

_T0 = datetime(2026, 10, 23, tzinfo=timezone.utc)


def _record(i: int, *, flags: frozenset[str] = frozenset(), version: int = 2) -> TelemetryRecord:
    return TelemetryRecord(
        timestamp=_T0 + timedelta(minutes=30 * i), buoy_id="SCOUT-01", record_seq=i,
        temp_c=26.0, turbidity_adc=3100, turbidity_v=None, turbidity_fau=None,
        battery_v=3.6, uptime_s=i * 1800, audio_file="", flags=flags, schema_version=version,
    )


def _card(*records: TelemetryRecord) -> tuple[str, str]:
    return housing_humidity(analyze(list(records)))


class HousingHumidityCard(unittest.TestCase):
    def test_ok_when_newest_v2_packet_has_no_humidity_flag(self):
        self.assertEqual(_card(_record(0))[0], "OK")

    def test_alert_when_newest_packet_is_humidity_high(self):
        self.assertEqual(_card(_record(0, flags=frozenset({"HUMIDITY_HIGH"})))[0], "Alert")

    def test_sensor_fault_when_newest_packet_is_humidity_fail(self):
        self.assertEqual(_card(_record(0, flags=frozenset({"HUMIDITY_FAIL"})))[0], "Sensor fault")

    def test_only_the_newest_packet_counts(self):
        old_alert = _record(0, flags=frozenset({"HUMIDITY_HIGH"}))
        self.assertEqual(_card(old_alert, _record(1))[0], "OK")

    def test_unknown_for_v1_buoys_without_the_sensor(self):
        self.assertEqual(_card(_record(0, version=1))[0], "—")


class HousingColumns(unittest.TestCase):
    def test_loads_internal_temp_and_humidity(self):
        row = {
            "schema_version": "2", "buoy_id": "SCOUT-01", "timestamp_utc": "2026-10-23T00:00:00Z",
            "record_seq": "1", "temp_c": "26.00", "turbidity_adc": "3100", "turbidity_v": "",
            "turbidity_fau": "", "battery_v": "3.60", "uptime_s": "0", "audio_file": "",
            "flags": "", "soh": "", "fw_version": "v0.1.0", "internal_temp_c": "24.50",
            "internal_humidity_pct": "41.2",
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "SCOUT-01_20261023.csv"
            with path.open("w", newline="") as fh:
                writer = csv.DictWriter(fh, fieldnames=list(row))
                writer.writeheader()
                writer.writerow(row)
            record = load_csv(path)[0]
        self.assertEqual((record.internal_temp_c, record.internal_humidity_pct), (24.5, 41.2))


if __name__ == "__main__":
    unittest.main()
