#!/usr/bin/env python3
"""Enforce the five required PR-body sections, in order.

Faithful to docs/CONVENTIONS.md → "Pull requests" and CLAUDE.md → "Standing rule 7":
every PR body must contain, in this order:

    ## DATE
    ## What Changed and Why
    ## Open questions
    ## Open tasks
    ## Knowledge Hub

Headings are matched case-insensitively at any heading level (``#``–``######``) so a
stray ``###`` or casing slip is not a hard failure; the *presence* and *order* are what
matter. Reads the body from ``$PR_BODY`` (set by the workflow) or ``--body-file``.
Exit 0 = pass, 1 = fail.
"""
from __future__ import annotations

import argparse
import os
import re
import sys

REQUIRED = [
    "DATE",
    "What Changed and Why",
    "Open questions",
    "Open tasks",
    "Knowledge Hub",
]


def heading_positions(body: str) -> dict[str, int]:
    """Map each required section (lowercased) to the line index of its heading, first hit."""
    found: dict[str, int] = {}
    in_fence = False
    for i, line in enumerate(body.splitlines()):
        if re.match(r"^\s*```", line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        m = re.match(r"^\s{0,3}#{1,6}\s+(.*?)\s*$", line)
        if not m:
            continue
        title = m.group(1).strip().lower()
        for name in REQUIRED:
            key = name.lower()
            if title == key and key not in found:
                found[key] = i
    return found


def check(body: str) -> list[str]:
    errors: list[str] = []
    if not body or not body.strip():
        return ["PR body is empty. Use the template (all five sections)."]

    found = heading_positions(body)
    missing = [n for n in REQUIRED if n.lower() not in found]
    if missing:
        errors.append("Missing required section(s): " + ", ".join(f"## {m}" for m in missing))

    present = [n for n in REQUIRED if n.lower() in found]
    if len(present) >= 2:
        order = [found[n.lower()] for n in present]
        if order != sorted(order):
            errors.append(
                "Sections are out of order. Required order: "
                + " → ".join(f"## {n}" for n in REQUIRED)
            )
    return errors


TEMPLATE = """\
  Copy this template:

  ## DATE
  YYYY-MM-DD

  ## What Changed and Why
  - …

  ## Open questions
  - …

  ## Open tasks
  - …

  ## Knowledge Hub
  - Updated: decision-log.md · facts.md · status.md + journal · research/sources.md
    (list only what this PR touched, or write "Hub: no relevant surface")
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--body-file")
    args = ap.parse_args()

    if args.body_file:
        with open(args.body_file, encoding="utf-8") as fh:
            body = fh.read()
    else:
        body = os.environ.get("PR_BODY", "")

    errors = check(body)
    if errors:
        print("PR body check: FAIL")
        for e in errors:
            print("  - " + e)
        print()
        print(TEMPLATE)
        return 1
    print("PR body check: OK  (all five sections present, in order)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
