"""The CodeRabbit review gate (.github/scripts/check_coderabbit.py), run by pr-checks.yml."""

from __future__ import annotations

import importlib.util
import pathlib
import unittest

_ROOT = pathlib.Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location(
    "check_coderabbit", _ROOT / ".github" / "scripts" / "check_coderabbit.py"
)
check_coderabbit = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(check_coderabbit)

evaluate = check_coderabbit.evaluate
PASS, FAIL, WAIT = check_coderabbit.PASS, check_coderabbit.FAIL, check_coderabbit.WAIT


def _run(
    status: str, conclusion: str | None = None, slug: str = "coderabbitai", name: str = "CodeRabbit"
) -> dict:
    return {"name": name, "status": status, "conclusion": conclusion, "app": {"slug": slug}}


class EvaluateTest(unittest.TestCase):
    def test_waits_when_coderabbit_has_not_started(self):
        self.assertEqual(evaluate([])[0], WAIT)

    def test_ignores_check_runs_from_other_apps(self):
        self.assertEqual(evaluate([_run("completed", "success", slug="github-actions")])[0], WAIT)

    def test_waits_while_review_is_in_progress(self):
        self.assertEqual(evaluate([_run("in_progress")])[0], WAIT)

    def test_passes_when_review_completed_successfully(self):
        self.assertEqual(evaluate([_run("completed", "success")])[0], PASS)

    def test_fails_when_review_was_rate_limited_or_errored_as_neutral(self):
        self.assertEqual(evaluate([_run("completed", "neutral")])[0], FAIL)

    def test_ignores_other_coderabbit_check_names(self):
        runs = [_run("completed", "success", name="CodeRabbit Security"), _run("in_progress")]
        self.assertEqual(evaluate(runs)[0], WAIT)

    def test_fails_when_review_was_skipped(self):
        self.assertEqual(evaluate([_run("completed", "skipped")])[0], FAIL)

    def test_fails_when_review_failed(self):
        self.assertEqual(evaluate([_run("completed", "failure")])[0], FAIL)

    def test_passes_if_any_coderabbit_run_succeeded(self):
        runs = [_run("completed", "skipped"), _run("completed", "success")]
        self.assertEqual(evaluate(runs)[0], PASS)


if __name__ == "__main__":
    unittest.main()
