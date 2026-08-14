#!/usr/bin/env python3
"""Enforce Standing rule 7: every PR touches the Knowledge Hub, or says why not.

Passes when either:
  * the PR diff touches ``docs/hub/**`` (some Hub surface was updated), OR
  * the PR body contains the explicit opt-out phrase ``Hub: no relevant surface``.

Reads the PR body from ``$PR_BODY`` and the list of changed paths from stdin (one per
line) or ``--changed-file``. Exit 0 = pass, 1 = fail.
"""
from __future__ import annotations

import argparse
import os
import re
import sys

HUB_PREFIX = "docs/hub/"
# Tolerant of backticks, quotes and surrounding punctuation: `Hub: no relevant surface`
OPT_OUT_RE = re.compile(r"hub:\s*no\s+relevant\s+surface", re.IGNORECASE)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--changed-file", help="file with changed paths, one per line")
    args = ap.parse_args()

    if args.changed_file:
        with open(args.changed_file, encoding="utf-8") as fh:
            changed = [ln.strip() for ln in fh if ln.strip()]
    else:
        changed = [ln.strip() for ln in sys.stdin.read().splitlines() if ln.strip()]

    body = os.environ.get("PR_BODY", "")

    touched_hub = [p for p in changed if p.startswith(HUB_PREFIX)]
    opted_out = bool(OPT_OUT_RE.search(body))

    if touched_hub:
        print("Knowledge Hub check: OK  (PR updates the Hub)")
        for p in touched_hub:
            print(f"    {p}")
        return 0
    if opted_out:
        print('Knowledge Hub check: OK  (body declares "Hub: no relevant surface")')
        return 0

    print("Knowledge Hub check: FAIL")
    print("  This PR touches nothing under docs/hub/** and the body does not declare")
    print('  "Hub: no relevant surface".')
    print()
    print("  Standing rule 7 — before opening a PR, update the surface(s) this PR affects:")
    print("    - Decided anything?           → docs/hub/decision-log.md (+ an ADR if significant)")
    print("    - Changed a canonical value?  → docs/hub/facts.md (first), then the docs")
    print("    - Moved a subsystem's state?  → docs/hub/status.md + a docs/hub/journal/ snapshot")
    print("    - Used/found an external src? → docs/hub/research/sources.md (PDF to library/)")
    print("    - Answered/raised a question? → docs/hub/research/open-questions.md")
    print()
    print('  If genuinely none apply, add "Hub: no relevant surface" to the Knowledge Hub')
    print("  section of the PR body.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
