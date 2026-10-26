"""Daily transmit count on the shore (SCO-198): packet v4, the slot rule, the downlink frame,
the receiver's slot-window check and the console client."""

from __future__ import annotations

import io
import json
import re
import unittest
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path

from scout_shore import CsvStore, MockLoRaLink, Receiver, decode, encode, reading_to_row
from scout_shore import downlink, tx_schedule
from scout_shore.console import ConsoleClient, ConsoleConfig, ConsoleError, set_commands
from scout_shore.packet import Reading
from scout_shore.schema import SchemaError, validate_row

_CONFIG_H = Path(__file__).resolve().parents[2] / "firmware" / "src" / "config.h"
# The v3 golden this firmware test held before v4: same reading, no count.
_V3_GOLDEN = bytes.fromhex(
    "03010000b5846b2a000000540a0202d00c50270100090005010001007cf042f4d4fb1dfcf7260a0018007856")
_KEY = bytes(range(32))


def _reading(**overrides) -> Reading:
    base = Reading(buoy_id=1, timestamp=datetime(2027, 3, 1, 0, 0, tzinfo=timezone.utc),
                   record_seq=42, temp_c=26.44, turbidity_adc=514, battery_v=3.28, uptime_s=75600)
    return replace(base, **overrides)


def _at(hh: int, mm: int, ss: int = 0) -> datetime:
    return datetime(2027, 3, 1, hh, mm, ss, tzinfo=timezone.utc)


class PacketV4(unittest.TestCase):
    def test_count_round_trips_through_flags_bits_8_and_9(self):
        for n in (1, 2, 3):
            self.assertEqual(decode(encode(_reading(tx_count=n))).tx_count, n)

    def test_a_v3_frame_reports_no_count(self):
        got = decode(_V3_GOLDEN)
        self.assertEqual((got.schema_version, got.tx_count), (3, None))

    def test_count_bits_do_not_leak_into_flag_names(self):
        got = decode(encode(_reading(tx_count=3, flags=frozenset({"SD_RETRY"}))))
        self.assertEqual(got.flags, frozenset({"SD_RETRY"}))

    def test_cmd_rejected_is_a_flag(self):
        got = decode(encode(_reading(tx_count=2, flags=frozenset({"CMD_REJECTED"}))))
        self.assertIn("CMD_REJECTED", got.flags)

    def test_out_of_range_count_is_refused(self):
        with self.assertRaises(ValueError):
            _reading(tx_count=4)

    def test_csv_carries_the_count_or_blank(self):
        self.assertEqual(reading_to_row(_reading(tx_count=2))["tx_count"], "2")
        self.assertEqual(reading_to_row(_reading())["tx_count"], "")

    def test_csv_rejects_a_bad_count(self):
        row = reading_to_row(_reading(tx_count=2))
        row["tx_count"] = "5"
        with self.assertRaises(SchemaError):
            validate_row(row)


class SlotRule(unittest.TestCase):
    def test_slot_table_matches_config_h(self):
        match = re.search(r"TX_SLOTS_SOD\[\]\s*=\s*\{([^}]*)\}", _CONFIG_H.read_text())
        self.assertEqual(tuple(int(v) for v in match.group(1).split(",")), tx_schedule.TX_SLOTS_SOD)

    def test_agreed_rule(self):
        self.assertEqual(tx_schedule.slots_for(1), (600,))
        self.assertEqual(tx_schedule.slots_for(2), (600, 58200))
        self.assertEqual(tx_schedule.slots_for(3), (600, 29400, 58200))

    def test_rejects_counts_outside_one_to_three(self):
        for bad in (0, 4):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                tx_schedule.slots_for(bad)

    def test_window_follows_the_count(self):
        self.assertTrue(tx_schedule.in_listen_window(_at(8, 11), 3))
        self.assertFalse(tx_schedule.in_listen_window(_at(8, 11), 2))
        self.assertTrue(tx_schedule.in_listen_window(_at(16, 12), 2))
        self.assertFalse(tx_schedule.in_listen_window(_at(16, 12, 1), 2))

    def test_tag_prefers_the_reported_count(self):
        # Asked for 1, still on 3: an 08:10 frame is in the slots the buoy actually uses.
        self.assertEqual(tx_schedule.tag(_reading(tx_count=3), _at(8, 10), 1), "in")
        self.assertEqual(tx_schedule.tag(_reading(), _at(8, 10), 1), "out")
        self.assertEqual(tx_schedule.tag(_reading(), _at(8, 10), None), "in")  # default 3


