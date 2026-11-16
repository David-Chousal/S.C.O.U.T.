"""The v3 time frame (SCO-315): the shore's signed clock, sent after a buoy's packet so the buoy
can correct its own clock. Mirrors scout_dl_encode_time in firmware/lib/scout_downlink."""

import unittest

from scout_shore import downlink

KEY = bytes(range(32))
NOW = 1803859200  # 2027-03-01 00:00:00Z


class TimeFrameTest(unittest.TestCase):
    def test_frame_is_26_bytes_and_starts_like_every_command(self):
        frame = downlink.encode_time(downlink.TimeCommand(1, NOW), KEY)
        self.assertEqual(len(frame), downlink.TIME_SIZE)
        self.assertEqual(downlink.TIME_SIZE, 26)
        self.assertEqual(frame[:2], bytes([downlink.TYPE_CMD, downlink.VERSION_TIME]))

    def test_round_trips(self):
        frame = downlink.encode_time(downlink.TimeCommand(2, NOW + 5), KEY)
        self.assertEqual(downlink.decode_time(frame, KEY), downlink.TimeCommand(2, NOW + 5))

    def test_rejects_a_tampered_counter(self):
        frame = bytearray(downlink.encode_time(downlink.TimeCommand(1, NOW), KEY))
        frame[4] ^= 0x01
        with self.assertRaises(downlink.DownlinkError):
            downlink.decode_time(bytes(frame), KEY)

    def test_rejects_the_wrong_key(self):
        frame = downlink.encode_time(downlink.TimeCommand(1, NOW), KEY)
        with self.assertRaises(downlink.DownlinkError):
            downlink.decode_time(frame, bytes(32))

    def test_its_length_differs_from_every_other_downlink(self):
        self.assertNotIn(downlink.TIME_SIZE, (downlink.CMD_SIZE, downlink.SETTINGS_SIZE))

    def test_rejects_an_out_of_range_counter(self):
        with self.assertRaises(downlink.DownlinkError):
            downlink.TimeCommand(1, 0)


if __name__ == "__main__":
    unittest.main()
