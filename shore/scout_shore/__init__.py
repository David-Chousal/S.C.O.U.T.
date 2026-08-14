"""SCOUT shore-station package: LoRa packet codec, sensor simulator, mock radio link,
schema-validated CSV store, and a receiver that ties them together.

Runs entirely without hardware today (via :class:`MockLoRaLink`); swap the link for an
``adafruit-rfm9x`` backend on the Raspberry Pi. See ``docs/engineering/shore-station.md``.
"""

from .packet import PACKET_SIZE, PacketError, Reading, decode, encode
from .receiver import MockLoRaLink, Receiver, ReceiverStats
from .schema import COLUMNS, SchemaError, reading_to_row, validate_csv, validate_row
from .simulator import generate_reading, generate_series
from .store import CsvStore

__all__ = [
    "PACKET_SIZE",
    "PacketError",
    "Reading",
    "encode",
    "decode",
    "MockLoRaLink",
    "Receiver",
    "ReceiverStats",
    "COLUMNS",
    "SchemaError",
    "reading_to_row",
    "validate_row",
    "validate_csv",
    "generate_reading",
    "generate_series",
    "CsvStore",
]
