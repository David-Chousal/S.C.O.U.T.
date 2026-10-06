#!/usr/bin/env python3
"""Build the S.C.O.U.T. Gantt chart / WBS PDF from docs/planning/wbs-tasks.csv.

The CSV is the single editable source. Change a row (or ask Claude to resync it from
Linear), then run:

    python3 scripts/make_gantt.py

Output: docs/planning/gantt-fall-2026.pdf. Standard library only. The PDF is printed from
HTML by headless Chrome; if Chrome is not installed the script writes the HTML instead and
you can print it to PDF from any browser (landscape, no headers).
"""
from __future__ import annotations

import argparse
import csv
import html
import shutil
import subprocess
import sys
import tempfile
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "docs" / "planning" / "wbs-tasks.csv"
PDF_PATH = ROOT / "docs" / "planning" / "gantt-fall-2026.pdf"

DETAIL_START = date(2026, 10, 6)
DETAIL_END = date(2026, 10, 18)
OVERVIEW_START = date(2026, 10, 5)  # a Monday
OVERVIEW_END = date(2027, 1, 17)

SECTIONS = {
    "1": "1  Project management & documentation",
    "2": "2  Electrical hardware (ECE)",
    "3": "3  Firmware & software (CSEN)",
    "4": "4  Mechanical & structure (GENG)",
    "5": "5  Deployment & compliance",
    "M": "Milestones & deadlines",
}
OWNER_COLOR = {
    "John Ryan Myrdal": "#2f6fb5",
    "Isabella Rodriguez": "#2f8f5b",
    "David Chousal Cantu": "#d9822b",
    "All": "#6b6b6b",
}
INITIALS = {"John Ryan Myrdal": "JR", "Isabella Rodriguez": "IR", "David Chousal Cantu": "DC", "All": "All"}
CHROME = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "chromium",
    "chrome",
]


def parse_date(s: str) -> date:
    return date.fromisoformat(s)


