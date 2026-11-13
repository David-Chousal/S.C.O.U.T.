#!/usr/bin/env python3
"""Require a completed CodeRabbit review on the PR's head commit.

CodeRabbit (GitHub App ``coderabbitai``, installed 2026-11-12) posts a check run named
``CodeRabbit`` when it reviews a PR. ``.coderabbit.yaml`` turns off re-reviews on every push, so
it reviews once, when the PR opens. This gate passes as soon as any commit of the PR has a
successful review; if none has, it waits for the head commit's run and fails if it never appears
or ends any way but `success`, so no PR can go green without one AI review. It does not
judge the review's content: reading and answering CodeRabbit's comments is the author's job
(CLAUDE.md, Standing rule 9).

Reads ``GITHUB_TOKEN``, ``GITHUB_REPOSITORY``, ``HEAD_SHA`` and ``PR_NUMBER`` from the environment.
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
CHECK_NAME = "CodeRabbit"
# Only `success` is a finished review: CodeRabbit ends rate-limited reviews, and errors by
# default, as `neutral` (docs.coderabbit.ai/pr-reviews/status-check).
OK_CONCLUSIONS = ("success",)
TIMEOUT_S = 20 * 60
POLL_S = 30

PASS, FAIL, WAIT = "pass", "fail", "wait"

RERUN_HINT = (
    "Comment `@coderabbitai review` on the PR to start a review, then re-run this job. "
    "If CodeRabbit never responds, check the app is still installed on the repo."
)


def evaluate(check_runs: list[dict]) -> tuple[str, str]:
    """Return (verdict, message) for the check runs on one commit."""
    ours = [
        r
        for r in check_runs
        if (r.get("app") or {}).get("slug") == CODERABBIT_SLUG and r.get("name") == CHECK_NAME
    ]
    if not ours:
        return WAIT, "CodeRabbit has not started a review on this commit yet."
    if any(r.get("conclusion") in OK_CONCLUSIONS for r in ours):
        return PASS, "CodeRabbit review completed."
    if any(r.get("status") != "completed" for r in ours):
        return WAIT, "CodeRabbit review in progress."
    conclusions = ", ".join(sorted({str(r.get("conclusion")) for r in ours}))
    return FAIL, f"CodeRabbit review did not complete (conclusion: {conclusions}). {RERUN_HINT}"


def _get(url: str, token: str):
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def fetch_check_runs(repo: str, sha: str, token: str) -> list[dict]:
    url = f"https://api.github.com/repos/{repo}/commits/{sha}/check-runs?per_page=100"
    return _get(url, token).get("check_runs", [])


def reviewed_commit(repo: str, pr_number: str, head_sha: str, token: str) -> str | None:
    """Return the newest earlier commit of the PR that CodeRabbit reviewed successfully, if any.

    A review on an earlier commit is enough: CodeRabbit deliberately does not re-review every
    push, and re-requesting one each time is what made reviews loop for hours (PR #321).
    """
    commits = _get(f"https://api.github.com/repos/{repo}/pulls/{pr_number}/commits?per_page=100", token)
    for sha in reversed([c["sha"] for c in commits]):
        if sha != head_sha and evaluate(fetch_check_runs(repo, sha, token))[0] == PASS:
            return sha
    return None


def main() -> int:
    try:
        token = os.environ["GITHUB_TOKEN"]
        repo = os.environ["GITHUB_REPOSITORY"]
        sha = os.environ["HEAD_SHA"]
        pr_number = os.environ["PR_NUMBER"]
    except KeyError as missing:
        print(f"FATAL: environment variable {missing} is not set.")
        return 1

    try:
        earlier = reviewed_commit(repo, pr_number, sha, token)
    except (urllib.error.URLError, json.JSONDecodeError, KeyError) as error:
        print(f"Could not list earlier reviews, waiting on the head commit instead: {error}")
        earlier = None
    if earlier:
        print(f"CodeRabbit already reviewed this PR at {earlier[:7]}; later pushes are not re-reviewed.")
        return 0

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
