#!/usr/bin/env python3
"""Hard blocker: website / deploy-relevant changes must always target `main`.

GitHub Pages builds and deploys the site **only from `main`** — `.github/workflows/pages.yml`
triggers on push to `main` (and an hourly schedule on `main`). A pull request that changes
deploy-relevant files but targets any other base branch would merge somewhere that never
deploys, so the change silently never goes live. That is exactly what stranded the site
redesign on an integration branch instead of shipping it.

This check fails a PR whose diff touches any deploy-watched path while its base branch is not
`main`. The fix the author sees is simple: retarget the PR's base to `main`.

The watched paths are kept in lockstep with ``pages.yml``'s ``on.push.paths``.
"""

from __future__ import annotations

import argparse
import sys

# Keep in sync with .github/workflows/pages.yml -> on.push.paths
DEPLOY_PREFIXES = ("analytics/", "shore/")
DEPLOY_EXACT = (".github/workflows/pages.yml",)


def is_deploy_relevant(path: str) -> bool:
    return path in DEPLOY_EXACT or path.startswith(DEPLOY_PREFIXES)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-ref", required=True, help="PR base branch name")
    ap.add_argument("--changed-file", required=True, help="file listing changed paths, one per line")
    args = ap.parse_args()

    with open(args.changed_file, encoding="utf-8") as fh:
        changed = [line.strip() for line in fh if line.strip()]
    relevant = [p for p in changed if is_deploy_relevant(p)]

    if not relevant:
        print("No deploy-relevant files changed — base branch is unrestricted for this PR.")
        return 0
    if args.base_ref == "main":
        print(f"{len(relevant)} deploy-relevant file(s) changed and the base is `main`. OK.")
        return 0

    print("::error::Website/deploy changes must target `main`.")
    print()
    print(f"This PR changes {len(relevant)} file(s) that the GitHub Pages deploy watches, but its")
    print(f"base branch is `{args.base_ref}`, not `main`. Pages builds and deploys ONLY from `main`")
    print("(see .github/workflows/pages.yml), so merging here would never reach the live site.")
    print()
    print("Fix: change this PR's base branch to `main` (GitHub PR page → 'Edit' → base).")
    print()
    print("Deploy-relevant files changed:")
    for p in relevant[:50]:
        print(f"  - {p}")
    if len(relevant) > 50:
        print(f"  … and {len(relevant) - 50} more")
    return 1


if __name__ == "__main__":
    sys.exit(main())