def load(path: Path) -> list[dict]:
    rows = []
    with open(path, newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            r["start_d"] = parse_date(r["start"])
            r["end_d"] = parse_date(r["end"])
            r["duration"] = (r["end_d"] - r["start_d"]).days + 1
            r["section"] = r["wbs"].split(".")[0] if r["wbs"][0].isdigit() else "M"
            r["deps"] = r["depends_on"].split()
            rows.append(r)
    return rows


def section_rows(rows: list[dict], key: str) -> list[dict]:
    return [r for r in rows if r["section"] == key]


def ids_of(row: dict) -> list[str]:
    return [p.strip() for p in row["linear"].replace("/", " ").split() if p.startswith("SCO-")]


def short(text: str, n: int) -> str:
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def gantt_svg(rows: list[dict], t0: date, t1: date, unit: int, label_w: int, row_h: int,
              scale: str, arrows: bool = True) -> str:
    """One SVG chart. scale is 'day' or 'week'."""
    days = (t1 - t0).days + 1
    step = 1 if scale == "day" else 7
    cols = (days + step - 1) // step
    chart_w = cols * unit
    head_h = 34 if scale == "day" else 30
    w = label_w + chart_w + 4
    h = head_h + row_h * len(rows) + 6
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" '
           f'style="max-width:{w}px;font-family:Helvetica,Arial,sans-serif">']
    # header
    for c in range(cols):
        d0 = t0 + timedelta(days=c * step)
        x = label_w + c * unit
        weekend = scale == "day" and d0.weekday() >= 5
        if weekend:
            out.append(f'<rect x="{x}" y="{head_h}" width="{unit}" height="{h - head_h - 4}" fill="#f1f1f1"/>')
        out.append(f'<line x1="{x}" y1="{head_h - 10}" x2="{x}" y2="{h - 4}" stroke="#d6d6d6" stroke-width="0.5"/>')
        if scale == "day":
            out.append(f'<text x="{x + unit / 2}" y="{head_h - 20}" font-size="7.5" text-anchor="middle" '
                       f'fill="#444">{d0.strftime("%a")[0]}</text>')
            out.append(f'<text x="{x + unit / 2}" y="{head_h - 9}" font-size="8" text-anchor="middle" '
                       f'fill="#222" font-weight="bold">{d0.day}</text>')
            if d0.day == 1 or c == 0:
                out.append(f'<text x="{x + 2}" y="{head_h - 27}" font-size="8" fill="#222" '
                           f'font-weight="bold">{d0.strftime("%b %Y")}</text>')
        else:
            out.append(f'<text x="{x + 2}" y="{head_h - 8}" font-size="7" fill="#222">'
                       f'{d0.strftime("%b")} {d0.day}</text>')
    out.append(f'<line x1="{label_w + chart_w}" y1="{head_h - 10}" x2="{label_w + chart_w}" '
               f'y2="{h - 4}" stroke="#d6d6d6" stroke-width="0.5"/>')

    def xpos(d: date, end: bool = False) -> float:
        dd = (d - t0).days + (1 if end else 0)
        return label_w + dd * unit / step

    # today line (first detail day)
    if DETAIL_START >= t0 and DETAIL_START <= t1 and scale == "day":
        pass
    index = {}
    for i, r in enumerate(rows):
        if r["kind"] == "header":
            continue
        for sid in ids_of(r) + [r["wbs"]]:
            index[sid] = i
    for i, r in enumerate(rows):
        y = head_h + i * row_h
        if r["kind"] == "header":
            out.append(f'<rect x="0" y="{y}" width="{w}" height="{row_h}" fill="#dfe7f1"/>')
        elif i % 2 == 0:
            out.append(f'<rect x="0" y="{y}" width="{w}" height="{row_h}" fill="#fafafa"/>')
    # labels
    for i, r in enumerate(rows):
        y = head_h + i * row_h
        if r["kind"] == "header":
            out.append(f'<text x="3" y="{y + row_h - 5}" font-size="9" font-weight="bold" fill="#111">{esc(r["task"])}</text>')
            continue
        ids = " / ".join(ids_of(r)[:2]) if r["linear"] else ""
        label = f'{r["wbs"]}  {short(r["task"], 58 if scale == "day" else 50)}'
        fs = 9 if scale == "day" else 7.4
        out.append(f'<text x="3" y="{y + row_h - 5}" font-size="{fs}" fill="#111">{esc(label)}</text>')
        meta = f'{ids}  {INITIALS.get(r["owner"], r["owner"])}'
        out.append(f'<text x="{label_w - 3}" y="{y + row_h - 5}" font-size="{fs - 1}" text-anchor="end" '
                   f'fill="#666">{esc(meta.strip())}</text>')
    # bars
    for i, r in enumerate(rows):
        y = head_h + i * row_h
        if r["kind"] == "header":
            continue
        color = OWNER_COLOR.get(r["owner"], "#6b6b6b")
        s, e = r["start_d"], r["end_d"]
        if e < t0 or s > t1:
            continue
        cs, ce = max(s, t0), min(e, t1)
        x0, x1 = xpos(cs), xpos(ce, end=True)
        if r["kind"] in ("milestone", "deadline"):
            cx = (x0 + x1) / 2
            m = row_h / 2 - 1
            fill = "#c0392b" if r["kind"] == "deadline" else "#222"
            out.append(f'<polygon points="{cx},{y + 2} {cx + m},{y + row_h / 2} {cx},{y + row_h - 2} '
                       f'{cx - m},{y + row_h / 2}" fill="{fill}"/>')
            continue
        bh = row_h - 6
        estimated = r["date_source"] != "Linear"
        extra = ' stroke-dasharray="3,2" fill-opacity="0.55"' if estimated else ' fill-opacity="0.95"'
        status = r["status"]
        out.append(f'<rect x="{x0:.1f}" y="{y + 3}" width="{max(x1 - x0, 2):.1f}" height="{bh}" rx="2" '
                   f'fill="{color}" stroke="{color}" stroke-width="1"{extra}/>')
        if status in ("Blocked", "Waiting on Parts", "Needs Decision"):
            out.append(f'<rect x="{x0:.1f}" y="{y + 3}" width="{max(x1 - x0, 2):.1f}" height="{bh}" rx="2" '
                       f'fill="none" stroke="#c0392b" stroke-width="1.4"/>')
        if s < t0:
            out.append(f'<polygon points="{x0 - 4},{y + row_h / 2} {x0 + 2},{y + 3} {x0 + 2},{y + row_h - 3}" '
                       f'fill="{color}"/>')
        if e > t1:
            out.append(f'<polygon points="{x1 + 4},{y + row_h / 2} {x1 - 2},{y + 3} {x1 - 2},{y + row_h - 3}" '
                       f'fill="{color}"/>')
    # dependency arrows (same chart only)
    for i, r in enumerate(rows if arrows else []):
        for dep in r["deps"]:
            j = index.get(dep)
            if j is None or j == i:
                continue
            p = rows[j]
            if p["end_d"] < t0 or r["start_d"] > t1:
                continue
            px = xpos(min(p["end_d"], t1), end=True)
            sx = xpos(max(r["start_d"], t0))
            py = head_h + j * row_h + row_h / 2
            sy = head_h + i * row_h + row_h / 2
            mid = max(px + 3, min(sx - 3, px + 6))
            out.append(f'<polyline points="{px:.1f},{py:.1f} {mid:.1f},{py:.1f} {mid:.1f},{sy:.1f} '
                       f'{sx:.1f},{sy:.1f}" fill="none" stroke="#7a1f1f" stroke-width="0.7"/>')
            out.append(f'<polygon points="{sx:.1f},{sy:.1f} {sx - 3.5:.1f},{sy - 2.2:.1f} '
                       f'{sx - 3.5:.1f},{sy + 2.2:.1f}" fill="#7a1f1f"/>')
    out.append("</svg>")
    return "\n".join(out)


