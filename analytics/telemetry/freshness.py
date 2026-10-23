"""How fresh is the buoy's data — judged against its transmit schedule, not wall-clock seconds.

The buoy transmits in three fixed slots a day, 00:10 / 08:10 / 16:10 UTC (docs/hub/facts.md,
SCO-196), each carrying the latest reading. A packet belongs to the first slot at or after its
timestamp. Every later slot that has passed — plus a grace period for a late arrival — with no
packet is a missed slot:

    0 missed → live · 1–2 → stale · 3 or more (a full day) → offline

A fault is a live or stale buoy whose newest packet carries a QC flag or SoH bit. The dashboard
is republished per publish, so freshness is computed at publish time and shown with that time.
Standard library only.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta
from typing import Sequence

SLOT_TIMES = (time(0, 10), time(8, 10), time(16, 10))
GRACE = timedelta(minutes=30)
_STALE_AFTER, _OFFLINE_AFTER = 1, 3


@dataclass(frozen=True)
class Freshness:
    status: str              # "live" | "stale" | "offline" | "fault"
    missed: int | None       # slots missed since the last packet; None when there is none
    last: datetime | None    # timestamp of the newest packet
    slot: datetime | None    # the slot that packet belongs to
    faults: frozenset[str] = frozenset()


def _slots_from(day_start: datetime):
    """Every slot time from the start of ``day_start``'s day, ascending."""
    day = day_start.replace(hour=0, minute=0, second=0, microsecond=0)
    while True:
        for t in SLOT_TIMES:
            yield day.replace(hour=t.hour, minute=t.minute)
        day += timedelta(days=1)


def slot_of(timestamp: datetime) -> datetime:
    """The slot a packet stamped ``timestamp`` belongs to: the first slot at or after it."""
    return next(s for s in _slots_from(timestamp) if s >= timestamp)


def assess(last: datetime | None, *, now: datetime,
           faults: frozenset[str] = frozenset()) -> Freshness:
    if last is None:
        return Freshness("offline", None, None, None)
    owner = slot_of(last)
    # A reading can be newer than any slot that has passed (an imported on-board record, or
    # a publish between a sample and its transmit slot); then it is described by its own time.
    shown_slot = owner if owner <= now else None
    missed = 0
    for s in _slots_from(owner):
        if s <= owner:
            continue
        if s + GRACE > now:
            break
        missed += 1
    if missed >= _OFFLINE_AFTER:
        status = "offline"
    elif faults:
        status = "fault"
    elif missed >= _STALE_AFTER:
        status = "stale"
    else:
        status = "live"
    return Freshness(status, missed, last, shown_slot, faults)


def slot_history(received: Sequence[datetime], *, now: datetime,
                 days: int = 7) -> list[tuple[datetime, bool | None]]:
    """Every slot in the ``days`` days ending today: True received, False missed, None not yet due."""
    owned = {slot_of(t) for t in received}
    # Slots before the first packet ever received are pre-deployment, not silence.
    first = min(owned) if owned else None
    start = (now - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
    out: list[tuple[datetime, bool | None]] = []
    for s in _slots_from(start):
        if len(out) == days * len(SLOT_TIMES):
            break
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
