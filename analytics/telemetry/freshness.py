"""How fresh is the buoy's data — judged against its transmit schedule, not wall-clock seconds.

The buoy transmits in three fixed slots a day, 00:10 / 08:10 / 16:10 UTC (docs/hub/facts.md,
SCO-196), each carrying the latest reading. A packet belongs to the first slot at or after its
timestamp. Every later slot that has passed — plus a grace period for a late arrival — with no
packet is a missed slot:

    0 missed → live · 1 to a day's worth less one → stale · a full day of slots → offline

How many slots a day is the buoy's daily transmit count (SCO-198): 1 → 00:10, 2 → 00:10 and
16:10, 3 → all three. Only the slots the count uses are scheduled, so a buoy on 1 a day is not
"missing" its 08:10 and 16:10 slots. The count is the one the newest packet reports (schema v4);
a buoy that does not report one is on the default 3.

A fault is a live or stale buoy whose newest packet carries a QC flag or SoH bit. The dashboard
is republished per publish, so freshness is computed at publish time and shown with that time.
Standard library only.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta
from typing import Sequence

SLOT_TIMES = (time(0, 10), time(8, 10), time(16, 10))
DEFAULT_TX_COUNT = 3
# Slot indices each count uses; mirrors scout_tx_slot_mask in firmware/lib/scout_scheduler.
_SLOT_INDICES = {1: (0,), 2: (0, 2), 3: (0, 1, 2)}
GRACE = timedelta(minutes=30)
_STALE_AFTER = 1


def slot_times(tx_count: int | None = None) -> tuple[time, ...]:
    """The slots a daily transmit count uses; ``None`` (not reported) is the default 3."""
    count = DEFAULT_TX_COUNT if tx_count is None else tx_count
    if count not in _SLOT_INDICES:
        raise ValueError(f"tx_count {tx_count} not in 1-3")
    return tuple(SLOT_TIMES[i] for i in _SLOT_INDICES[count])


@dataclass(frozen=True)
class Freshness:
    status: str              # "live" | "stale" | "offline" | "fault"
    missed: int | None       # slots missed since the last packet; None when there is none
    last: datetime | None    # timestamp of the newest packet
    slot: datetime | None    # the slot that packet belongs to
    faults: frozenset[str] = frozenset()


def _slots_from(day_start: datetime, times: tuple[time, ...] = SLOT_TIMES):
    """Every slot time from the start of ``day_start``'s day, ascending."""
    day = day_start.replace(hour=0, minute=0, second=0, microsecond=0)
    while True:
        for t in times:
            yield day.replace(hour=t.hour, minute=t.minute)
        day += timedelta(days=1)


def slot_of(timestamp: datetime, tx_count: int | None = None) -> datetime:
    """The slot a packet stamped ``timestamp`` belongs to: the first slot at or after it."""
    return next(s for s in _slots_from(timestamp, slot_times(tx_count)) if s >= timestamp)


def assess(last: datetime | None, *, now: datetime,
           faults: frozenset[str] = frozenset(), tx_count: int | None = None) -> Freshness:
    """Freshness against the slots ``tx_count`` uses; offline after a full day of them."""
    if last is None:
        return Freshness("offline", None, None, None)
    times = slot_times(tx_count)
    offline_after = len(times)
    owner = slot_of(last, tx_count)
    # A reading can be newer than any slot that has passed (an imported on-board record, or
    # a publish between a sample and its transmit slot); then it is described by its own time.
    shown_slot = owner if owner <= now else None
    missed = 0
    for s in _slots_from(owner, times):
        if s <= owner:
            continue
        if s + GRACE > now:
            break
        missed += 1
    if missed >= offline_after:
        status = "offline"
    elif faults:
        status = "fault"
    elif missed >= _STALE_AFTER:
        status = "stale"
    else:
        status = "live"
    return Freshness(status, missed, last, shown_slot, faults)


def slot_history(received: Sequence[datetime], *, now: datetime, days: int = 7,
                 tx_count: int | None = None) -> list[tuple[datetime, bool | None]]:
    """Every scheduled slot in the ``days`` days ending today: True received, False missed,
    None not yet due. Only the slots ``tx_count`` uses are scheduled; a table slot outside them
    is listed only if a packet arrived for it (e.g. before the count was lowered)."""
    times = slot_times(tx_count)
    owned = {slot_of(t) for t in received}  # against the full table: what each packet answered
    # Slots before the first packet ever received are pre-deployment, not silence.
    first = min(owned) if owned else None
    start = (now - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=days)
    out: list[tuple[datetime, bool | None]] = []
    for s in _slots_from(start):
        if s >= end:
            break
        scheduled = s.time() in times
        if not scheduled and s not in owned:
            continue
        due = s + GRACE <= now and first is not None and s >= first
        out.append((s, (s in owned) if due else None))
    return out


def describe(f: Freshness) -> str:
    """One plain sentence for the status line."""
    if f.last is None:
        return "No packets received yet"
    slot = (f"the {f.slot:%H:%M} UTC slot, {f.slot:%Y-%m-%d}" if f.slot
            else f"latest reading {f.last:%H:%M} UTC, {f.last:%Y-%m-%d}")
    lead = f"Last packet in {slot}" if f.slot else slot[0].upper() + slot[1:]
    if f.status == "live":
        return lead
    if f.status == "fault":
        return f"{lead} carries a fault: {', '.join(sorted(f.faults))}"
    noun = "slot" if f.missed == 1 else "slots"
    return f"{lead} · {f.missed} {noun} missed"
