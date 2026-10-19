"""Parse the bench LoRa receiver's serial output (firmware env ``feather_m0_rx``, SCO-155).

The receiver prints one line per frame::

    RX len=30 rssi=-41 snr=9.50 n=3 hex=0101...

This is a bench instrument for testing the link before the ESP32-S3 shore station exists; it is
not the shore station's data path (docs/engineering/shore-station.md).
"""

from __future__ import annotations

import re
from dataclasses import dataclass

_RX_LINE = re.compile(
    r"^RX len=(?P<len>\d+) rssi=(?P<rssi>-?\d+) snr=(?P<snr>-?[\d.]+)(?: n=\d+)? hex=(?P<hex>\S*)$"
)


@dataclass(frozen=True)
class RxLine:
    payload: bytes
    rssi: int
    snr: float


def parse_rx_line(line: str) -> RxLine | None:
    """Return the frame on a receiver line, ``None`` for any other line.

    Raises ``ValueError`` for a frame line that is malformed, so it is reported rather than
    quietly skipped.
    """
    match = _RX_LINE.match(line.strip())
    if match is None:
        return None
    payload = bytes.fromhex(match["hex"])  # raises ValueError on bad hex
    if len(payload) != int(match["len"]):
        raise ValueError(f"len={match['len']} but hex holds {len(payload)} bytes")
    return RxLine(payload=payload, rssi=int(match["rssi"]), snr=float(match["snr"]))
