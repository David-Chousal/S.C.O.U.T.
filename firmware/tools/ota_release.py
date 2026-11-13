#!/usr/bin/env python3
"""Sign buoy firmware for over-the-air updates (OTA design §5, SCO-197).

Runs on the release machine, the only place the Ed25519 signing key lives. The shore station
relays what this writes and never signs anything itself, so a compromised shore cannot install
firmware.

    # once: make the key pair. The private key stays on this machine (never in the repo, never
    # on the shore); the public header is what the buoy and the shore station are built with.
    python3 firmware/tools/ota_release.py keygen --key ~/scout-ota.key --header firmware/src/ota_pubkey.h

    # per release: build, then sign the .bin for one buoy (or --buoy 0 for any buoy)
    cd firmware && pio run -e feather_m0 && cd ..
    python3 firmware/tools/ota_release.py sign --key ~/scout-ota.key --buoy 1 \
        --bin firmware/.pio/build/feather_m0/firmware.bin --out scout-01-v0.2.0.scoutfw

The version signed into the manifest is read from FW_MAJOR/FW_MINOR/FW_PATCH in
firmware/src/config.h, the same constants the image reports in every packet, so the shore can
tell when the buoy runs it. Bump them before building a release: the buoy refuses any version
that is not higher than the one it runs.

Needs the ``cryptography`` package (pip install cryptography).
"""

from __future__ import annotations

import argparse
import os
import pathlib
import re
import sys
import time

_ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(_ROOT / "shore"))

from scout_shore import ota  # noqa: E402

CONFIG_H = _ROOT / "firmware" / "src" / "config.h"


def _ed25519():
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import ed25519
    except ImportError as exc:  # pragma: no cover - environment dependent
        raise SystemExit("ota_release.py needs the cryptography package: pip install cryptography") from exc
    return ed25519, serialization


def config_version(text: str) -> int:
    parts = []
    for name in ("FW_MAJOR", "FW_MINOR", "FW_PATCH"):
        match = re.search(rf"#define\s+{name}\s+(\d+)", text)
        if not match:
            raise SystemExit(f"{name} not found in config.h")
        parts.append(int(match.group(1)))
    return ota.version_number(*parts)


def image_from_bin(binary: bytes) -> bytes:
    """The application part of a firmware .bin: everything after the 24 KB boot stub."""
    if len(binary) <= ota.STUB_BYTES:
        raise SystemExit("the .bin holds no application after the boot stub; built without SCOUT_OTA?")
    return binary[ota.STUB_BYTES:]


def public_header(public_key: bytes) -> str:
    rows = ", ".join(f"0x{b:02x}" for b in public_key)
    return (
        "/* Ed25519 public key for over-the-air firmware (SCO-197), written by\n"
        " * firmware/tools/ota_release.py keygen. Public, but gitignored with the other keys so a\n"
        " * build cannot pick up someone else's by accident. The private key never leaves the\n"
        " * release machine. */\n"
        "#ifndef SCOUT_OTA_PUBKEY_H\n#define SCOUT_OTA_PUBKEY_H\n\n#include <stdint.h>\n\n"
        f"static const uint8_t SCOUT_OTA_PUBKEY[32] = {{{rows}}};\n\n#endif\n"
    )


def sign_bundle(private_key, image: bytes, *, buoy: int, version: int, build_time: int) -> ota.Bundle:
    manifest = ota.manifest_for(image, target_buoy=buoy, version=version, build_time=build_time)
    raw = manifest.encode()
    return ota.Bundle(raw, private_key.sign(raw), image)


def cmd_keygen(args: argparse.Namespace) -> None:
    ed25519, serialization = _ed25519()
    key_path = pathlib.Path(args.key).expanduser()
    if key_path.exists():
        raise SystemExit(f"{key_path} exists; refusing to overwrite a signing key")
    private = ed25519.Ed25519PrivateKey.generate()
    seed = private.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw,
                                 serialization.NoEncryption())
    fd = os.open(key_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as handle:
        handle.write(seed.hex() + "\n")
    public = private.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    pathlib.Path(args.header).write_text(public_header(public))
    print(f"private key: {key_path} (keep offline)\npublic header: {args.header}")


def load_private(path: str):
    ed25519, _ = _ed25519()
    seed = bytes.fromhex(pathlib.Path(path).expanduser().read_text().strip())
    return ed25519.Ed25519PrivateKey.from_private_bytes(seed)


def cmd_sign(args: argparse.Namespace) -> None:
    image = image_from_bin(pathlib.Path(args.bin).read_bytes())
    version = config_version(CONFIG_H.read_text())
    bundle = sign_bundle(load_private(args.key), image, buoy=args.buoy, version=version,
                         build_time=int(time.time()))
    pathlib.Path(args.out).write_bytes(bundle.encode())
    m = bundle.manifest
    print(f"{args.out}: {ota.version_text(m.version)} for buoy {m.target_buoy or 'any'}, "
          f"{m.image_len} bytes, {m.chunk_count} chunks, sha256 {m.sha256.hex()[:16]}…")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    keygen = sub.add_parser("keygen", help="make the signing key pair")
    keygen.add_argument("--key", required=True, help="where to write the private key (kept offline)")
    keygen.add_argument("--header", default=str(_ROOT / "firmware/src/ota_pubkey.h"))
    keygen.set_defaults(func=cmd_keygen)
    sign = sub.add_parser("sign", help="sign a built .bin into a .scoutfw bundle")
    sign.add_argument("--key", required=True)
    sign.add_argument("--bin", required=True)
    sign.add_argument("--buoy", type=int, required=True, help="target buoy ID, 0 = any")
    sign.add_argument("--out", required=True)
    sign.set_defaults(func=cmd_sign)
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
