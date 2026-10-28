"""The shore station's C row builder is held to reading_to_row by generated vectors (SCO-237).

``firmware/test/test_console/row_vectors.h`` is what the firmware's native tests check the S3's
rows against. If this fails, regenerate it: ``python -m scout_shore.row_vectors --write``.
"""

from __future__ import annotations

import unittest

from scout_shore import row_vectors
from scout_shore.packet import decode


class RowVectorTests(unittest.TestCase):
    def test_the_committed_header_is_current(self) -> None:
        self.assertEqual(row_vectors.HEADER.read_text(), row_vectors.render())

    def test_every_vector_packet_decodes(self) -> None:
        for name, packet in row_vectors.packets():
            with self.subTest(name):
                decode(packet)

    def test_the_rounding_cases_are_the_ones_named(self) -> None:
        rows = dict(row_vectors.packets())
        self.assertIn('"battery_v":"3.12"', row_vectors._row_json(rows["battery_exact_tie_rounds_even"]))
        self.assertIn('"battery_v":"3.60"', row_vectors._row_json(rows["battery_just_below_tie"]))
        self.assertIn('"temp_c":"-0.01"', row_vectors._row_json(rows["small_negative_temp"]))


if __name__ == "__main__":
    unittest.main()
