"""The radio interface the shore station is written against.

:class:`Receiver` does not care whether bytes arrive from a real SX1276 or from an in-memory
loopback — it only needs something it can pull payloads from. Naming that contract as a
``Protocol`` is what lets the mock and the real radio be swapped without touching the
receiver, and it is what a new backend implements *against* rather than guessing at.

Structural typing, so nothing has to inherit from anything: any object with these three
members satisfies it. ``MockLoRaLink`` already did, which is why the swap is safe.

Standard library only — this module must stay importable on a bare Raspberry Pi with no
packages installed, because the shore test suite runs there.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class LoRaLink(Protocol):
    """A source of LoRa payloads, and a sink for them.

    ``transmit`` exists because the loopback needs it to play the buoy side; a receive-only
    shore backend may raise :class:`NotImplementedError` from it rather than pretend.
    """

    def transmit(self, payload: bytes) -> None:
        """Send one payload. Shore-side backends need not support this."""
        ...

    def receive(self) -> bytes | None:
        """Return the next waiting payload, or ``None`` if nothing is waiting.

        Must not block indefinitely — the caller polls.
        """
        ...

    @property
    def pending(self) -> int:
        """How many payloads are waiting. ``Receiver.drain`` loops until this is 0.

        A real radio cannot know this in advance; it reports 1 while a packet is available
        and 0 otherwise, which is all ``drain`` requires.
        """
        ...
