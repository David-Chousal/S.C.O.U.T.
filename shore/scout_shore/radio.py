"""Real SX1276 (RFM95) receive backend for the shore station.

⚠️ **Written against datasheets and the buoy's firmware; never run against hardware.** No
RFM95 has been connected to a Raspberry Pi on this project. Treat every value here as a
hypothesis to verify at
[Integration Runbook Stage 6](../../docs/engineering/integration-runbook.md), not as a fact.

This module is deliberately the *only* place in ``scout_shore`` that needs third-party
packages, and it imports them lazily inside :meth:`Rfm9xLink.__init__`. Importing this module
on a machine with no radio libraries installed therefore succeeds — which matters because the
rest of the shore station is standard-library only by design, so its test suite runs on a bare
Pi with nothing installed.

Three things here are easy to get wrong and expensive to debug in the field:

1. **The modem config must match the buoy exactly.** LoRa is not self-describing: a receiver
   configured differently does not receive a degraded signal, it receives nothing at all.
2. **The SX1276 500 kHz errata.** At BW >= 500 kHz two undocumented registers must be written
   or the receiver silently misses its datasheet sensitivity — which presents as "the link is
   weak", sending you to look at antennas and range.
3. **RadioHead prepends a 4-byte header.** The buoy transmits via RadioHead's ``RH_RF95``,
   which puts TO/FROM/ID/FLAGS ahead of the payload. Adafruit's driver uses a 4-byte header in
   the same position, so ``with_header=False`` strips it correctly — but only because the two
   happen to agree on length. Verify the first received frame byte-for-byte against
   ``scripts/check_packet_contract.py``'s golden vector before trusting it.
"""

from __future__ import annotations

# ── Modem configuration — must match firmware/src/config.h ────────────────────────────────
# Set by FCC compliance, not preference: 47 CFR 15.247 requires either a >=500 kHz bandwidth
# or >=50-channel hopping, and the earlier BW125 single-channel config met neither. See
# docs/research/fcc-915-mhz-compliance.md. Do not narrow the bandwidth to chase range.
FREQUENCY_MHZ = 915.0
SIGNAL_BANDWIDTH_HZ = 500_000
SPREADING_FACTOR = 12
CODING_RATE = 8            # denominator of 4/8, matching the buoy's CR 4/8

# ── SX1276 errata 2.1, "Sensitivity Optimization with 500 kHz Bandwidth" ──────────────────
# Receive-side only, so it belongs here rather than in the firmware. See
# docs/hub/research/notes/sx1276-errata-500khz.md.
_REG_HIGH_BW_OPTIMIZE_1 = 0x36
_REG_HIGH_BW_OPTIMIZE_2 = 0x3A
_HIGH_BW_OPTIMIZE_1_AT_500K = 0x02   # 0x03 at lower bandwidths
_HIGH_BW_OPTIMIZE_2_AT_500K = 0x64   # chip-selected automatically at lower bandwidths

_RECEIVE_TIMEOUT_S = 0.5             # short: the caller polls, and must not block on an idle sky


class Rfm9xLink:
    """A :class:`~scout_shore.link.LoRaLink` backed by a real RFM95 on a Raspberry Pi.

    Receive-only. :meth:`transmit` raises — the shore station listens; the buoy talks.
    """

    def __init__(self, *, cs_pin: str = "CE1", reset_pin: str = "D25") -> None:
        """Bring up the radio. Pin names are Blinka board names, not BCM numbers.

        Raises :class:`RuntimeError` with an actionable message when the radio packages are
        absent, rather than an ImportError from three frames down.
        """
        try:
            import adafruit_rfm9x  # type: ignore[import-not-found]
            import board  # type: ignore[import-not-found]
            import busio  # type: ignore[import-not-found]
            import digitalio  # type: ignore[import-not-found]
        except ImportError as exc:  # pragma: no cover - needs a Pi to reach
            raise RuntimeError(
                "The real radio backend needs adafruit-circuitpython-rfm9x (which pulls in "
                "Adafruit-Blinka). Install it on the Pi with:\n"
                "    pip install adafruit-circuitpython-rfm9x\n"
                "Note this is the only third-party dependency in the shore station — the rest "
                "is standard-library only so it runs on a bare Pi."
            ) from exc

        spi = busio.SPI(board.SCK, MOSI=board.MOSI, MISO=board.MISO)
        cs = digitalio.DigitalInOut(getattr(board, cs_pin))
        reset = digitalio.DigitalInOut(getattr(board, reset_pin))

        self._rfm = adafruit_rfm9x.RFM9x(spi, cs, reset, FREQUENCY_MHZ)
        self._rfm.signal_bandwidth = SIGNAL_BANDWIDTH_HZ
        self._rfm.spreading_factor = SPREADING_FACTOR
        self._rfm.coding_rate = CODING_RATE
        self._apply_high_bandwidth_errata()

    def _apply_high_bandwidth_errata(self) -> None:
        """Write the two undocumented registers the SX1276 needs at BW >= 500 kHz.

        Skipped below 500 kHz, where the chip selects these itself. Without this the receiver
        works — it just misses its rated sensitivity, which looks exactly like a bad antenna.
        """
        if SIGNAL_BANDWIDTH_HZ < 500_000:
            return
        self._rfm._write_u8(_REG_HIGH_BW_OPTIMIZE_1, _HIGH_BW_OPTIMIZE_1_AT_500K)
        self._rfm._write_u8(_REG_HIGH_BW_OPTIMIZE_2, _HIGH_BW_OPTIMIZE_2_AT_500K)

    def transmit(self, payload: bytes) -> None:
        """Not supported. The shore station receives; the buoy transmits."""
        raise NotImplementedError(
            "Rfm9xLink is receive-only. Use MockLoRaLink to play the buoy side in a loopback."
        )

    def receive(self) -> bytes | None:
        """One payload, or ``None`` if nothing arrived within the poll timeout.

        ``with_header=False`` strips the 4-byte header the buoy's RadioHead stack prepends.
        """
        packet = self._rfm.receive(timeout=_RECEIVE_TIMEOUT_S, with_header=False)
        return bytes(packet) if packet is not None else None

    @property
    def pending(self) -> int:
        """Always 0 — a radio cannot report a queue depth it does not have.

        ``Receiver.drain`` would spin forever on a real sky, so poll with
        ``Receiver.poll_once`` in a loop instead. ``drain`` remains correct for the loopback.
        """
        return 0

    @property
    def last_rssi(self) -> int | None:
        """RSSI of the last received packet, in dBm. Useful for the Phase 4 range test."""
        return getattr(self._rfm, "last_rssi", None)
