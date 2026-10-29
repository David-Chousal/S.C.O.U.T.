"""Combine the filled detailed sheet and the filled simple sheet into ONE html with a Simple / Detailed toggle.

Usage:  python3 build_combined.py <detailed.html> <simple.html> <out.html>

Each view is embedded as an iframe srcdoc, so their styles and scripts cannot clash. Opens on Simple
(or the viewer's last choice); the Print button prints whichever view is showing.
"""
import html
import sys
from pathlib import Path

PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>S.C.O.U.T. Advisor Sheet</title>
<style>
:root{--bg:#fff;--ink:#1b1f24;--line:#dde1e6;--accent:#185FA5;--card:#f6f7f9}
@media (prefers-color-scheme:dark){:root{--bg:#14171b;--ink:#eceff2;--line:#2c333a;--accent:#6db0f0;--card:#1d2227}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px -apple-system,"Segoe UI",Roboto,sans-serif}
.bar{display:flex;gap:8px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:2}
.bar button{font:inherit;padding:6px 14px;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;cursor:pointer}
.bar button[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff}
.bar .sp{flex:1}
iframe{display:block;width:100%;border:0;min-height:600px}
@media print{.bar{display:none}}
</style></head><body>
<div class="bar"><button id="bs" aria-pressed="true">Simple</button><button id="bd" aria-pressed="false">Detailed</button><span class="sp"></span><button id="pr">Print</button></div>
<iframe id="fs" title="Simple view" srcdoc="__SIMPLE__"></iframe>
<iframe id="fd" title="Detailed view" srcdoc="__DETAILED__" hidden></iframe>
<script>
const F={s:document.getElementById('fs'),d:document.getElementById('fd')},B={s:document.getElementById('bs'),d:document.getElementById('bd')};
let cur='s';
function fit(k){try{const f=F[k],h=f.contentDocument.documentElement.scrollHeight;f.style.height=(h+8)+'px'}catch(e){}}
function show(k){cur=k;for(const x of['s','d']){F[x].hidden=x!==k;B[x].setAttribute('aria-pressed',x===k)}fit(k);try{localStorage.setItem('advisorView',k)}catch(e){}}
for(const k of['s','d']){F[k].addEventListener('load',()=>{fit(k);setTimeout(()=>fit(k),300)});B[k].onclick=()=>show(k)}
window.addEventListener('resize',()=>fit(cur));
document.getElementById('pr').onclick=()=>F[cur].contentWindow.print();
let v='s';try{v=localStorage.getItem('advisorView')||'s'}catch(e){}show(v==='d'?'d':'s');
</script></body></html>
"""


def main(detailed, simple, out):
    e = lambda p: html.escape(Path(p).read_text(), quote=True)
    Path(out).write_text(PAGE.replace("__SIMPLE__", e(simple)).replace("__DETAILED__", e(detailed)))
    print("wrote", out)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
