"""Client for the S.C.O.U.T. Console's device API (``console/``, ADR-0012, SCO-198).

The shore station talks to the console with a per-device bearer token (``SCOUT_CONSOLE_TOKEN``),
never a user's login. It does two things:

- **push** decoded readings, so the console can show the count each buoy last reported;
- **pull** the transmit count requested for each buoy, which the shore then sends to the buoy
  (``N<buoy>:<count>`` to the ESP32 over USB today; over WiFi once SCO-24's push exists).

The console never holds the buoy's HMAC key: it can only ask for a count in 1-3, and the shore
signs the frame. Standard library only (urllib), with the opener injectable for tests.
"""

from __future__ import annotations

import json
import os
import urllib.request
from dataclasses import dataclass
from typing import Callable, Iterable

from .packet import TX_COUNTS, Reading
from .schema import reading_to_row

DEFAULT_TIMEOUT_S = 15.0
MAX_ROWS_PER_PUSH = 200  # the console rejects larger bodies (console/worker/device.js)

Opener = Callable[[urllib.request.Request, float], "object"]


class ConsoleError(RuntimeError):
    """The console could not be reached, refused the token, or sent something malformed."""


@dataclass(frozen=True)
class ConsoleConfig:
    base_url: str
    token: str

    @classmethod
    def from_env(cls, environ: dict[str, str] | None = None) -> "ConsoleConfig | None":
        env = environ if environ is not None else os.environ
        url, token = env.get("SCOUT_CONSOLE_URL"), env.get("SCOUT_CONSOLE_TOKEN")
        if not url or not token:
            return None
        if not url.startswith("https://") and not url.startswith("http://localhost"):
            raise ConsoleError("SCOUT_CONSOLE_URL must be https (or http://localhost for testing)")
        return cls(url.rstrip("/"), token)


def _default_opener(request: urllib.request.Request, timeout: float):
    return urllib.request.urlopen(request, timeout=timeout)  # noqa: S310 — https enforced above


class ConsoleClient:
    def __init__(self, config: ConsoleConfig, *, opener: Opener = _default_opener,
                 timeout_s: float = DEFAULT_TIMEOUT_S) -> None:
        self._config = config
        self._opener = opener
        self._timeout_s = timeout_s

    def _call(self, method: str, path: str, body: dict | None = None) -> dict:
        data = None if body is None else json.dumps(body).encode()
        request = urllib.request.Request(
            self._config.base_url + path, data=data, method=method,
            headers={"Authorization": f"Bearer {self._config.token}",
                     "Content-Type": "application/json", "Accept": "application/json"})
        try:
            with self._opener(request, self._timeout_s) as response:
                payload = json.loads(response.read().decode() or "{}")
        except (OSError, ValueError) as exc:  # URLError/HTTPError are OSErrors
            raise ConsoleError(f"{method} {path} failed: {exc}") from exc
        if not isinstance(payload, dict) or not payload.get("ok", False):
            raise ConsoleError(f"{method} {path}: {payload!r}")
        return payload

    def push_readings(self, readings: Iterable[Reading]) -> int:
        return self.push_rows([reading_to_row(r) for r in readings])

    def push_rows(self, rows: list[dict[str, str]]) -> int:
        """Push schema rows (as the CSV store writes them). Returns how many were new."""
        stored = 0
        for start in range(0, len(rows), MAX_ROWS_PER_PUSH):
            chunk = rows[start:start + MAX_ROWS_PER_PUSH]
            stored += int(self._call("POST", "/api/device/readings", {"rows": chunk}).get("stored", 0))
        return stored

    def requested_counts(self) -> dict[int, int]:
        """``{buoy_id: tx_count}`` for every buoy with a request. Ignores out-of-range values."""
        payload = self._call("GET", "/api/device/settings")
        out: dict[int, int] = {}
        for item in payload.get("buoys", []):
            buoy_id, count = item.get("buoy_id"), item.get("tx_count_requested")
            if isinstance(buoy_id, int) and count in TX_COUNTS:
                out[buoy_id] = count
        return out


def set_commands(requested: dict[int, int]) -> list[str]:
    """The ESP32 shore's USB lines that apply ``requested`` (firmware/src/shore_rx)."""
    return [f"N{buoy}:{count}" for buoy, count in sorted(requested.items())]
