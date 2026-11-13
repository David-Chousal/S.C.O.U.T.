"""Over-the-air firmware update frames and signed bundles (OTA design §3-§5, SCO-197).

THE WIRE FORMAT MUST MATCH ``firmware/lib/scout_ota`` byte-for-byte; golden vectors in
``firmware/test/test_ota`` and ``scripts/check_packet_contract.py`` hold them together. All
integers are little-endian, and every frame fits the 140-byte payload ceiling.

| Frame | Type | Direction | Layout | Size |
|---|---|---|---|---|
| OTA_OFFER | ``0xC2`` | shore → buoy | type, manifest (52), Ed25519 signature (64) | 117 B |
| OTA_CHUNK | ``0xC3`` | shore → buoy | type, session u16, index u16, len u8, flags u8, data, CRC-16 | ≤ 137 B |
| OTA_ACK | ``0xC4`` | buoy → shore | type, buoy u16, session u16, base u16, bitmap u16, status u8, CRC-16 | 12 B |
| OTA_CONFIRM | ``0xC5`` | shore → buoy | type, buoy u16, counter u32, version u32, HMAC tag (16), CRC-16 | 29 B |

The manifest is magic ``SCFW``, target buoy u16 (0 = any), chunk size u8 (128), flags u8 (0),
version u32 (``major << 16 | minor << 8 | patch``), image length u32, build time u32 and the
SHA-256 of the image. It is signed on the release machine (``firmware/tools/ota_release.py``);
the shore station only relays it and never holds the signing key.

A **bundle** (``.scoutfw``) is what the release tool writes and the shore pushes to the S3:
manifest (52) + signature (64) + image. The image is the application only, from flash address
0x8000; the 24 KB boot stub in front of it in the ``.bin`` is never sent over the air.

Standard library only: the Ed25519 signature is checked by the S3 and by the buoy, not here.
"""

from __future__ import annotations

import hashlib
import hmac
import struct
from dataclasses import dataclass

from .packet import crc16_ccitt

TYPE_OFFER = 0xC2
TYPE_CHUNK = 0xC3
TYPE_ACK = 0xC4
TYPE_CONFIRM = 0xC5

MAGIC = 0x57464353  # "SCFW"
MANIFEST_BYTES = 52
SIG_BYTES = 64
OFFER_SIZE = 1 + MANIFEST_BYTES + SIG_BYTES
CHUNK_BYTES = 128
CHUNK_HEADER = 7
CHUNK_LAST = 0x01
ACK_SIZE = 12
CONFIRM_SIZE = 29
WINDOW = 16
ALL_HELD = 0xFFFF
APP_START = 0x8000
STUB_BYTES = 0x6000  # the scout_boot stub at 0x2000 (24 KB), stripped from the .bin before signing
MAX_IMAGE = 0x40000 - APP_START

ACK_STATUS = {0: "progress", 1: "complete", 2: "hash_fail", 3: "refused"}

_MANIFEST = struct.Struct("<IHBBIII32s")
_CHUNK_HEAD = struct.Struct("<BHHBB")
_ACK = struct.Struct("<BHHHHB")
_CONFIRM_SIGNED = struct.Struct("<BHII")


class OtaError(ValueError):
    """A frame or bundle that is malformed or fails its checks."""


def version_number(major: int, minor: int, patch: int) -> int:
    for part in (major, minor, patch):
        if not 0 <= part <= 0xFF:
            raise OtaError(f"version part {part} out of range")
    return (major << 16) | (minor << 8) | patch


def version_text(number: int) -> str:
    return f"v{(number >> 16) & 0xFF}.{(number >> 8) & 0xFF}.{number & 0xFF}"


@dataclass(frozen=True)
class Manifest:
    target_buoy: int
    version: int
    image_len: int
    build_time: int
    sha256: bytes
    chunk_size: int = CHUNK_BYTES
    flags: int = 0

    def encode(self) -> bytes:
        return _MANIFEST.pack(MAGIC, self.target_buoy, self.chunk_size, self.flags, self.version,
                              self.image_len, self.build_time, self.sha256)

    @property
    def session(self) -> int:
        return self.sha256[0] | (self.sha256[1] << 8)

    @property
    def chunk_count(self) -> int:
        return (self.image_len + CHUNK_BYTES - 1) // CHUNK_BYTES


def manifest_for(image: bytes, *, target_buoy: int, version: int, build_time: int) -> Manifest:
    if not 0 < len(image) <= MAX_IMAGE:
        raise OtaError(f"image is {len(image)} bytes; must be 1-{MAX_IMAGE}")
    return Manifest(target_buoy, version, len(image), build_time, hashlib.sha256(image).digest())


def decode_manifest(raw: bytes) -> Manifest:
    if len(raw) != MANIFEST_BYTES:
        raise OtaError(f"manifest must be {MANIFEST_BYTES} bytes")
    magic, target, chunk, flags, version, length, built, digest = _MANIFEST.unpack(raw)
    if magic != MAGIC:
        raise OtaError("bad manifest magic")
    if chunk != CHUNK_BYTES or flags != 0 or not 0 < length <= MAX_IMAGE:
        raise OtaError("manifest geometry not accepted")
    return Manifest(target, version, length, built, digest, chunk, flags)


