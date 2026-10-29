"""The ESP32-S3 shore receiver, seen from a computer over USB (SCO-257).

The shore station is the ESP32-S3 Feather with a LoRa FeatherWing (``firmware/src/shore_rx/``).
It prints a line for every frame it hears, before validating it::

    RX len=44 rssi=-41 snr=9 n=3 hex=0301...

Until the S3 pushes readings over WiFi itself (SCO-237), a computer plugged into its USB port
stands in for that push. This module is that computer's view of the S3: a
:class:`~scout_shore.link.LoRaLink` whose payloads are the ``RX`` lines, so the existing
:class:`~scout_shore.receiver.Receiver` re-validates each one with the shore codec and stores it
through the idempotent CSV store, and :class:`~scout_shore.service.ReceiverService` keeps it
running. Every other line the S3 prints (``OK``, ``DUP``, ``BAD``, clock and command replies) is
counted and ignored; the computer does its own checks instead of trusting them.

The source is a serial port or a log file. A port is put in raw mode, because with echo on every
line the S3 prints would be sent back to it as a typed command. Reads never block, and an
unplugged board raises :class:`OSError` so the service backs off and reopens it. A log file is
read to its end and then followed, so a log still being written keeps arriving.
Standard library only, like the rest of the package.
"""

from __future__ import annotations

import os
import stat
import tty
from collections import deque
from pathlib import Path

from .bench_frames import parse_rx_line

# The longest real line is an RX line for the 140-byte payload ceiling (~320 characters).
# Anything far longer is line noise, and must not grow the buffer without bound.
MAX_LINE_BYTES = 1024
_READ_BYTES = 4096


class SerialFrameLink:
    """Payloads from the S3's ``RX`` lines, read from a serial port or a log file."""

    def __init__(self, path: str | Path) -> None:
        self._path = Path(path)
        self._fd: int | None = None
        self._is_port = False
        self._buffer = b""
        self._discarding = False
        self._payloads: deque[bytes] = deque()
        self.finished = False
        self.ignored_lines = 0
        self.malformed_lines = 0

    def transmit(self, payload: bytes) -> None:
        raise NotImplementedError("the S3 transmits on its own; this link only reads its output")

    def receive(self) -> bytes | None:
        if not self.pending:
            return None
        return self._payloads.popleft()

    @property
    def pending(self) -> int:
        """Read whatever has arrived, then report the complete frames waiting."""
        self._fill()
        return len(self._payloads)

    def close(self) -> None:
        if self._fd is not None:
            os.close(self._fd)
            self._fd = None

    def _open(self) -> int:
        fd = os.open(self._path, os.O_RDONLY | os.O_NONBLOCK | os.O_NOCTTY)
        self._is_port = not stat.S_ISREG(os.fstat(fd).st_mode)
        if self._is_port and os.isatty(fd):
            tty.setraw(fd)
        return fd

    def _fill(self) -> None:
        if self._fd is None:
            self._fd = self._open()  # raises while the board is unplugged; the service backs off
        while True:
            try:
                chunk = os.read(self._fd, _READ_BYTES)
            except BlockingIOError:
                return
            except OSError:
                self.close()
                raise
            if not chunk:
                if self._is_port:
                    self.close()
                    raise OSError(f"{self._path} hung up (S3 unplugged or reset)")
                self.finished = True
                return
            self.finished = False
            self._take(chunk)

    def _take(self, chunk: bytes) -> None:
        *lines, self._buffer = (self._buffer + chunk).split(b"\n")
        if self._discarding and lines:
            lines.pop(0)  # the tail of a line already dropped as too long
            self._discarding = False
        if len(self._buffer) > MAX_LINE_BYTES:
            self._buffer = b""
            self._discarding = True
            self.ignored_lines += 1
        for line in lines:
            self._line(line)

    def _line(self, raw: bytes) -> None:
        text = raw.decode("ascii", errors="replace").strip()
        if not text:
            return
        if len(raw) > MAX_LINE_BYTES:
            self.ignored_lines += 1
            return
        try:
            frame = parse_rx_line(text)
        except ValueError:
            self.malformed_lines += 1
            return
        if frame is None:
            self.ignored_lines += 1
        else:
            self._payloads.append(frame.payload)
