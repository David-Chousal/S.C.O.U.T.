#!/usr/bin/env python3
"""Archive every Done and Canceled issue in the S.C.O.U.T. Linear team.

The workspace is on Linear's free plan, which caps the number of issues that are not archived.
Linear's own auto-archive waits at least a month after a project completes, so closed issues are
archived as soon as they close instead (decision log 2026-10-30). Archived issues stay searchable
and can be restored; nothing is deleted.

Needs a Linear personal API key in ``$LINEAR_API_KEY`` (Linear → Settings → Security & access →
Personal API keys). Run daily by ``.github/workflows/linear-archive.yml``; by hand:

    LINEAR_API_KEY=lin_api_... python3 scripts/archive_linear_issues.py --dry-run
    LINEAR_API_KEY=lin_api_... python3 scripts/archive_linear_issues.py
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from typing import Callable

API_URL = "https://api.linear.app/graphql"
TEAM_KEY = "SCO"
CLOSED_STATES = ("Done", "Canceled")

ISSUES_QUERY = """query($after: String, $team: String!, $states: [String!]!) {
  issues(first: 100, after: $after,
         filter: { team: { key: { eq: $team } }, state: { name: { in: $states } } }) {
    nodes { id identifier state { name } }
    pageInfo { hasNextPage endCursor }
  }
}"""

ARCHIVE_MUTATION = "mutation($id: String!) { issueArchive(id: $id) { success } }"

Post = Callable[[str, dict], dict]


class LinearError(RuntimeError):
    pass


def make_post(api_key: str) -> Post:
    def post(query: str, variables: dict) -> dict:
        request = urllib.request.Request(
            API_URL,
            data=json.dumps({"query": query, "variables": variables}).encode(),
            headers={"Authorization": api_key, "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            body = json.load(response)
        if "errors" in body:
            raise LinearError(json.dumps(body["errors"]))
        return body["data"]

    return post


def find_closed_issues(post: Post) -> list[dict]:
    issues, after = [], None
    while True:
        page = post(ISSUES_QUERY, {"after": after, "team": TEAM_KEY, "states": list(CLOSED_STATES)})["issues"]
        issues += page["nodes"]
        if not page["pageInfo"]["hasNextPage"]:
            return issues
        after = page["pageInfo"]["endCursor"]


def archive_issues(post: Post, issues: list[dict]) -> list[str]:
    """Archives each issue; returns the identifiers that failed, with the reason."""
    failed = []
    for issue in issues:
        try:
            if not post(ARCHIVE_MUTATION, {"id": issue["id"]})["issueArchive"]["success"]:
                failed.append(f"{issue['identifier']}: Linear returned success=false")
        except LinearError as error:
            failed.append(f"{issue['identifier']}: {error}")
    return failed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="list what would be archived, change nothing")
    args = parser.parse_args()

    api_key = os.environ.get("LINEAR_API_KEY", "").strip()
    if not api_key:
        print("LINEAR_API_KEY is not set; see the docstring for how to create one.", file=sys.stderr)
        return 2

    post = make_post(api_key)
    issues = find_closed_issues(post)
    print(f"{len(issues)} closed issue(s) not yet archived: {', '.join(i['identifier'] for i in issues) or 'none'}")
    if args.dry_run or not issues:
        return 0

    failed = archive_issues(post, issues)
    print(f"Archived {len(issues) - len(failed)}, failed {len(failed)}")
    for line in failed:
        print(f"  {line}", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