class CountStatus(unittest.TestCase):
    def test_states(self):
        S = tx_schedule.CountStatus
        self.assertEqual(S(2, 2).state, "confirmed")
        self.assertEqual(S(2, 3).state, "pending")
        self.assertEqual(S(2, 3, rejected=True).state, "rejected")
        self.assertEqual(S(2, None).state, "unreported")
        self.assertEqual(S(None, 3).state, "default")
        self.assertEqual(S(None, None).state, "default")

    def test_a_command_is_needed_only_while_they_differ(self):
        self.assertTrue(tx_schedule.CountStatus(1, 3).needs_command)
        self.assertFalse(tx_schedule.CountStatus(1, 1).needs_command)
        self.assertFalse(tx_schedule.CountStatus(None, 3).needs_command)


class DownlinkFrame(unittest.TestCase):
    def test_golden_matches_the_firmware(self):
        frame = downlink.encode(downlink.set_tx_count(1, 2, now_epoch=1803859200), _KEY)
        self.assertEqual(frame.hex(), "c101010000b5846b01022a0cc2c6d73d095d5f2f3f929f9ee0293840")

    def test_round_trip(self):
        cmd = downlink.set_tx_count(2, 1, now_epoch=1803859300)
        self.assertEqual(downlink.decode(downlink.encode(cmd, _KEY), _KEY), cmd)

    def test_another_key_fails_the_tag(self):
        frame = downlink.encode(downlink.set_tx_count(1, 2, now_epoch=1803859200), _KEY)
        with self.assertRaises(downlink.DownlinkError):
            downlink.decode(frame, bytes(32))

    def test_a_flipped_bit_fails_the_crc(self):
        frame = bytearray(downlink.encode(downlink.set_tx_count(1, 2, now_epoch=1803859200), _KEY))
        frame[9] ^= 1
        with self.assertRaisesRegex(downlink.DownlinkError, "CRC"):
            downlink.decode(bytes(frame), _KEY)

    def test_refuses_to_build_an_out_of_range_command(self):
        with self.assertRaises(downlink.DownlinkError):
            downlink.set_tx_count(1, 4, now_epoch=1803859200)

    def test_key_comes_from_the_environment_as_hex(self):
        env = {"SCOUT_CMD_KEY_1": _KEY.hex()}
        self.assertEqual(downlink.key_from_env(1, env), _KEY)
        self.assertIsNone(downlink.key_from_env(2, env))
        with self.assertRaises(downlink.DownlinkError):
            downlink.key_from_env(1, {"SCOUT_CMD_KEY_1": "abcd"})


class ReceiverWindow(unittest.TestCase):
    def test_counts_frames_outside_the_buoys_slots(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            link = MockLoRaLink()
            receiver = Receiver(link, CsvStore(tmp), clock=lambda: _at(8, 10), requested={1: 1})
            link.transmit(encode(_reading(record_seq=1)))             # no count, asked 1 → out
            link.transmit(encode(_reading(record_seq=2, tx_count=3)))  # reports 3 → in
            receiver.poll_once()
            receiver.poll_once()
            self.assertEqual((receiver.stats.stored, receiver.stats.out_of_window), (2, 1))


class _FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class Console(unittest.TestCase):
    def _client(self, replies: list[dict], seen: list):
        def opener(request, timeout):
            seen.append(request)
            return _FakeResponse(json.dumps(replies.pop(0)).encode())
        return ConsoleClient(ConsoleConfig("https://console.example", "tok"), opener=opener)

    def test_requested_counts_skip_bad_values(self):
        seen: list = []
        client = self._client([{"ok": True, "buoys": [
            {"buoy_id": 1, "tx_count_requested": 2},
            {"buoy_id": 2, "tx_count_requested": 9},
            {"buoy_id": 3, "tx_count_requested": None}]}], seen)
        self.assertEqual(client.requested_counts(), {1: 2})
        self.assertEqual(seen[0].get_header("Authorization"), "Bearer tok")

    def test_push_sends_rows_in_chunks(self):
        seen: list = []
        client = self._client([{"ok": True, "stored": 200}, {"ok": True, "stored": 5}], seen)
        rows = [reading_to_row(_reading(record_seq=i)) for i in range(205)]
        self.assertEqual(client.push_rows(rows), 205)
        self.assertEqual(len(seen), 2)

    def test_an_error_reply_raises(self):
        client = self._client([{"ok": False, "error": "unauthorized"}], [])
        with self.assertRaises(ConsoleError):
            client.requested_counts()

    def test_plain_http_is_refused_except_localhost(self):
        with self.assertRaises(ConsoleError):
            ConsoleConfig.from_env({"SCOUT_CONSOLE_URL": "http://x.example", "SCOUT_CONSOLE_TOKEN": "t"})
        self.assertIsNotNone(ConsoleConfig.from_env(
            {"SCOUT_CONSOLE_URL": "http://localhost:8787", "SCOUT_CONSOLE_TOKEN": "t"}))

    def test_set_commands_format(self):
        self.assertEqual(set_commands({2: 3, 1: 1}), ["N1:1", "N2:3"])


if __name__ == "__main__":
    unittest.main()
