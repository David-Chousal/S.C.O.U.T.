"""SCOUT shore-station package: LoRa packet codec, sensor simulator, mock radio link,
schema-validated CSV store, and a receiver that ties them together.

Runs entirely without hardware today (via :class:`MockLoRaLink`); swap the link for an
``adafruit-rfm9x`` backend on the Raspberry Pi. See ``docs/engineering/shore-station.md``.
"""

from .link import LoRaLink
from .packet import PACKET_SIZE, PacketError, Reading, decode, encode
from .receiver import MockLoRaLink, Receiver, ReceiverStats
from .schema import COLUMNS, SchemaError, reading_to_row, validate_csv, validate_row
from .sd_import import ImportResult, import_card
from .simulator import generate_reading, generate_series
from .store import CsvStore

__all__ = [
    "LoRaLink",
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
    "ImportResult",
    "import_card",
]