def encode_offer(manifest_raw: bytes, signature: bytes) -> bytes:
    if len(manifest_raw) != MANIFEST_BYTES or len(signature) != SIG_BYTES:
        raise OtaError("manifest or signature has the wrong length")
    return bytes([TYPE_OFFER]) + manifest_raw + signature


def chunk_data(image: bytes, index: int) -> bytes:
    return image[index * CHUNK_BYTES:(index + 1) * CHUNK_BYTES]


def encode_chunk(session: int, index: int, data: bytes, *, last: bool = False) -> bytes:
    if not 0 < len(data) <= CHUNK_BYTES:
        raise OtaError("chunk data must be 1-128 bytes")
    body = _CHUNK_HEAD.pack(TYPE_CHUNK, session, index, len(data), CHUNK_LAST if last else 0) + data
    return body + struct.pack("<H", crc16_ccitt(body))


@dataclass(frozen=True)
class Ack:
    buoy_id: int
    session: int
    base: int
    bitmap: int
    status: int


def encode_ack(ack: Ack) -> bytes:
    body = _ACK.pack(TYPE_ACK, ack.buoy_id, ack.session, ack.base, ack.bitmap, ack.status)
    return body + struct.pack("<H", crc16_ccitt(body))


def decode_ack(frame: bytes) -> Ack:
    if len(frame) != ACK_SIZE or frame[0] != TYPE_ACK:
        raise OtaError("not an OTA_ACK frame")
    if crc16_ccitt(frame[:-2]) != struct.unpack("<H", frame[-2:])[0]:
        raise OtaError("OTA_ACK CRC mismatch")
    _, buoy, session, base, bitmap, status = _ACK.unpack(frame[:-2])
    return Ack(buoy, session, base, bitmap, status)


def missing(base: int, bitmap: int, chunk_count: int) -> list[int]:
    """The chunk indices an ACK asks for, in order (mirrors scout_ota_missing)."""
    if base == ALL_HELD or base % WINDOW:
        return []
    return [base + i for i in range(WINDOW) if base + i < chunk_count and not (bitmap >> i) & 1]


def encode_confirm(buoy_id: int, counter: int, version: int, key: bytes) -> bytes:
    if len(key) != 32:
        raise OtaError("key must be 32 bytes")
    signed = _CONFIRM_SIGNED.pack(TYPE_CONFIRM, buoy_id, counter, version)
    body = signed + hmac.new(key, signed, hashlib.sha256).digest()[:16]
    return body + struct.pack("<H", crc16_ccitt(body))


@dataclass(frozen=True)
class Bundle:
    manifest_raw: bytes
    signature: bytes
    image: bytes

    @property
    def manifest(self) -> Manifest:
        return decode_manifest(self.manifest_raw)

    def encode(self) -> bytes:
        return self.manifest_raw + self.signature + self.image


def read_bundle(data: bytes) -> Bundle:
    """Split a ``.scoutfw`` file and check the image against the manifest's length and hash."""
    head = MANIFEST_BYTES + SIG_BYTES
    if len(data) <= head:
        raise OtaError("bundle too short")
    bundle = Bundle(data[:MANIFEST_BYTES], data[MANIFEST_BYTES:head], data[head:])
    manifest = bundle.manifest
    if manifest.image_len != len(bundle.image):
        raise OtaError(f"manifest says {manifest.image_len} bytes, bundle holds {len(bundle.image)}")
    if hashlib.sha256(bundle.image).digest() != manifest.sha256:
        raise OtaError("image does not match the manifest's SHA-256")
    return bundle


USB_DATA_BYTES = 64  # per FD line, so a line stays well inside the S3's line buffer


def usb_lines(bundle: Bundle, buoy_id: int) -> list[str]:
    """The USB lines that load a bundle into the S3 for one buoy (shore_ota.cpp parses them):
    ``FB<buoy>:<len>``, ``FD<offset>:<hex>`` per 64 bytes, then ``FM<hex manifest+signature>``,
    which makes the S3 check the hash and signature and arm the job."""
    if not 1 <= buoy_id <= 0xFFFF:
        raise OtaError("buoy_id must be 1-65535")
    target = bundle.manifest.target_buoy
    if target not in (0, buoy_id):
        raise OtaError(f"bundle is signed for buoy {target}, not {buoy_id}")
    lines = [f"FB{buoy_id}:{len(bundle.image)}"]
    for offset in range(0, len(bundle.image), USB_DATA_BYTES):
        lines.append(f"FD{offset}:{bundle.image[offset:offset + USB_DATA_BYTES].hex()}")
    lines.append(f"FM{(bundle.manifest_raw + bundle.signature).hex()}")
    return lines
