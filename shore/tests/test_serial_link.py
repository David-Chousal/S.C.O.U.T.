"""The ESP32-S3 shore receiver, read by a computer over USB (SCO-257).

The S3 prints an ``RX len=… hex=…`` line for every frame it hears, before validating it. The
computer re-validates each payload with the shore codec and stores it through the idempotent CSV
store, so these tests cover what reaches the store, what is dropped, and what is counted.
"""

from __future__ import annotations

import os
import pty
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from scout_shore import CsvStore, Receiver
from scout_shore.packet import Reading, encode
from scout_shore.serial_link import MAX_LINE_BYTES, SerialFrameLink


def _payload(seq: int = 7) -> bytes:
    return encode(Reading(
        buoy_id=1, timestamp=datetime(2026, 10, 19, 0, 10, tzinfo=timezone.utc), record_seq=seq,
        temp_c=21.5, turbidity_adc=3100, battery_v=3.6, uptime_s=600,
    ))


def _rx(payload: bytes) -> str:
    return f"RX len={len(payload)} rssi=-41 snr=9 n=3 hex={payload.hex().upper()}\n"


# Everything else the S3 prints (firmware/src/shore_rx/shore_main.cpp) must be ignored.
NOISE = (
    "shore_rx: radio=ok freq=915.0 modem=0,0,0 errata=applied\n"
    "time: send T<unix-epoch> (UTC) now to set the clock\n"
    "OK buoy=1 seq=7 ts=1803859200 temp_c_centi=2150 batt_mv=3600 flags=0x0000 win=in tx=3/3\n"
    "DUP buoy=1 seq=7\n"
    "BAD crc\n"
    "RX bad frame (CRC or header)\n"
)


class LogFileTests(unittest.TestCase):
    def setUp(self) -> None:
        self._dir = tempfile.TemporaryDirectory()
        self.dir = Path(self._dir.name)

    def tearDown(self) -> None:
        self._dir.cleanup()

    def _log(self, text: str) -> Path:
        path = self.dir / "s3.log"
        path.write_text(text)
        return path

    def test_only_frame_lines_become_payloads(self) -> None:
        link = SerialFrameLink(self._log(NOISE + _rx(_payload(7)) + _rx(_payload(8))))
        self.assertEqual([link.receive(), link.receive(), link.receive()], [_payload(7), _payload(8), None])
        self.assertEqual(link.ignored_lines, 6)
        self.assertTrue(link.finished)

    def test_a_malformed_frame_line_is_counted_not_stored(self) -> None:
        link = SerialFrameLink(self._log("RX len=2 rssi=-41 snr=9 n=1 hex=0G\n" + _rx(_payload())))
        self.assertEqual(link.receive(), _payload())
        self.assertEqual(link.malformed_lines, 1)

    def test_through_the_receiver_a_repeat_stores_once_and_a_bad_crc_is_a_decode_error(self) -> None:
        corrupt = bytearray(_payload(9))
        corrupt[5] ^= 0xFF
        link = SerialFrameLink(self._log(_rx(_payload(7)) + _rx(_payload(7)) + _rx(bytes(corrupt))))
        receiver = Receiver(link, CsvStore(self.dir / "out"))
        receiver.drain()
        self.assertEqual((receiver.stats.stored, receiver.stats.duplicates, receiver.stats.decode_errors), (1, 1, 1))
        self.assertEqual(receiver.stats.accounted, receiver.stats.received)

    def test_a_missing_device_raises_so_the_service_backs_off_then_recovers(self) -> None:
        path = self.dir / "not-yet"
        link = SerialFrameLink(path)
        with self.assertRaises(OSError):
            link.receive()
        path.write_text(_rx(_payload()))
        self.assertEqual(link.receive(), _payload())

    def test_a_line_that_never_ends_is_dropped_instead_of_growing_forever(self) -> None:
        link = SerialFrameLink(self._log("x" * (MAX_LINE_BYTES + 10) + "\n" + _rx(_payload())))
        self.assertEqual(link.receive(), _payload())
        self.assertEqual(link.ignored_lines, 1)

    def test_it_cannot_transmit(self) -> None:
        with self.assertRaises(NotImplementedError):
            SerialFrameLink(self.dir / "x").transmit(b"\x00")


class ReplayScriptTests(unittest.TestCase):
    def test_replaying_a_saved_log_stores_each_reading_once(self) -> None:
        with tempfile.TemporaryDirectory() as name:
            log = Path(name) / "s3.log"
            log.write_text(NOISE + _rx(_payload(7)) + _rx(_payload(7)) + _rx(_payload(8)))
            script = Path(__file__).resolve().parents[1] / "scripts" / "run_receiver.py"
            result = subprocess.run(
                [sys.executable, str(script), "--link", "serial", "--serial", str(log), "--out", name + "/out"],
                capture_output=True, text=True, timeout=60, check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("stored=2 duplicates=1", result.stderr)
            csvs = list((Path(name) / "out").glob("*.csv"))
            self.assertEqual(sum(len(p.read_text().splitlines()) - 1 for p in csvs), 2)


class SerialPortTests(unittest.TestCase):
    """A pseudo-terminal stands in for the S3's USB serial port."""

    def setUp(self) -> None:
        self.board, port = pty.openpty()
        self.port_path = os.ttyname(port)
        self.link = SerialFrameLink(self.port_path)
        os.close(port)
        self.assertFalse(self.link.pending)  # opens the port

    def tearDown(self) -> None:
        self.link.close()
        os.close(self.board)

    def test_a_frame_split_across_reads_arrives_once_its_line_ends(self) -> None:
        line = _rx(_payload()).encode()
        os.write(self.board, line[:20])
        self.assertIsNone(self.link.receive())
        os.write(self.board, line[20:])
        self.assertEqual(self.link.receive(), _payload())
        self.assertFalse(self.link.finished)

    def test_the_port_does_not_echo_the_s3s_output_back_to_it(self) -> None:
        # With echo on, every line the S3 prints would come back to it as a typed command.
        os.write(self.board, _rx(_payload()).encode())
        self.assertEqual(self.link.receive(), _payload())
        os.set_blocking(self.board, False)
        with self.assertRaises(BlockingIOError):
            os.read(self.board, 1024)


if __name__ == "__main__":
    unittest.main()
