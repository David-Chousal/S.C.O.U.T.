"""The S3 shore firmware writes each serial line in one call (SCO-257, SCO-237).

Its network task prints from the other core. ``Serial.println`` writes the text and the line
ending separately, so a frame line could land between them and the computer bridge
(``serial_link.py``) would fail to parse it. This guard keeps ``println`` out of ``shore_rx``.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

SHORE_RX = Path(__file__).resolve().parents[2] / "firmware" / "src" / "shore_rx"


class SingleWriteLineTests(unittest.TestCase):
    def test_no_println_in_the_shore_firmware(self) -> None:
        offenders = [
            f"{path.name}:{number}"
            for path in sorted(SHORE_RX.glob("*.cpp"))
            for number, line in enumerate(path.read_text().splitlines(), start=1)
            if re.search(r"\bSerial\.println\s*\(", line)
        ]
        self.assertEqual(offenders, [], "use one Serial.print/printf per line, ending in \\n")


if __name__ == "__main__":
    unittest.main()
