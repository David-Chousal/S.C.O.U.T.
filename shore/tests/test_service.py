"""The long-running receiver loop that keeps the shore station up.

Without this there is no service at all: someone SSHes into the Pi and runs a script by hand,
and the next reboot or power cut ends the deployment silently. The buoy keeps transmitting into
an empty room — and because it transmits blind, with no acknowledgement, nothing on the buoy
notices either. The data is on its SD card, which is a boat trip away.

So the loop's job is not to be clever, it is to refuse to die: a decode failure, a schema
violation, or a radio that throws must never take the process down.
"""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scout_shore import CsvStore, MockLoRaLink, Receiver, encode, generate_series
from scout_shore.service import ReceiverService, ServiceConfig
from datetime import datetime, timezone


class _FakeClock:
    """Monotonic time we control, so the tests never actually sleep."""

    def __init__(self) -> None:
        self.now = 0.0
        self.slept: list[float] = []

    def sleep(self, seconds: float) -> None:
        self.slept.append(seconds)
        self.now += seconds

    def monotonic(self) -> float:
        return self.now


class _ExplodingLink:
    """A radio that raises on every read — a wiring fault, or a HAT that fell off the header."""

    def __init__(self, exc: Exception | None = None) -> None:
        self.calls = 0
        self._exc = exc or OSError("SPI read failed")

    def receive(self) -> bytes | None:
        self.calls += 1
        raise self._exc

    @property
    def pending(self) -> int:
        return 0

    def transmit(self, payload: bytes) -> None:  # pragma: no cover - shore never transmits
        raise NotImplementedError


def _loaded_link(count: int = 5) -> MockLoRaLink:
    link = MockLoRaLink()
    start = datetime(2026, 8, 14, tzinfo=timezone.utc)
    for reading in generate_series(start, count, buoy_id=1, seed=0):
        link.transmit(encode(reading))
    return link


class ServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.out = Path(self._tmp.name)
        self.clock = _FakeClock()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def _service(self, link, **kw) -> ReceiverService:
        receiver = Receiver(link, CsvStore(self.out))
        return ReceiverService(
            receiver,
            config=ServiceConfig(**kw),
            sleep=self.clock.sleep,
            monotonic=self.clock.monotonic,
        )

    def test_it_stores_what_arrives(self) -> None:
        service = self._service(_loaded_link(5))
        stats = service.run(max_iterations=10)
        self.assertEqual(stats.stored, 5)
        self.assertTrue(list(self.out.glob("*.csv")))

    def test_a_throwing_radio_does_not_kill_the_service(self) -> None:
        """The whole reason this is a service and not a script."""
        link = _ExplodingLink()
        service = self._service(link)
        stats = service.run(max_iterations=3)  # must return, not raise
        self.assertEqual(stats.stored, 0)
        self.assertEqual(service.link_errors, 3)
        self.assertGreater(link.calls, 0)

    def test_it_backs_off_instead_of_spinning_on_a_dead_radio(self) -> None:
        """A permanently broken link must not pin the Pi's CPU at 100%."""
        service = self._service(_ExplodingLink(), poll_interval_s=1.0, max_backoff_s=30.0)
        service.run(max_iterations=6)
        self.assertTrue(self.clock.slept, "a failing loop that never sleeps is a busy-wait")
        self.assertGreater(self.clock.slept[-1], self.clock.slept[0], "backoff should widen")
        self.assertLessEqual(max(self.clock.slept), 30.0, "backoff must stay capped")

    def test_backoff_resets_after_the_radio_recovers(self) -> None:
        """A transient fault must not leave the station polling once every 30 s forever."""
        service = self._service(_ExplodingLink(), poll_interval_s=1.0)
        service.run(max_iterations=4)
        widened = service._backoff_s
        service._receiver = Receiver(_loaded_link(2), CsvStore(self.out))
        service.run(max_iterations=4)
        self.assertLess(service._backoff_s, widened)

    def test_it_sleeps_when_nothing_is_waiting(self) -> None:
        service = self._service(MockLoRaLink(), poll_interval_s=2.5)
        service.run(max_iterations=3)
        self.assertEqual(self.clock.slept, [2.5, 2.5, 2.5])

    def test_it_does_not_sleep_while_packets_are_backed_up(self) -> None:
        """After a shore outage a burst is waiting; draining it should not take one nap each.

        One iteration must absorb the whole backlog. At the 30-min cadence a nap per packet
        would mean a station coming back from an outage takes longer to catch up than the
        outage itself lasted.
        """
        service = self._service(_loaded_link(5), poll_interval_s=2.5)
        stats = service.run(max_iterations=1)
        self.assertEqual(stats.stored, 5, "one iteration should absorb the whole backlog")
        self.assertEqual(self.clock.slept, [], "no idling while packets are still waiting")

    def test_stop_is_honoured(self) -> None:
        """systemd sends SIGTERM on `stop` and on reboot; the loop must exit, not be killed."""
        service = self._service(_loaded_link(50))
        service.request_stop()
        stats = service.run(max_iterations=100)
        self.assertEqual(stats.stored, 0, "stop before the first poll means no work happens")

    def test_a_corrupt_packet_does_not_stop_the_loop(self) -> None:
        """Bad data on the air is expected; it is counted, not fatal."""
        link = MockLoRaLink()
        link.transmit(b"\x00" * 30)  # decodes to nothing valid
        for reading in generate_series(datetime(2026, 8, 14, tzinfo=timezone.utc), 2, buoy_id=1):
            link.transmit(encode(reading))
        service = self._service(link)
        stats = service.run(max_iterations=10)
        self.assertEqual(stats.stored, 2)
        self.assertGreater(stats.decode_errors + stats.schema_errors, 0)

    def test_it_does_not_rely_on_pending(self) -> None:
        """`pending` is unknowable on a real SX1276 — Rfm9xLink returns 0 always. A loop built
        on it would sit idle forever against real sky, which is exactly the bug that would not
        show up until field day."""
        link = _loaded_link(4)
        link.__class__.pending = property(lambda self: 0)  # type: ignore[assignment]
        try:
            service = self._service(link)
            stats = service.run(max_iterations=10)
            self.assertEqual(stats.stored, 4)
        finally:
            del link.__class__.pending


if __name__ == "__main__":
    unittest.main()
