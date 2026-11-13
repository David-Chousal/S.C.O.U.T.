"""sync_console must open the ESP32 USB port like push_firmware (raw, no echo)."""

from __future__ import annotations

import os
import pathlib
import sys
import tempfile
import termios
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from scout_shore import serial_link  # noqa: E402
from scripts import sync_console  # noqa: E402


class WriteSerialLines(unittest.TestCase):
    def test_opens_raw_and_writes_ascii_lines(self) -> None:
        writes: list[bytes] = []

        def fake_write(fd: int, data: bytes) -> int:
            writes.append(bytes(data))
            return len(data)

        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "port"
            path.write_text("")
            with mock.patch.object(sync_console.os, "open", return_value=3) as opened, mock.patch.object(
                sync_console.os, "isatty", return_value=True
            ), mock.patch.object(sync_console.tty, "setraw") as setraw, mock.patch.object(
                sync_console.os, "write", side_effect=fake_write
            ), mock.patch.object(sync_console.os, "close") as closed, mock.patch.object(
                sync_console.time, "sleep"
            ):
                sync_console._write_serial_lines(path, ["N1:2", "S1:1,0,0,0,0,0,0,0"])

        opened.assert_called_once()
        flags = opened.call_args[0][1]
        self.assertTrue(flags & os.O_RDWR)
        self.assertTrue(flags & os.O_NOCTTY)
        setraw.assert_called_once_with(3, when=termios.TCSANOW)
        self.assertEqual(writes, [b"N1:2\n", b"S1:1,0,0,0,0,0,0,0\n"])
        closed.assert_called_once_with(3)

    def test_retries_a_short_write_until_the_line_is_complete(self) -> None:
        seen: list[bytes] = []

        def fake_write(fd: int, data: bytes) -> int:
            seen.append(bytes(data))
            if len(seen) == 1:
                return 2  # only "N1" of "N1:2\n"
            return len(data)

        with mock.patch.object(sync_console.os, "write", side_effect=fake_write), mock.patch.object(
            serial_link.select, "select", return_value=([], [3], [])
        ):
            serial_link.write_all(3, b"N1:2\n")
        self.assertEqual(seen, [b"N1:2\n", b":2\n"])



class NewestPerBuoy(unittest.TestCase):
    def test_each_buoy_keeps_its_newest_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            data = pathlib.Path(tmp)
            for buoy in ("SCOUT-01", "SCOUT-02"):
                for day in ("20261110", "20261111", "20261112"):
                    (data / f"{buoy}_{day}.csv").write_text("")

            chosen = sync_console._newest_per_buoy(data, 2)

        self.assertEqual(
            sorted(p.name for p in chosen),
            [
                "SCOUT-01_20261111.csv",
                "SCOUT-01_20261112.csv",
                "SCOUT-02_20261111.csv",
                "SCOUT-02_20261112.csv",
            ],
        )


if __name__ == "__main__":
    unittest.main()
