#!/usr/bin/env python3
"""Enforce the SCOUT PR title format: ``<type>(<scope>): <summary>``.

Faithful to docs/CONVENTIONS.md → "Commit messages" / "Pull requests". The scope is
optional (the repo uses scopeless titles like ``ci:`` and ``docs:``) and, when present,
must be a lowercase-hyphen token — a rigid scope allowlist would reject the repo's own
history (``feat(shore)``, ``docs(hub)``, ``ci(pages)`` …), so only the *type* is an
allowlist and the *scope* is format-checked. See the PR's Open questions.

Reads the title from ``$PR_TITLE`` (set by the workflow to the PR title) or ``--title``.
Exit 0 = pass, 1 = fail.
"""
from __future__ import annotations

import argparse
import os
import re
import sys

# Documented types (CONVENTIONS.md "Commit messages": feat fix docs refactor test chore)
# plus `ci`, which main already uses (`ci: add test workflow`, `ci(pages): …`) and which
# this very PR needs. Kept deliberately small — see the PR's Open questions if you want to
# drop `ci` back out.
ALLOWED_TYPES = ("feat", "fix", "docs", "refactor", "test", "chore", "ci")

# <type>[(<scope>)][!]: <summary>
#   scope, if present, is a lowercase-hyphen token
#   `!` optionally marks a breaking change (conventional-commits)
TITLE_RE = re.compile(
    r"^(?P<type>" + "|".join(ALLOWED_TYPES) + r")"
    r"(?:\((?P<scope>[a-z0-9]+(?:-[a-z0-9]+)*)\))?"
    r"!?: (?P<summary>\S.*)$"
)


def check(title: str) -> list[str]:
    errors: list[str] = []
    title = title.rstrip("\n")
    if not title.strip():
        return ["PR title is empty."]
    if title != title.strip():
        errors.append("PR title has leading or trailing whitespace.")
    m = TITLE_RE.match(title.strip())
    if not m:
        errors.append(
            "PR title does not match `<type>(<scope>): <summary>`.\n"
            f"  Allowed types: {', '.join(ALLOWED_TYPES)}\n"
            "  Scope is optional; when present it must be lowercase-hyphen.\n"
            "  There must be a single space after the colon and a non-empty summary."
        )
    return errors


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", default=os.environ.get("PR_TITLE", ""))
    args = ap.parse_args()

    errors = check(args.title)
    if errors:
        print("PR title check: FAIL")
        print(f"  Title: {args.title!r}")
        for e in errors:
            print("  - " + e.replace("\n", "\n    "))
        print("\n  Examples that pass:")
        print("    ci(scope): add PR governance checks")
        print("    docs: resolve ADR-0001")
        print("    feat(analytics): add turbidity QC gate")
        return 1
    print(f"PR title check: OK  ({args.title!r})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
