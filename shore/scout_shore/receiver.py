"""Mock LoRa link + shore receiver.

:class:`MockLoRaLink` stands in for the radio so the full path runs with no hardware —
the buoy side calls :meth:`transmit`, the shore side calls :meth:`receive`. It can inject
packet loss and bit corruption to exercise the receiver's error handling. When real
hardware arrives, swap this for an ``adafruit-rfm9x`` backend exposing the same two methods.

:class:`Receiver` pulls payloads, decodes + validates them, stores good ones, and tracks
loss/error counts.
"""

from __future__ import annotations

import random
from collections import deque
from dataclasses import dataclass

from .packet import PacketError, Reading, decode
from .schema import SchemaError, validate_row, reading_to_row
from .store import CsvStore


class MockLoRaLink:
    """In-memory loopback radio with optional loss/corruption (deterministic via ``seed``)."""

    def __init__(self, *, loss_rate: float = 0.0, corrupt_rate: float = 0.0, seed: int = 0) -> None:
        if not 0.0 <= loss_rate <= 1.0 or not 0.0 <= corrupt_rate <= 1.0:
            raise ValueError("loss_rate and corrupt_rate must be in [0, 1]")
        self._queue: deque[bytes] = deque()
        self._loss_rate = loss_rate
        self._corrupt_rate = corrupt_rate
        self._rng = random.Random(seed)
        self.dropped = 0

    def transmit(self, payload: bytes) -> None:
        """Buoy side: send a payload. May silently drop or corrupt it to mimic RF."""
        if self._rng.random() < self._loss_rate:
            self.dropped += 1
            return
        if self._rng.random() < self._corrupt_rate:
            payload = self._flip_a_bit(payload)
        self._queue.append(payload)

    def receive(self) -> bytes | None:
        """Shore side: next payload in arrival order, or ``None`` if nothing is waiting."""
        return self._queue.popleft() if self._queue else None

    @property
    def pending(self) -> int:
        """How many payloads are waiting to be received."""
        return len(self._queue)

    def _flip_a_bit(self, payload: bytes) -> bytes:
        index = self._rng.randrange(len(payload))
        mutated = bytearray(payload)
        mutated[index] ^= 1 << self._rng.randrange(8)
        return bytes(mutated)


@dataclass
class ReceiverStats:
    received: int = 0
    stored: int = 0
    duplicates: int = 0  # valid repeats of a reading already stored — expected, not an error
    decode_errors: int = 0
    schema_errors: int = 0

    @property
    def accounted(self) -> int:
        """Every payload lands in exactly one bucket; this must equal ``received``."""
        return self.stored + self.duplicates + self.decode_errors + self.schema_errors


class Receiver:
    """Decodes payloads off a link, validates, and appends good readings to the store."""

    def __init__(self, link: MockLoRaLink, store: CsvStore) -> None:
        self._link = link
        self._store = store
        self.stats = ReceiverStats()

    def poll_once(self) -> Reading | None:
        """Process a single waiting payload. Returns the stored Reading, or ``None``.

        ``None`` also covers a duplicate — the buoy repeats each daily packet blindly, so
        copies after the first are counted and dropped rather than stored again.
        """
        payload = self._link.receive()
        if payload is None:
            return None
        self.stats.received += 1
        try:
            reading = decode(payload)
        except PacketError:
            self.stats.decode_errors += 1
            return None
        try:
            validate_row(reading_to_row(reading))
        except SchemaError:
            self.stats.schema_errors += 1
            return None
        if self._store.append(reading) is None:
            self.stats.duplicates += 1
            return None
        self.stats.stored += 1
        return reading

    def drain(self) -> int:
        """Process every waiting payload. Returns the number stored this call."""
        stored_before = self.stats.stored
        while self._link.pending:
            self.poll_once()
        return self.stats.stored - stored_before
