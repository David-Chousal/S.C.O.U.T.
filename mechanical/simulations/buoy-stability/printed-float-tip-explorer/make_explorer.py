"""Writes printed-float-tip-explorer.html: an interactive heel / tip-over explorer for the printed float.

Reads the float profile from printed-float-v9.step (same extraction as run_printed_float.py) and inlines
explorer-core.js. Open the HTML in any browser.   Run: python make_explorer.py
"""
import json
from pathlib import Path
import run_printed_float as R

H = Path(__file__).parent
zs = R.zs[::2]; Rr = R.R[::2]
D = dict(zs=[round(float(a), 1) for a in zs], R=[round(float(a), 1) for a in Rr], floor=round(R.FLOOR, 1),
         top=round(R.TOP, 1), flangeR=R.FLANGE_R, flangeH=R.FLANGE_H)
html = (H / "explorer-template.html").read_text().replace("__CORE__", (H / "explorer-core.js").read_text()) \
    .replace("__DATA__", json.dumps(D))
(H / "printed-float-tip-explorer.html").write_text(html)
print("wrote printed-float-tip-explorer.html", len(html) // 1024, "KB")
