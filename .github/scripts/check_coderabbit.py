#!/usr/bin/env python3
"""Require a completed CodeRabbit review on the PR's head commit.

CodeRabbit (GitHub App ``coderabbitai``, installed 2026-11-12) posts a check run named
``CodeRabbit`` on every push to a PR. This gate waits for that run to finish and fails if it
never appears, is skipped, or fails, so no PR can go green without an AI review. It does not
judge the review's content: reading and answering CodeRabbit's comments is the author's job
(CLAUDE.md, "CodeRabbit review on every PR").

Reads ``GITHUB_TOKEN``, ``GITHUB_REPOSITORY`` and ``HEAD_SHA`` from the environment.
Exit 0 = pass, 1 = fail.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request

CODERABBIT_SLUG = "coderabbitai"
OK_CONCLUSIONS = ("success", "neutral")
TIMEOUT_S = 20 * 60
POLL_S = 30

PASS, FAIL, WAIT = "pass", "fail", "wait"

RERUN_HINT = (
    "Comment `@coderabbitai review` on the PR to start a review, then re-run this job. "
    "If CodeRabbit never responds, check the app is still installed on the repo."
)


def evaluate(check_runs: list[dict]) -> tuple[str, str]:
    """Return (verdict, message) for the check runs on one commit."""
    ours = [r for r in check_runs if (r.get("app") or {}).get("slug") == CODERABBIT_SLUG]
    if not ours:
        return WAIT, "CodeRabbit has not started a review on this commit yet."
    if any(r.get("conclusion") in OK_CONCLUSIONS for r in ours):
        return PASS, "CodeRabbit review completed."
    if any(r.get("status") != "completed" for r in ours):
        return WAIT, "CodeRabbit review in progress."
    conclusions = ", ".join(sorted({str(r.get("conclusion")) for r in ours}))
    return FAIL, f"CodeRabbit review did not complete (conclusion: {conclusions}). {RERUN_HINT}"


def fetch_check_runs(repo: str, sha: str, token: str) -> list[dict]:
    url = f"https://api.github.com/repos/{repo}/commits/{sha}/check-runs?per_page=100"
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response).get("check_runs", [])


def main() -> int:
    try:
        token = os.environ["GITHUB_TOKEN"]
        repo = os.environ["GITHUB_REPOSITORY"]
        sha = os.environ["HEAD_SHA"]
    except KeyError as missing:
        print(f"FATAL: environment variable {missing} is not set.")
        return 1

    deadline = time.monotonic() + TIMEOUT_S
    while True:
        try:
            verdict, message = evaluate(fetch_check_runs(repo, sha, token))
        except (urllib.error.URLError, json.JSONDecodeError) as error:
            verdict, message = WAIT, f"GitHub API error, retrying: {error}"
        print(message, flush=True)
        if verdict == PASS:
            return 0
        if verdict == FAIL:
            print(f"FATAL: {message}")
            return 1
        if time.monotonic() >= deadline:
            print(f"FATAL: no finished CodeRabbit review after {TIMEOUT_S // 60} min. {RERUN_HINT}")
            return 1
        time.sleep(POLL_S)


if __name__ == "__main__":
    sys.exit(main())
