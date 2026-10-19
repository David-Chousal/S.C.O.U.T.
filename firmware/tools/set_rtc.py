#!/usr/bin/env python3
"""Set the buoy's PCF8523 clock to UTC over USB (SCO-201).

The firmware listens for one line "T<unix-epoch>" for about 8 s after a power-on or reset, but
only while a USB host has the port open. So:

    python3 firmware/tools/set_rtc.py          # then press RESET on the Feather once

The script waits for the board's port to appear, opens it, waits for the firmware's
"time: send T<unix-epoch>" prompt, sends the current UTC time, and prints the reply. Standard
library only (termios), so it runs anywhere Python does on macOS or Linux.
"""

from __future__ import annotations

import argparse
import glob
import os
import sys
import termios
import time

PROMPT = b"time: send T"
PORT_GLOBS = ("/dev/cu.usbmodem*", "/dev/ttyACM*")


def find_port() -> str | None:
    ports = sorted(p for pattern in PORT_GLOBS for p in glob.glob(pattern))
    return ports[0] if ports else None


def open_raw(port: str) -> int:
    fd = os.open(port, os.O_RDWR | os.O_NOCTTY | os.O_NONBLOCK)
    attrs = termios.tcgetattr(fd)
    attrs[0] = attrs[1] = attrs[3] = 0          # raw: no input/output/local processing
    attrs[2] = termios.CS8 | termios.CREAD | termios.CLOCAL
    attrs[4] = attrs[5] = termios.B115200        # ignored by USB CDC, set for tidiness
    termios.tcsetattr(fd, termios.TCSANOW, attrs)
    return fd


def read_until(fd: int, needle: bytes, deadline: float) -> bytes:
    seen = b""
    while time.monotonic() < deadline:
        try:
            chunk = os.read(fd, 256)
        except BlockingIOError:
            chunk = b""
        if chunk:
            seen += chunk
            sys.stdout.write(chunk.decode(errors="replace"))
            if needle in seen:
                return seen
        else:
            time.sleep(0.05)
    raise TimeoutError(f"no {needle!r} from the board")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--port", help="serial port (default: first /dev/cu.usbmodem*)")
    parser.add_argument("--wait", type=float, default=60.0, help="seconds to wait in total")
    args = parser.parse_args()

    deadline = time.monotonic() + args.wait
    print("Press RESET on the Feather once (single press, not double).", file=sys.stderr)
    # The prompt only comes right after a reset. If the port is already there, the board is
    # running and has passed its window, so wait for the reset to drop the port first.
    stale = args.port or find_port()
    while stale is not None and os.path.exists(stale) and time.monotonic() < deadline:
        time.sleep(0.05)
    port = None
    while port is None or not os.path.exists(port):
        if time.monotonic() > deadline:
            print("error: no board port appeared; see runbook §3 (cable, port, accessory "
                  "prompt)", file=sys.stderr)
            return 1
        port = args.port or find_port()
        time.sleep(0.05)

    fd = open_raw(port)
    try:
        read_until(fd, PROMPT, deadline)
        read_until(fd, b"\n", deadline)
        epoch = int(time.time())
        os.write(fd, f"T{epoch}\n".encode())
        reply = read_until(fd, b"time: ", time.monotonic() + 5)
        reply += read_until(fd, b"\n", time.monotonic() + 2)
    except TimeoutError as exc:
        print(f"\nerror: {exc}. Was RESET pressed while this was waiting?", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"\nerror: lost the port ({exc}); press RESET once and run this again",
              file=sys.stderr)
        return 1
    finally:
        os.close(fd)

    if b"time: set to" not in reply:
        print("\nerror: the board did not accept the time", file=sys.stderr)
        return 1
    print(f"\nclock set to {epoch} ({time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(epoch))})",
          file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