LEGEND = (
    '<div class="legend">'
    '<span><i style="background:#2f6fb5"></i>John Ryan Myrdal (GENG)</span>'
    '<span><i style="background:#2f8f5b"></i>Isabella Rodriguez (ECE)</span>'
    '<span><i style="background:#d9822b"></i>David Chousal Cantu (CSEN)</span>'
    '<span><i class="est"></i>dashed = estimated dates</span>'
    '<span><i class="blk"></i>red outline = blocked / waiting</span>'
    '<span><b style="color:#7a1f1f">&rarr;</b> dependency</span>'
    '<span><b>&#9670;</b> milestone</span>'
    '<span><b style="color:#c0392b">&#9670;</b> external deadline</span>'
    "</div>"
)

CSS = """
@page { size: 11in 8.5in; margin: 0.35in; }
body { font-family: Helvetica, Arial, sans-serif; color: #111; margin: 0; }
h1 { font-size: 17pt; margin: 0 0 2pt; }
h2 { font-size: 11.5pt; margin: 0 0 4pt; }
.sub { font-size: 8.5pt; color: #444; margin-bottom: 6pt; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
.legend { font-size: 7.5pt; margin: 3pt 0 5pt; display: flex; flex-wrap: wrap; gap: 4pt 12pt; }
.legend i { display: inline-block; width: 10px; height: 8px; margin-right: 3px; border-radius: 1px; vertical-align: middle; }
.legend i.est { background: #999; opacity: .55; border: 1px dashed #666; }
.legend i.blk { border: 1.5px solid #c0392b; }
table { border-collapse: collapse; width: 100%; font-size: 6.6pt; }
th, td { border: 0.5pt solid #bbb; padding: 1.5pt 3pt; vertical-align: top; }
th { background: #e8e8e8; text-align: left; }
tr.sec td { background: #dfe7f1; font-weight: bold; }
td.n { white-space: nowrap; }
ul { margin: 2pt 0 4pt 14pt; padding: 0; font-size: 8.5pt; }
li { margin-bottom: 1.5pt; }
.note { font-size: 7.5pt; color: #444; margin-top: 4pt; }
"""


def wbs_key(r: dict):
    if r["wbs"][0].isdigit():
        return (0, [int(x) for x in r["wbs"].split(".")])
    return (1, [r["start_d"].toordinal()])


