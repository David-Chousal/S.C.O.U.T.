"""Tests for scripts/archive_linear_issues.py against a fake Linear API (no network)."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import archive_linear_issues as archiver  # noqa: E402


def issue(number):
    return {"id": f"uuid-{number}", "identifier": f"SCO-{number}", "state": {"name": "Done"}}


class FakeLinear:
    def __init__(self, pages, failing=()):
        self.pages = pages
        self.failing = set(failing)
        self.archived = []
        self.queries = []

    def post(self, query, variables):
        if query == archiver.ARCHIVE_MUTATION:
            if variables["id"] in self.failing:
                raise archiver.LinearError("boom")
            self.archived.append(variables["id"])
            return {"issueArchive": {"success": True}}
        self.queries.append(variables)
        index = 0 if variables["after"] is None else int(variables["after"])
        has_next = index + 1 < len(self.pages)
        return {"issues": {"nodes": self.pages[index],
                           "pageInfo": {"hasNextPage": has_next, "endCursor": str(index + 1) if has_next else None}}}


class FindClosedIssuesTest(unittest.TestCase):
    def test_follows_every_page(self):
        fake = FakeLinear([[issue(1), issue(2)], [issue(3)]])
        found = archiver.find_closed_issues(fake.post)
        self.assertEqual([i["identifier"] for i in found], ["SCO-1", "SCO-2", "SCO-3"])

    def test_asks_only_for_done_and_canceled_in_the_team(self):
        fake = FakeLinear([[]])
        archiver.find_closed_issues(fake.post)
        self.assertEqual((fake.queries[0]["team"], fake.queries[0]["states"]), ("SCO", ["Done", "Canceled"]))


class ArchiveIssuesTest(unittest.TestCase):
    def test_archives_each_issue(self):
        fake = FakeLinear([[]])
        archiver.archive_issues(fake.post, [issue(1), issue(2)])
        self.assertEqual(fake.archived, ["uuid-1", "uuid-2"])

    def test_reports_failures_and_keeps_going(self):
        fake = FakeLinear([[]], failing={"uuid-1"})
        failed = archiver.archive_issues(fake.post, [issue(1), issue(2)])
        self.assertEqual((failed, fake.archived), (["SCO-1: boom"], ["uuid-2"]))


if __name__ == "__main__":
    unittest.main()
