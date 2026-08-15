#!/usr/bin/env python3
"""Lint a PR's changes against docs/CONVENTIONS.md.

Four faithful, low-false-positive checks (every rule below was verified to produce zero
violations against the current ``main`` tree before shipping):

  1. Filenames — files ADDED by this PR must be lowercase, no whitespace. Code files
     (.py/.c/.h/.cpp/.hpp/.cc/.ino) and code/data directories may use snake_case;
     documents and assets use kebab-case. Documented exception areas
     (analytics/data/**, assets/presentations/**) and GitHub/repo magic names are
     exempt. (CONVENTIONS.md → "Naming".)
  2. Forbidden files — files ADDED by this PR must not be .docx/.xlsx, a .wav outside the
     one sample session, an OS-noise file, a key/secret file, or >50 MB.
     (CONVENTIONS.md → "Never commit these".)
  3. Markdown — files ADDED or MODIFIED by this PR must have exactly one H1 and no HTML
     tables. Lines over 100 chars are reported as WARNINGS only (the convention is "~100"
     and DOIs/tables legitimately exceed it). (CONVENTIONS.md → "Markdown rules".)
  4. Source registry — the whole-repo invariant that every docs/hub/research/notes/*.md is
     referenced from docs/hub/research/sources.md and vice-versa. (CONVENTIONS.md /
     Knowledge Hub.)

Scope: checks 1–2 run on added files, check 3 on added+modified markdown, check 4 on the
whole tree. Diffs are computed against ``--base`` (default ``origin/main``) with three-dot
semantics (only what the PR introduced). Exit 0 = no FATAL findings, 1 = at least one.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys

# --- shared constants ------------------------------------------------------------------

CODE_EXTS = {".py", ".c", ".h", ".cpp", ".hpp", ".cc", ".ino"}

ALLOW_BASENAMES = {
    "README.md", "LICENSE", "CLAUDE.md", "CONVENTIONS.md", "MEMORY.md",
    "CODEOWNERS", "pull_request_template.md", "SECURITY.md", "CONTRIBUTING.md",
    ".gitignore", ".gitattributes", ".gitmodules", ".gitkeep",
    "requirements.txt", "platformio.ini", "Makefile",
}

# Documented exceptions (CONVENTIONS.md): generated artifacts + sample audio live under
# analytics/data/**; the kept slide deck lives under assets/presentations/**.
EXEMPT_PREFIXES = ("analytics/data/", "assets/presentations/")

SAMPLE_WAV_DIR = "analytics/data/longitudinal/201708_20170801/"

SEG_LOWER = re.compile(r"^[a-z0-9]+(?:[_-][a-z0-9]+)*$")   # dirs & code stems
KEBAB_STEM = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")     # non-code stems
DUNDER = re.compile(r"^__[a-z0-9_]+__$")

FORBIDDEN_EXTS = {".docx", ".xlsx"}
OS_NOISE = {".DS_Store", "Thumbs.db"}
SECRET_EXTS = {".pem", ".key", ".p12", ".pfx", ".keystore", ".jks"}
SECRET_NAMES = {"id_rsa", "id_dsa", "id_ecdsa", "id_ed25519", ".env"}
MAX_BYTES = 50 * 1024 * 1024

MD_FENCE = re.compile(r"^\s*```")
MD_H1 = re.compile(r"^#\s+\S")
MD_INLINE = re.compile(r"`[^`]*`")
MD_HTML_TABLE = re.compile(r"</?(table|tr|td|th|thead|tbody)\b", re.IGNORECASE)
URL_RE = re.compile(r"https?://")
LINE_MAX = 100


# --- git helpers -----------------------------------------------------------------------

def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True)


def diff_names(base: str, filt: str) -> list[str]:
    try:
        out = git("diff", "--name-only", f"--diff-filter={filt}", f"{base}...HEAD")
    except subprocess.CalledProcessError:
        return []
    return [p for p in out.splitlines() if p.strip()]


# --- check 1: filenames ----------------------------------------------------------------

def check_filenames(added: list[str]) -> list[str]:
    problems: list[str] = []
    for f in added:
        if any(ch.isspace() for ch in f):
            problems.append(f"{f}: path contains whitespace")
            continue
        segs = f.split("/")
        base, dirs = segs[-1], segs[:-1]
        bad_dir = False
        for d in dirs:
            if d == ".github":
                continue
            if not SEG_LOWER.match(d):
                problems.append(f"{f}: directory segment '{d}' is not lowercase kebab/snake")
                bad_dir = True
                break
        if bad_dir:
            continue
        if base in ALLOW_BASENAMES or any(f.startswith(p) for p in EXEMPT_PREFIXES):
            continue
        if any(ch.isupper() for ch in base):
            problems.append(f"{f}: '{base}' contains uppercase (use lowercase)")
            continue
        ext = base[base.rfind("."):] if "." in base[1:] else ""
        stem = base[: -len(ext)] if ext else base
        if ext in CODE_EXTS:
            if not (DUNDER.match(stem) or SEG_LOWER.match(stem)):
                problems.append(f"{f}: code file stem '{stem}' is not snake/kebab-case")
        else:
            if not KEBAB_STEM.match(stem):
                problems.append(
                    f"{f}: '{stem}' is not kebab-case "
                    "(documents & assets use hyphens, not underscores)"
                )
    return problems


# --- check 2: forbidden files ----------------------------------------------------------

def check_forbidden(added: list[str]) -> list[str]:
    problems: list[str] = []
    for f in added:
        base = f.split("/")[-1]
        ext = base[base.rfind("."):].lower() if "." in base[1:] else ""
        if ext in FORBIDDEN_EXTS:
            problems.append(f"{f}: {ext} is binary/undiffable — write it in Markdown instead")
            continue
        if base in OS_NOISE:
            problems.append(f"{f}: OS-noise file must not be committed")
            continue
        if ext == ".wav" and not f.startswith(SAMPLE_WAV_DIR):
            problems.append(
                f"{f}: .wav outside the sample session ({SAMPLE_WAV_DIR}) — the archive is ~7 GB"
            )
            continue
        if ext in SECRET_EXTS or base in SECRET_NAMES:
            problems.append(f"{f}: looks like a key/secret file — use environment variables")
            continue
        try:
            size = os.path.getsize(f)
            if size > MAX_BYTES:
                problems.append(f"{f}: {size // (1024*1024)} MB exceeds the 50 MB limit")
        except OSError:
            pass
    return problems


# --- check 3: markdown -----------------------------------------------------------------

def check_markdown(md_files: list[str]) -> tuple[list[str], list[str]]:
    fatal: list[str] = []
    warn: list[str] = []
    for f in md_files:
        if not os.path.exists(f):
            continue
        lines = open(f, encoding="utf-8").read().splitlines()
        in_fence = False
        h1 = 0
        for n, line in enumerate(lines, 1):
            if MD_FENCE.match(line):
                in_fence = not in_fence
                continue
            if in_fence:
                continue
            if MD_H1.match(line):
                h1 += 1
            stripped = MD_INLINE.sub("", line)
            if MD_HTML_TABLE.search(stripped):
                fatal.append(f"{f}:{n}: HTML table tag — use a GFM pipe table")
            if len(line) > LINE_MAX and not URL_RE.search(line) and "|" not in line:
                warn.append(f"{f}:{n}: line is {len(line)} chars (>~{LINE_MAX})")
        if h1 != 1:
            fatal.append(f"{f}: has {h1} H1 headings — every doc needs exactly one")
    return fatal, warn


# --- check 4: source registry ↔ notes --------------------------------------------------

def check_source_registry() -> list[str]:
    sources = "docs/hub/research/sources.md"
    notes_dir = "docs/hub/research/notes"
    if not os.path.exists(sources) or not os.path.isdir(notes_dir):
        return []
    text = open(sources, encoding="utf-8").read()
    referenced = set(re.findall(r"notes/[a-z0-9./-]+\.md", text))
    on_disk = {f"notes/{n}" for n in os.listdir(notes_dir) if n.endswith(".md")}
    problems: list[str] = []
    for orphan in sorted(on_disk - referenced):
        problems.append(f"{orphan}: reading note not referenced in sources.md")
    for dangling in sorted(referenced - on_disk):
        problems.append(f"sources.md references {dangling}, which does not exist")
    return problems


# --- driver ----------------------------------------------------------------------------

def section(title: str, fatal: list[str], warn: list[str] | None = None) -> bool:
    ok = not fatal
    print(f"[{'OK ' if ok else 'FAIL'}] {title}")
    for p in fatal:
        print(f"    FATAL  {p}")
    for p in warn or []:
        print(f"    warn   {p}")
    return ok


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=os.environ.get("BASE_REF", "origin/main"))
    args = ap.parse_args()

    added = diff_names(args.base, "A")
    modified = diff_names(args.base, "AM")
    # The "one H1 / no HTML table" rules are about Notion-mirrored prose documents
    # (CONVENTIONS.md → "Writing documents"). GitHub infra markdown under .github/ (the PR
    # template, issue templates) legitimately has no H1, so it is out of scope here.
    md_files = [f for f in modified if f.endswith(".md") and not f.startswith(".github/")]

    print(f"Base: {args.base}  |  added: {len(added)}  |  added+modified md: {len(md_files)}\n")

    all_ok = True
    all_ok &= section("Filenames (added files)", check_filenames(added))
    all_ok &= section("Forbidden files (added files)", check_forbidden(added))
    md_fatal, md_warn = check_markdown(md_files)
    all_ok &= section("Markdown (added+modified)", md_fatal, md_warn)
    all_ok &= section("Source registry ↔ notes", check_source_registry())

    print()
    if all_ok:
        print("Conventions check: OK")
        return 0
    print("Conventions check: FAIL (see FATAL lines above)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
