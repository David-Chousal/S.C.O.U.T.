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


COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
LIST_MARKER_RE = re.compile(r"^\s*(?:[-*+]|\d+\.)\s*")


def section_bodies(body: str, found: dict[str, int]) -> dict[str, str]:
    """Return each present section's text (keyed by lowercase name), from just after its
    heading to the next section heading (or end of body)."""
    lines = body.splitlines()
    ordered = sorted((idx, key) for key, idx in found.items())
    out: dict[str, str] = {}
    for i, (idx, key) in enumerate(ordered):
        end = ordered[i + 1][0] if i + 1 < len(ordered) else len(lines)
        out[key] = "\n".join(lines[idx + 1 : end])
    return out


def is_placeholder(section_text: str) -> bool:
    """A section counts as unfilled if, after stripping HTML comments and bare list
    markers, no real text remains — so a lone ``-`` or only the template's comment hint
    fails, while ``- None`` or ``Hub: no relevant surface`` passes."""
    text = COMMENT_RE.sub("", section_text)
    for line in text.splitlines():
        stripped = LIST_MARKER_RE.sub("", line).strip()
        if stripped:
            return False
    return True


def check(body: str) -> list[str]:
    errors: list[str] = []
    if not body or not body.strip():
        return ["PR body is empty. Use the template (all five sections)."]

    found = heading_positions(body)
    missing = [n for n in REQUIRED if n.lower() not in found]
    if missing:
        msg = "Missing required section(s): " + ", ".join(f"## {m}" for m in missing)
        # Common mistake: the section names are present as bold or plain text rather than as
        # Markdown headings (`## DATE`). Detect that and point at the real fix.
        lowered = body.lower()
        if any(re.search(r"\*\*\s*" + re.escape(m.lower()), lowered) for m in missing) or any(
            re.search(r"^\s*\**\s*" + re.escape(m.lower()) + r"\b", lowered, re.MULTILINE)
            for m in missing
        ):
            msg += (
                ".\n  Each section must be a Markdown heading — a line starting with '## ' "
                "(e.g. '## DATE') — not bold '**DATE**' or plain text."
            )
        errors.append(msg)

    present = [n for n in REQUIRED if n.lower() in found]
    if len(present) >= 2:
        order = [found[n.lower()] for n in present]
        if order != sorted(order):
            errors.append(
                "Sections are out of order. Required order: "
                + " → ".join(f"## {n}" for n in REQUIRED)
            )

    bodies = section_bodies(body, found)
    empty = [n for n in present if is_placeholder(bodies.get(n.lower(), ""))]
    if empty:
        errors.append(
            "Section(s) present but not filled in (a lone '-' or the template comment does "
            "not count — write the actual content): "
            + ", ".join(f"## {e}" for e in empty)
            + '.\n  For "Open questions"/"Open tasks" write "None" if there genuinely are none; '
            'for "Knowledge Hub" write "Hub: no relevant surface" if none apply.'
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
