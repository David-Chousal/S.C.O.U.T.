#!/usr/bin/env python3
"""Build Fred's knowledge pack and doc index (docs/engineering/console-assistant-plan.md).

Writes console/worker/assistant/knowledge.json, which the Worker bundles:
  pack    text that goes in Fred's system instruction on every question (kept under ~15k tokens):
          the console's Help content, the remote-settings registry and the canonical facts
  chunks  every tracked docs/**.md, the README and the console README, split by heading, for the
          search_docs tool (keyword ranking in the Worker; no vector database)

Run from anywhere: python3 console/scripts/build_assistant_knowledge.py
`npm test` and `npm run dev` in console/ run it first, and the deploy workflow runs it before
`wrangler deploy`, so Fred is always as current as main. The output is generated, not committed.
Only files git tracks are read, so stray local copies never reach the index.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "console" / "worker" / "assistant" / "knowledge.json"
PACK_BUDGET_CHARS = 56_000  # about 14k tokens at ~4 characters a token
CHUNK_CHARS = 1_800
HELP_FILES = ("console/web/src/components/help/help-content.tsx", "console/web/src/components/help/help-guide.tsx")


def tracked(pattern: str) -> list[Path]:
    """Files git tracks under `pattern`, so untracked duplicates are never indexed."""
    result = subprocess.run(["git", "ls-files", "--", pattern], cwd=ROOT, capture_output=True, text=True, check=True)
    return [ROOT / line for line in result.stdout.splitlines() if line]


def help_text() -> str:
    """The visible text of the Help page: strings and JSX text, with tags and code removed."""
    lines: list[str] = []
    for name in HELP_FILES:
        source = (ROOT / name).read_text(encoding="utf-8")
        source = re.sub(r"^\s*(import|export type|export interface|interface)\b.*$", "", source, flags=re.M)
        for text in re.findall(r'"([^"\n]{12,})"|>([^<>{}\n]{12,})<', source):
            value = (text[0] or text[1]).strip()
            if value and not value.startswith(("sc-", "/", "@")) and " " in value:
                lines.append(re.sub(r"&\w+;", "'", value))
    return "\n".join(dict.fromkeys(lines))


def settings_text() -> str:
    config = json.loads((ROOT / "console/worker/buoy-config.json").read_text(encoding="utf-8"))
    rows = []
    for spec in config["remote"]:
        allowed = ", ".join(map(str, spec["choices"])) if spec.get("choices") else f"{spec['min']}-{spec['max']} step {spec['step']}"
        rows.append(f"- {spec['key']} ({spec['label']}): default {spec['default']} {spec.get('unit', '')}; allowed {allowed}. {spec['help']}")
    rows.append(f"- Critical must sit at least {config['tierGapMv']} mV under conserve.")
    slots = ", ".join(f"{s // 3600:02d}:{s % 3600 // 60:02d} UTC" for s in config["slotsSod"])
    rows.append(f"- Transmit slots before phase shift: {slots}. 1 a day uses the first, 2 the first and last, 3 all.")
    return "\n".join(rows)


def facts_text(budget: int) -> str:
    """The rows of docs/hub/facts.md's tables, with link targets removed, until the budget is spent."""
    out: list[str] = []
    used = 0
    section = ""
    for line in (ROOT / "docs/hub/facts.md").read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            section = line[3:].strip()
            continue
        if not line.startswith("|") or set(line) <= set("|-: "):
            continue
        cells = [re.sub(r"\]\([^)]*\)", "]", c).replace("**", "").strip() for c in line.strip("|").split("|")]
        if cells[0] in ("Fact", ""):
            continue
        row = f"[{section}] " + " | ".join(cells)[:260]
        if used + len(row) > budget:
            out.append("(More facts: search_docs docs/hub/facts.md.)")
            break
        out.append(row)
        used += len(row) + 1
    return "\n".join(out)


def build_pack() -> str:
    help_part = help_text()
    settings_part = settings_text()
    head = (
        "## Console Help page (what people see under Help)\n" + help_part
        + "\n\n## Remote buoy settings (firmware registry, buoy-config.json)\n" + settings_part
        + "\n\n## Canonical facts (docs/hub/facts.md; this table wins over any other doc)\n"
    )
    return head + facts_text(PACK_BUDGET_CHARS - len(head))


def chunk_markdown(path: Path) -> list[dict[str, str]]:
    rel = path.relative_to(ROOT).as_posix()
    text = path.read_text(encoding="utf-8", errors="replace")
    chunks: list[dict[str, str]] = []
    heading = rel
    body: list[str] = []

    def flush() -> None:
        joined = "\n".join(body).strip()
        for start in range(0, len(joined), CHUNK_CHARS):
            piece = joined[start:start + CHUNK_CHARS].strip()
            if len(piece) > 40:
                chunks.append({"path": rel, "heading": heading, "text": piece})

    for line in text.splitlines():
        match = re.match(r"^#{1,3}\s+(.*)", line)
        if match:
            flush()
            heading, body = match.group(1).strip(), []
        else:
            body.append(line)
    flush()
    return chunks


def main() -> int:
    sources = tracked("docs/*.md") + tracked("README.md") + tracked("console/README.md")
    chunks = [chunk for path in sorted(set(sources)) for chunk in chunk_markdown(path)]
    pack = build_pack()
    OUT.write_text(json.dumps({
        "built": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "pack": pack,
        "chunks": chunks,
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"knowledge: pack {len(pack):,} chars, {len(chunks):,} chunks from {len(sources)} files → {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
