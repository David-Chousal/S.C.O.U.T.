#!/usr/bin/env python3
"""Does the analytics dependency set install on a Raspberry Pi?

The bioacoustic pipeline pins numpy, scipy, pandas and scikit-maad. Nobody had checked whether
those pinned versions ship wheels for the Pi's architecture — and the answer is not academic:
without a wheel, ``pip install`` falls back to building from source, which for scipy means a
Fortran toolchain and a multi-hour compile that routinely dies on a Pi's RAM. Discovering that
during Hawaii deployment prep is the wrong time.

Two architectures matter, and they are not the same answer:

- **aarch64** — Raspberry Pi OS **64-bit**. Well served by manylinux wheels.
- **armv7l** — Raspberry Pi OS **32-bit**, still the default on some imagers. Very thinly
  served; most scientific packages ship nothing and must be built.

This queries the PyPI JSON API, so it reports what is actually published rather than what we
assume. It needs network access and is therefore *not* wired into CI — run it when the pins
change or before provisioning a Pi.

    python3 scripts/check_arm_wheels.py
    python3 scripts/check_arm_wheels.py --requirements analytics/requirements.txt
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

PYPI = "https://pypi.org/pypi/{name}/{version}/json"

# Substrings that identify a wheel usable on each Pi architecture. A pure-Python wheel
# ("py3-none-any") works everywhere, which is why it counts for both.
ARCH_TAGS = {
    "aarch64 (Pi OS 64-bit)": ("aarch64",),
    "armv7l (Pi OS 32-bit)": ("armv7l", "armv6l"),
}
PURE_PYTHON = "-py3-none-any.whl"

_PIN = re.compile(r"^\s*([A-Za-z0-9_.\-]+)\s*==\s*([A-Za-z0-9_.\-]+)\s*$")

# Compiled packages pip installs that requirements.txt does not pin, so they would otherwise be
# missed — and a source build hurts just as much whether or not we named the package. Chiefly
# scikit-maad's own dependencies (scikit-image, pywavelets) plus matplotlib's compiled stack.
# Checked at whatever version PyPI currently resolves to, since nothing here pins them.
TRANSITIVE_COMPILED = (
    "scikit-image",
    "pywavelets",
    "contourpy",
    "kiwisolver",
    "pillow",
    "fonttools",
)


def parse_requirements(path: Path) -> list[tuple[str, str]]:
    """Pinned ``name==version`` lines only; comments and unpinned entries are skipped."""
    pins = []
    for line in path.read_text().splitlines():
        line = line.split("#", 1)[0]
        match = _PIN.match(line)
        if match:
            pins.append((match.group(1), match.group(2)))
    return pins


def wheels_for(name: str, version: str | None) -> list[str]:
    """Wheel filenames published for this release, or for the latest if ``version`` is None."""
    url = (
        f"https://pypi.org/pypi/{name}/json" if version is None
        else PYPI.format(name=name, version=version)
    )
    with urllib.request.urlopen(url, timeout=30) as response:  # noqa: S310 - fixed https host
        data = json.load(response)
    return [f["filename"] for f in data.get("urls", []) if f["filename"].endswith(".whl")]


def classify(filenames: list[str]) -> dict[str, str]:
    """Per-architecture verdict for one package's published wheels."""
    if any(f.endswith(PURE_PYTHON) for f in filenames):
        return {arch: "pure-python" for arch in ARCH_TAGS}
    out = {}
    for arch, tags in ARCH_TAGS.items():
        hit = any(tag in f for f in filenames for tag in tags)
        out[arch] = "wheel" if hit else "SOURCE BUILD"
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--requirements", type=Path, default=Path("analytics/requirements.txt"))
    args = parser.parse_args()

    pins = parse_requirements(args.requirements)
    if not pins:
        print(f"No pinned requirements found in {args.requirements}", file=sys.stderr)
        return 2
    named = {name for name, _ in pins}
    pins += [(name, None) for name in TRANSITIVE_COMPILED if name not in named]

    print(f"Checking {len(pins)} packages ({args.requirements} pins, plus unpinned compiled "
          f"transitive deps at latest) against PyPI\n")
    header = f"{'package':22} {'version':10} " + " ".join(f"{a:24}" for a in ARCH_TAGS)
    print(header)
    print("-" * len(header))

    source_builds: dict[str, list[str]] = {arch: [] for arch in ARCH_TAGS}
    failed = []
    for name, version in pins:
        try:
            verdicts = classify(wheels_for(name, version))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
            print(f"{name:22} {version or '(latest)':10} lookup failed: {exc}")
            failed.append(name)
            continue
        shown = version or "(latest)"
        row = f"{name:22} {shown:10} " + " ".join(f"{verdicts[a]:24}" for a in ARCH_TAGS)
        print(row)
        for arch, verdict in verdicts.items():
            if verdict == "SOURCE BUILD":
                source_builds[arch].append(f"{name}=={version}" if version else name)

    print()
    for arch, packages in source_builds.items():
        if packages:
            print(f"⚠️  {arch}: no wheel for {len(packages)} package(s) — pip will build from "
                  f"source:\n     {', '.join(packages)}")
        else:
            print(f"✅ {arch}: every pinned package has an installable wheel.")

    if failed:
        print(f"\n{len(failed)} lookup(s) failed (network?): {', '.join(failed)}")
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
