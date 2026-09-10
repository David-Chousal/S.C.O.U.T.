"""The long-running loop that keeps the shore station receiving.

Everything else in this package is a library: a codec, a store, a receiver that processes one
payload. Nothing ran them continuously, so the shore station was a script someone had to start
by hand and restart after every reboot. That is not a deployment — the buoy transmits blind,
without acknowledgement, so if nothing is listening neither side raises an alarm. The readings
are safe on the buoy's SD card, but recovering them means a boat.

This module is the piece that refuses to die. Its whole design goal is that no single failure
takes the process down:

- **A radio that throws** (SPI error, HAT knocked off the header) is caught, counted, and
  retried with a widening backoff so a permanently dead link does not pin the Pi's CPU.
- **A corrupt or invalid packet** is already counted by :class:`~scout_shore.receiver.Receiver`;
  it never reaches this loop as an exception.
- **SIGTERM** — what systemd sends on ``stop`` and on reboot — sets a flag and lets the loop
  finish its iteration, so the CSV store is never interrupted mid-write.

It deliberately does **not** use :meth:`Receiver.drain`, because that loops on ``link.pending``
and a real SX1276 cannot report how many packets are waiting —
:class:`~scout_shore.radio.Rfm9xLink` returns 0 always and says so. A loop built on ``pending``
works perfectly against the mock and sits idle forever against real sky, which is a bug that
would not surface until field day. Instead the loop watches ``stats.received``, which counts
payloads actually taken off the link and is true on both.

Standard library only.
"""

from __future__ import annotations

import logging
import signal
from dataclasses import dataclass
from time import monotonic as _monotonic, sleep as _sleep
from typing import Callable

from .receiver import Receiver, ReceiverStats

log = logging.getLogger("scout_shore.service")

# One packet per buoy per day in normal operation, repeated a few times. There is nothing to
# gain from a tight poll, and a Pi on a solar-charged battery has every reason not to.
DEFAULT_POLL_INTERVAL_S = 1.0
DEFAULT_STATS_INTERVAL_S = 3600.0


@dataclass(frozen=True)
class ServiceConfig:
    poll_interval_s: float = DEFAULT_POLL_INTERVAL_S
    stats_interval_s: float = DEFAULT_STATS_INTERVAL_S
    # A failing link backs off from poll_interval up to this, then holds. Capped so a station
    # that comes back after an outage starts receiving again promptly rather than an hour later.
    max_backoff_s: float = 60.0
    backoff_factor: float = 2.0


class ReceiverService:
    """Polls a :class:`Receiver` until asked to stop."""

    def __init__(
        self,
        receiver: Receiver,
        *,
        config: ServiceConfig | None = None,
        sleep: Callable[[float], None] = _sleep,
        monotonic: Callable[[], float] = _monotonic,
    ) -> None:
        self._receiver = receiver
        self._config = config or ServiceConfig()
        self._sleep = sleep
        self._monotonic = monotonic
        self._stop = False
        self._backoff_s = self._config.poll_interval_s
        self.link_errors = 0

    @property
    def stats(self) -> ReceiverStats:
        return self._receiver.stats

    def request_stop(self) -> None:
        """Ask the loop to finish its current iteration and return."""
        self._stop = True

    def install_signal_handlers(self) -> None:
        """Turn SIGTERM/SIGINT into a clean stop rather than a killed process mid-write."""
        for sig in (signal.SIGTERM, signal.SIGINT):
            signal.signal(sig, lambda *_: self.request_stop())

    def run(self, *, max_iterations: int | None = None) -> ReceiverStats:
        """Receive until stopped. ``max_iterations`` bounds the loop for tests."""
        iterations = 0
        last_stats_at = self._monotonic()

        while not self._stop:
            if max_iterations is not None and iterations >= max_iterations:
                break
            iterations += 1

            try:
                consumed = self._pump()
            except Exception:  # noqa: BLE001 — a live station must outlast any link fault
                self.link_errors += 1
                log.exception("link read failed (%d so far); backing off %.1fs",
                              self.link_errors, self._backoff_s)
                self._sleep(self._backoff_s)
                self._widen_backoff()
                continue

            self._backoff_s = self._config.poll_interval_s
            if not consumed:
                # Nothing waiting. Idle rather than spin; a backlog is drained without napping.
                self._sleep(self._config.poll_interval_s)

            now = self._monotonic()
            if now - last_stats_at >= self._config.stats_interval_s:
                self._log_stats()
                last_stats_at = now

        return self._receiver.stats

    def _pump(self) -> int:
        """Take every payload currently available off the link. Returns how many were consumed.

        Counted via ``stats.received`` rather than :meth:`Receiver.poll_once`'s return value,
        which is ``None`` for a duplicate or a bad packet as well as for an empty link — those
        are consumed payloads and must not be mistaken for an idle radio.
        """
        consumed = 0
        while not self._stop:
            before = self._receiver.stats.received
            self._receiver.poll_once()
            if self._receiver.stats.received == before:
                break  # nothing was taken off the link
            consumed += 1
        return consumed

    def _widen_backoff(self) -> None:
        self._backoff_s = min(
            self._backoff_s * self._config.backoff_factor, self._config.max_backoff_s
        )

    def _log_stats(self) -> None:
        s = self._receiver.stats
        log.info(
            "received=%d stored=%d duplicates=%d decode_errors=%d schema_errors=%d link_errors=%d",
            s.received, s.stored, s.duplicates, s.decode_errors, s.schema_errors, self.link_errors,
        )
