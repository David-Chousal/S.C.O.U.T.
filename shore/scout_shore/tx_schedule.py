"""The daily transmit count on the shore side (SCO-198): which slots a count uses, whether a
frame arrived inside one of them, and whether the buoy has taken up the count it was asked for.

Mirrors ``scout_select_tx_slots`` / ``scout_in_listen_window`` in
``firmware/lib/scout_scheduler``; ``tests/test_tx_schedule.py`` reads ``TX_SLOTS_SOD`` out of
``firmware/src/config.h`` so the two cannot drift. Standard library only.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .packet import TX_COUNTS, Reading

# Seconds after midnight UTC: 00:10, 08:10, 16:10 (config.h TX_SLOTS_SOD, SCO-165).
TX_SLOTS_SOD = (600, 29400, 58200)
DEFAULT_TX_COUNT = 3
LISTEN_HALF_WIDTH_S = 120  # ±2 min around each slot (SCO-165)
_DAY_S = 86400

# Slot indices each count uses (decided 2026-10-25): slot 0 always, so CONSERVE (slot 0 only)
# never sends more than the setting.
_SLOT_INDICES = {1: (0,), 2: (0, 2), 3: (0, 1, 2)}


def slots_for(tx_count: int) -> tuple[int, ...]:
    """Seconds-of-day of the slots ``tx_count`` uses. Raises ValueError outside 1-3."""
    if tx_count not in TX_COUNTS:
        raise ValueError(f"tx_count {tx_count} not in {TX_COUNTS}")
    return tuple(TX_SLOTS_SOD[i] for i in _SLOT_INDICES[tx_count])


def in_listen_window(when: datetime, tx_count: int,
                     half_width_s: int = LISTEN_HALF_WIDTH_S) -> bool:
    """True when ``when`` is within ``half_width_s`` of a slot the count uses, across midnight."""
    second = (when.hour * 3600 + when.minute * 60 + when.second) % _DAY_S
    for slot in slots_for(tx_count):
        ahead = (second - slot) % _DAY_S
        if min(ahead, _DAY_S - ahead) <= half_width_s:
            return True
    return False


@dataclass(frozen=True)
class CountStatus:
    """Requested vs reported count for one buoy, as the dashboard and console show it."""

    requested: int | None   # what someone asked for; None = nothing requested
    reported: int | None    # what the buoy's newest v4 packet says it uses
    rejected: bool = False  # that packet carried CMD_REJECTED

    @property
    def state(self) -> str:
        """``confirmed`` | ``pending`` | ``rejected`` | ``unreported`` | ``default``."""
        if self.requested is None:
            return "default" if self.reported in (None, DEFAULT_TX_COUNT) else "confirmed"
        if self.reported == self.requested:
            return "confirmed"
        if self.rejected:
            return "rejected"
        return "pending" if self.reported is not None else "unreported"

    @property
    def needs_command(self) -> bool:
        """The shore should send SET_TX_COUNT in this buoy's next listen window."""
        return self.requested is not None and self.reported != self.requested


def status_from(reading: Reading, requested: int | None) -> CountStatus:
    return CountStatus(requested, reading.tx_count, "CMD_REJECTED" in reading.flags)


def tag(reading: Reading, received_at: datetime, requested: int | None) -> str:
    """``in`` or ``out``: did the frame arrive inside a slot of the count the buoy is using?

    Uses the count the frame reports (v4), else the requested count, else the default 3, the
    same order as the ESP32 receiver (firmware/src/shore_rx).
    """
    count = reading.tx_count or requested or DEFAULT_TX_COUNT
    return "in" if in_listen_window(received_at, count) else "out"