def chunks(seq: list, n: int):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def build_html(rows: list[dict]) -> str:
    p = []
    p.append(f"<html><head><meta charset='utf-8'><title>S.C.O.U.T. Gantt chart and WBS</title>"
             f"<style>{CSS}</style></head><body>")
    # cover
    tasks = [r for r in rows if r["kind"] == "task"]
    mil = [r for r in rows if r["kind"] != "task"]
    counts = {}
    for r in tasks:
        counts[r["owner"]] = counts.get(r["owner"], 0) + 1
    p.append("<div class='page'>")
    p.append("<h1>S.C.O.U.T. Senior Design: Task Plan, Gantt Chart and WBS</h1>")
    p.append("<div class='sub'>Santa Clara Oceanic Utilities Transmitter &middot; whole team &middot; "
             f"detailed plan Oct 6 &ndash; Oct 18, 2026, all known fall tasks through Jan 15, 2027 &middot; "
             f"built {date.today().isoformat()} from <code>docs/planning/wbs-tasks.csv</code> "
             "(synced from Linear)</div>")
    p.append("<h2>Team and ownership</h2><ul>")
    p.append(f"<li><b>John Ryan Myrdal (GENG)</b> &mdash; field and mechanical: buoy structure, deployment. {counts.get('John Ryan Myrdal', 0)} tasks.</li>")
    p.append(f"<li><b>Isabella Rodriguez (ECEN)</b> &mdash; hardware: electrical design, power, bench tests. {counts.get('Isabella Rodriguez', 0)} tasks.</li>")
    p.append(f"<li><b>David Chousal Cantu (CSEN)</b> &mdash; software: firmware, data pipeline, shore station. {counts.get('David Chousal Cantu', 0)} tasks.</li>")
    p.append("<li>Advisors: Jes Kuczenski, Hoeseok Yang (ECEN), Navid Shaghaghi.</li></ul>")
    p.append("<h2>Milestones and external deadlines</h2><ul>")
    for r in sorted(mil, key=lambda x: x["start_d"]):
        tag = "SCU deadline" if r["kind"] == "deadline" else "Milestone"
        p.append(f"<li><b>{r['start_d'].strftime('%b %d, %Y')}</b> &mdash; {esc(r['task'])} <i>({tag})</i></li>")
    p.append("</ul>")
    p.append("<h2>How to read this</h2><ul>")
    p.append("<li><b>WBS:</b> 1 Project management &middot; 2 Electrical &middot; 3 Firmware &amp; software &middot; "
             "4 Mechanical &middot; 5 Deployment. Each task has a WBS number and, where one exists, its Linear issue.</li>")
    p.append("<li><b>Pages 2&ndash;5:</b> the Oct 6&ndash;18 detail, one block per work area, with dependency arrows. "
             "<b>Then:</b> the fall overview to Jan 15, and the full table with owner, dates, duration, dependencies, "
             "outside constraints and milestones for every task.</li>")
    p.append("<li><b>Dates:</b> solid bars use Linear dates. Dashed bars are estimates; the table marks the source of every date. "
             "Parts arrival on Fri Oct 9 is an assumption to confirm.</li></ul>")
    p.append(LEGEND)
    p.append("<div class='note'>Outside constraints that drive the plan: SCU funding request and this chart due Oct 18; "
             "weekly team meeting (Thu); parts arrival and vendor lead times; shared printer access (industrial printer, "
             "Prusa XL, lab printer); advisor and reviewer availability; saltwater soak times of 24 hours to 1 week.</div>")
    p.append("</div>")
    # detail pages
    detail = [r for r in rows if r["end_d"] >= DETAIL_START and r["start_d"] <= DETAIL_END]
    def sec_sorted(key):
        sec = section_rows(detail, key)
        sec.sort(key=wbs_key)
        return sec

    def header(key, cont=False):
        return {"kind": "header", "task": SECTIONS[key] + (" (cont.)" if cont else ""), "wbs": "", "linear": "",
                "owner": "", "deps": [], "start_d": DETAIL_START, "end_d": DETAIL_START, "status": "",
                "date_source": "Linear"}

    groups = [["1", "3", "5", "M"], ["2"], ["4"]]
    pages = []
    for g in groups:
        rows_g = []
        for key in g:
            sr = sec_sorted(key)
            if sr:
                rows_g.append(header(key))
                rows_g.extend(sr)
        for part, grp in enumerate(chunks(rows_g, 27)):
            pages.append(grp)
    for grp in pages:
        names = " / ".join(r["task"].split("  ")[0] for r in grp if r["kind"] == "header")
        p.append("<div class='page'>")
        p.append(f"<h2>Detail: Oct 6 &ndash; Oct 18, 2026 &middot; WBS {esc(names)}</h2>")
        p.append(LEGEND)
        p.append(gantt_svg(grp, DETAIL_START, DETAIL_END, unit=41, label_w=420, row_h=19, scale="day"))
        p.append("</div>")
    # overview pages
    ov = []
    for key in ["1", "2", "3", "4", "5", "M"]:
        sr = sorted(section_rows(rows, key), key=wbs_key)
        if sr:
            ov.append({"kind": "header", "task": SECTIONS[key], "wbs": "", "linear": "", "owner": "",
                       "deps": [], "start_d": OVERVIEW_START, "end_d": OVERVIEW_START, "status": "",
                       "date_source": "Linear"})
            ov.extend(sr)
    for part, grp in enumerate(chunks(ov, 40)):
        p.append("<div class='page'>")
        p.append(f"<h2>Fall overview: Oct 2026 &ndash; Jan 2027 (week columns){' (cont.)' if part else ''}</h2>")
        p.append(LEGEND)
        p.append(gantt_svg(grp, OVERVIEW_START, OVERVIEW_END, unit=46, label_w=420, row_h=14.5,
                           scale="week", arrows=False))
        p.append("</div>")
    # table
    p.append("<div class='page'><h2>Task table (all columns)</h2>")
    p.append("<table><tr><th>WBS</th><th>Linear</th><th>Task</th><th>Owner</th><th>Phase</th><th>Status</th>"
             "<th>Start</th><th>End</th><th>Days</th><th>Depends on</th><th>Outside constraint</th>"
             "<th>Milestone / deadline</th><th>Date source</th></tr>")
    last = None
    for r in sorted(rows, key=lambda r: (r["section"] == "M", r["section"], wbs_key(r))):
        if r["section"] != last:
            p.append(f"<tr class='sec'><td colspan='13'>{esc(SECTIONS[r['section']])}</td></tr>")
            last = r["section"]
        p.append("<tr>" + "".join(f"<td{' class=n' if c in (0, 1, 6, 7, 8) else ''}>{esc(v)}</td>" for c, v in enumerate([
            r["wbs"], r["linear"], r["task"], r["owner"].split()[0], r["phase"], r["status"],
            r["start"], r["end"], str(r["duration"]), r["depends_on"].replace(" ", ", "),
            r["constraint"], r["milestone"], r["date_source"]])) + "</tr>")
    p.append("</table>"
             "<div class='note'>Date source: <b>Linear</b> = taken from the issue; <b>estimated</b> = proposed from the issue "
             "text, parts timing or the phase window and awaiting the owner's confirmation; <b>derived</b> = set by this "
             "assignment. Days are calendar days, inclusive.</div></div>")
    p.append("</body></html>")
    return "\n".join(p)


def find_chrome() -> str | None:
    for c in CHROME:
        if Path(c).exists() or shutil.which(c):
            return c if Path(c).exists() else shutil.which(c)
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--csv", default=str(CSV_PATH))
    ap.add_argument("--pdf", default=str(PDF_PATH))
    ap.add_argument("--html", help="also write the HTML here (needed if Chrome is missing)")
    args = ap.parse_args()
    rows = load(Path(args.csv))
    doc = build_html(rows)
    html_path = Path(args.html) if args.html else Path(tempfile.gettempdir()) / "scout-gantt.html"
    html_path.write_text(doc, encoding="utf-8")
    chrome = find_chrome()
    if not chrome:
        print(f"Chrome not found. HTML written to {html_path}; open it and print to PDF "
              "(landscape, margins default, no headers).", file=sys.stderr)
        return 1
    subprocess.run([chrome, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={args.pdf}", html_path.as_uri()],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"wrote {args.pdf} ({len(rows)} rows)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
