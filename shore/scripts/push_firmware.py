#!/usr/bin/env python3
"""Load a signed firmware bundle into the shore station for one buoy (SCO-197).

The bundle comes from ``firmware/tools/ota_release.py sign`` on the release machine. This
script checks it (length and SHA-256 against the manifest) and writes it to the ESP32-S3 over
USB as ``FB``/``FD``/``FM`` lines (``scout_shore.ota.usb_lines``). The S3 checks the hash and the
Ed25519 signature itself, prints ``ota: ready ...``, and offers the image after the buoy's next
packet. Nothing is sent to the buoy from here.

    python3 shore/scripts/push_firmware.py --serial /dev/serial/by-id/usb-... \\
        --bundle scout-01-v0.2.0.scoutfw --buoy 1

The receiver service can keep running: it only reads the port, and the S3's ``ota:`` replies
then appear in its journal (``journalctl -u scout-shore``). With the service stopped, this
script reads the replies itself. ``--dry-run`` prints the lines instead of writing them.

Standard library only.
"""

from __future__ import annotations

import argparse
import os
import pathlib
import sys
import termios
import time
import tty

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from scout_shore import ota  # noqa: E402
from scout_shore.serial_link import write_all  # noqa: E402

LINE_GAP_S = 0.01  # the S3 reads USB between radio polls; a short gap keeps its buffer from filling
REPLY_WAIT_S = 5.0


def write_lines(fd: int, lines: list[str]) -> None:
    for line in lines:
        write_all(fd, (line + "\n").encode("ascii"))  # a busy S3 must not drop or truncate a line
        time.sleep(LINE_GAP_S)


def read_replies(fd: int, seconds: float) -> list[str]:
    """The S3's ``ota:`` lines that arrive within `seconds` (none if another reader has them)."""
    deadline, buffer, replies = time.monotonic() + seconds, b"", []
    while time.monotonic() < deadline:
        try:
            buffer += os.read(fd, 4096)
        except BlockingIOError:
            time.sleep(0.05)
            continue
        *complete, buffer = buffer.split(b"\n")
        replies += [raw.decode(errors="replace").strip() for raw in complete if raw.startswith(b"ota:")]
        if any("ready" in r or "error" in r for r in replies):
            break
    return replies


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bundle", required=True, help=".scoutfw file from ota_release.py")
    parser.add_argument("--buoy", type=int, required=True)
    parser.add_argument("--serial", help="the S3's USB serial port")
    parser.add_argument("--dry-run", action="store_true", help="print the lines instead of writing them")
    args = parser.parse_args(argv)

    try:
        bundle = ota.read_bundle(pathlib.Path(args.bundle).read_bytes())
        lines = ota.usb_lines(bundle, args.buoy)
    except (OSError, ota.OtaError) as exc:
        print(f"push_firmware: {exc}", file=sys.stderr)
        return 1
    m = bundle.manifest
    print(f"{ota.version_text(m.version)} for buoy {args.buoy}: {m.image_len} bytes, "
          f"{m.chunk_count} chunks, {len(lines)} USB lines")
    if args.dry_run:
        print("\n".join(lines))
        return 0
    if not args.serial:
        print("push_firmware: --serial is required unless --dry-run", file=sys.stderr)
        return 1
    try:
        fd = os.open(args.serial, os.O_RDWR | os.O_NONBLOCK | os.O_NOCTTY)
        try:
            if os.isatty(fd):
                # With echo on, the S3's own output would come back to it as commands. TCSANOW
                # keeps RX bytes the receiver service already queued (TCSAFLUSH would drop them).
                tty.setraw(fd, when=termios.TCSANOW)
            write_lines(fd, lines)
            replies = read_replies(fd, REPLY_WAIT_S)
        finally:
            os.close(fd)
    except OSError as exc:
        print(f"push_firmware: {args.serial}: {exc}", file=sys.stderr)
        return 1
    for reply in replies:
        print(reply)
    if not replies:
        print("no reply read: if the receiver service is running, check its journal for 'ota: ready'")
    return 1 if any("error" in r for r in replies) else 0


if __name__ == "__main__":
    sys.exit(main())
