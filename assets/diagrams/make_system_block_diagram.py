"""Regenerates assets/diagrams/system-block-diagram-2026-10-14.svg (the S.C.O.U.T. system block diagram).

Needs gmsh + numpy and the printed-float tip explorer folder (PR #172) for the float outline.
Run from the repo root: python assets/diagrams/make_system_block_diagram.py
"""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "mechanical/simulations/buoy-stability/printed-float-tip-explorer"))
import run_printed_float as R
W, Hh = 1780, 1070
o = []
add = o.append
C = dict(pw="#c0392b", sg="#185FA5", dt="#1D9E75", ml="#6b6a64", tbd="#d98500")
def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;")
def text(x, y, s, size=12, w=400, anchor="start", fill="var(--text)"):
    add(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{w}" text-anchor="{anchor}" fill="{fill}">{esc(s)}</text>')
def box(x, y, w, h, title, lines=(), kind="n", fs=11):
    stroke = {"n": "#555", "t": C["tbd"], "c": "#b3261e"}[kind]
    dash = ' stroke-dasharray="6 4"' if kind != "n" else ""
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="var(--card)" stroke="{stroke}" stroke-width="1.6"{dash}/>')
    text(x + w / 2, y + 17, title, 12.5, 600, "middle")
    for i, l in enumerate(lines):
        text(x + w / 2, y + 33 + i * 14, l, fs, 400, "middle", "var(--muted)")
def frame(x, y, w, h, title, color="#888"):
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="none" stroke="{color}" stroke-width="1.8" stroke-dasharray="9 5"/>')
    text(x + 12, y + 20, title, 12.5, 700, "start", color)
def arrow(pts, kind="sg", label=None, lx=None, ly=None, dash=False, anchor="start"):
    d = "M" + " L".join(f"{a},{b}" for a, b in pts)
    da = ' stroke-dasharray="6 4"' if dash else ""
    add(f'<path d="{d}" fill="none" stroke="{C[kind]}" stroke-width="2"{da} marker-end="url(#a-{kind})"/>')
    if label:
        x, y = (lx, ly) if lx is not None else (pts[0][0] + 4, pts[0][1] - 4)
        add(f'<text x="{x}" y="{y}" font-size="10.5" fill="{C[kind]}" font-weight="600" text-anchor="{anchor}" paint-order="stroke" stroke="var(--bg)" stroke-width="3">{esc(label)}</text>')
# ---- header
text(30, 34, "S.C.O.U.T. system block diagram", 22, 700)
text(30, 56, "DRAFT v0.2, 2026-10-14 · battery-only printed-float buoy · dashed orange = undecided, red dashed = conflict between sources (see box, bottom right)", 12, 400, "start", "var(--muted)")
# ---- silhouette
x0, sc, y0 = 215, 1.0, 520
Y = lambda z: y0 - sc * z
X = lambda r: x0 + sc * r
frame(20, 80, 355, 700, "THE BUOY (side section, to scale)")
prof = [(X(r), Y(z)) for r, z in zip(R.R[::3], R.zs[::3])]
pts = prof + [(2 * x0 - a, b) for a, b in reversed(prof)]
add('<polygon points="' + " ".join(f"{a:.1f},{b:.1f}" for a, b in pts) + '" fill="var(--float)" stroke="#555" stroke-width="1.6"/>')
add(f'<rect x="{X(-58)}" y="{Y(R.TOP)}" width="{116*sc}" height="{(R.TOP-R.FLOOR)*sc}" fill="var(--bg)"/>')
add(f'<rect x="{X(-56)}" y="{Y(R.FLOOR+135)}" width="{112*sc}" height="{135*sc}" fill="var(--hous)" stroke="#1f4e79" stroke-width="1.5"/>')
add(f'<rect x="{X(-89)}" y="{Y(R.TOP+33)}" width="{178*sc}" height="{33*sc}" fill="var(--hous)" stroke="#1f4e79" stroke-width="1.5"/>')
add(f'<rect x="{X(-30)}" y="{Y(R.FLOOR+55)}" width="{60*sc}" height="{30*sc}" fill="#e0a458" stroke="#7a4b00"/>')
add(f'<line x1="{x0}" y1="{Y(R.TOP+33)}" x2="{x0}" y2="{Y(R.TOP+33+75)}" stroke="#333" stroke-width="3"/>')
add(f'<line x1="{x0}" y1="{Y(0)}" x2="{x0}" y2="{Y(-62)}" stroke="#444" stroke-width="3"/>')
add(f'<rect x="{X(-20)}" y="{Y(-62)}" width="{40*sc}" height="{80*sc}" fill="#b0b0b0" stroke="#222"/>')
add(f'<line x1="{X(-60)}" y1="{Y(0)}" x2="{X(-60)}" y2="{Y(-130)}" stroke="#555" stroke-width="2.5"/>')
add(f'<polygon points="{X(-60)-9},{Y(-130)} {X(-60)+9},{Y(-130)} {X(-60)},{Y(-150)}" fill="#555"/>')
add(f'<line x1="30" y1="{Y(70)}" x2="365" y2="{Y(70)}" stroke="#185FA5" stroke-dasharray="6 4"/>')
text(330, Y(70) - 4, "waterline", 10.5, 400, "end", "#185FA5")
def tag(n, x, y):
    add(f'<circle cx="{x}" cy="{y}" r="9" fill="var(--text)"/><text x="{x}" y="{y+4}" font-size="11" font-weight="700" text-anchor="middle" fill="var(--bg)">{n}</text>')
tag(1, x0 + 22, Y(R.TOP + 70)); tag(2, X(-40), Y(R.FLOOR + 100)); tag(3, X(-110), Y(120)); tag(4, X(32), Y(-30)); tag(5, X(-90), Y(-110))
for i, s in enumerate(["1  Lid, SMA antenna bulkhead, antenna", "2  Electronics housing (4.4 in ID × 5 in), O-ring face seal + tape",
                       "3  Printed float: sealed chambers, 1154 g, no foam", "4  Sensor pod: flooded + dry chamber", "5  Mooring line to anchor or tether; ballast TBD"]):
    text(30, 704 + i * 15, s, 10.5, 400, "start", "var(--muted)")
# ---- housing frame
frame(400, 80, 750, 570, "ELECTRONICS HOUSING (sealed)", "#1f4e79")
box(420, 120, 160, 70, "Battery: 2× Li D cells", ["primary, battery-only", "model TBD (SCO-163)"], "t")
box(595, 120, 90, 70, "Divider 2:1", ["battery volts", "→ A7"])
box(420, 225, 200, 70, "Rail regulation", ["Rev A bench: PID 6106 + LiPo → 5 V", "D-cell build: TBD, no charging"], "t")
box(420, 335, 200, 70, "Sensor power gates", ["MOSFET, Feather D11", "polarity TBD (SCO-186)"], "c")
box(470, 520, 215, 100, "Hydrophone audio electronics", ["Rev B, projected", "gate on A3 (TBD)"], "t")
box(705, 120, 210, 55, "Leak sensor (not yet fitted)", ["internal temp + humidity"], "t")
box(705, 195, 190, 285, "Feather M0 (SAMD21)", ["MCU + 3.3 V regulator", "wake · sample · log · transmit", "", "D12 1-Wire · A1 turbidity", "A3 audio gate (TBD)", "D11 gate · A7 battery", "D10 SD CS", "D5 RTC INT (no wire yet)", "D8 CS · D4 RST · D3 INT", "", "arduino-samd core,", "RadioHead RH_RF95"], "n")
box(935, 120, 190, 100, "RFM95 LoRa radio", ["915 MHz · BW 500 kHz", "SF12 · CR 4/8 · +11 dBm", "daily 30 B packet, blind", "repeats, never ACKed"])
box(935, 250, 190, 70, "SMA bulkhead + antenna", ["in the lid, ≤ 2.15 dBi", "no raw audio over LoRa"])
box(935, 360, 190, 110, "Adalogger FeatherWing", ["microSD: CSV log + /AUDIO/", "PCF8523 RTC, UTC", "Pulled by hand for audio"])
box(935, 510, 190, 90, "Analog front end", ["SEN0189 → 0–3.3 V", "non-inverting (SCO-47)"], "t")
# ---- pod frame
frame(400, 680, 750, 150, "SENSOR POD + EXTERNAL (flooded, below the float)", "#555")
box(420, 705, 220, 100, "Hydrophone element", ["Aquarian — part TBD", "H2a-XLR vs H2dM (SCO-8)", "cable to housing, gland"], "c")
box(655, 705, 210, 100, "DS18B20 probe", ["waterproof, external", "1-Wire, 4.7 kΩ pull-up", "to 3.3 V"])
box(880, 705, 245, 100, "SEN0189 turbidity", ["in the pod, 5 V sensor, analog", "epoxy-potted leads", "higher ADC count = clearer"])
# ---- environment
box(650, 960, 480, 56, "Seawater", ["temperature, turbidity, biofouling"])
box(420, 960, 210, 56, "Underwater sound", ["reef biophony, boats"])
box(1160, 960, 150, 56, "Waves + current", ["mooring loads"])
# ---- shore
frame(1260, 80, 500, 700, "SHORE STATION (wall powered)", "#2c6b4f")
box(1285, 115, 210, 60, "Antenna", ["915 MHz"])
box(1285, 205, 210, 70, "LoRa receiver", ["separate LoRa module"])
box(1285, 305, 210, 85, "Base MCU", ["Feather S3 (facts, 2026-09-24)", "vs Raspberry Pi (shore doc)"], "c")
box(1285, 420, 210, 85, "Validate + decode", ["CRC, 30 B contract", "dedupe (buoy_id, record_seq)"])
box(1285, 535, 210, 70, "CSV store", ["append-only, UTC"])
box(1285, 635, 210, 60, "Wall power", ["USB-C charging = stretch"], "t")
box(1520, 420, 220, 100, "Analytics pipeline", ["acoustic indices (ACI, BI,", "NDSI, H, ADI), telemetry QC,", "NOAA CRW heat stress (DHW)"])
box(1520, 560, 220, 75, "Static dashboard", ["GitHub Pages, per publish"])
box(1520, 305, 220, 85, "Wi-Fi / internet", ["publish to GitHub Pages"])
box(1285, 710, 455, 52, "People", ["dashboard viewers · team · advisors · NOAA contact"])
# ---- conflicts
add('<rect x="1260" y="800" width="500" height="262" rx="6" fill="var(--card)" stroke="#b3261e" stroke-width="1.6" stroke-dasharray="6 4"/>')
text(1510, 818, "Conflicts and gaps to fix on the next pass", 12.5, 600, "middle")
import textwrap
conf = ["Power: 2× lithium D cells decided (solar dropped 2026-10-07). Rev A bench is LiPo + PID 6106. ADR-0002 not yet superseded; D-cell regulation undefined.",
        "Sensor gate polarity: firmware HIGH = on, SCO-186 wants P-FET LOW = on.",
        "Temp pin D5 on the schematic vs D12 in firmware; RTC wake INT has no wire.",
        "Shore compute: Feather S3 + LoRa module vs Raspberry Pi.",
        "Hydrophone part number (SCO-8); audio path A3 not defined.",
        "Pod attachment to the float and ballast material undecided.",
        "Leak sensor and SMA bulkhead not yet built.",
        "Anchored vs tethered mooring depends on permits (SCO-185)."]
yy = 840
for i, c in enumerate(conf, 1):
    for j, ln in enumerate(textwrap.wrap(c, 86)):
        text(1274, yy, (f"{i}  " if j == 0 else "    ") + ln, 10.5, 400, "start", "var(--muted)"); yy += 14
    yy += 5
# ---- arrows
arrow([(500, 190), (500, 225)], "pw", "cell V", 506, 212)
arrow([(580, 155), (595, 155)], "pw")
arrow([(640, 190), (640, 215), (705, 215)], "sg", "A7", 668, 210)
arrow([(620, 260), (665, 260), (665, 280), (705, 280)], "pw", "5 V rail", 628, 252)
arrow([(520, 295), (520, 335)], "pw", "5 V", 526, 320)
arrow([(705, 370), (620, 370)], "sg", "D11 gate", 662, 364, anchor="middle")
arrow([(440, 405), (440, 680)], "pw", "switched sensor power", 446, 470)
arrow([(800, 175), (800, 195)], "sg", "I²C (TBD)", 808, 190)
arrow([(895, 230), (915, 230), (915, 170), (935, 170)], "sg", "SPI", 902, 222, anchor="end")
arrow([(1030, 220), (1030, 250)], "sg", "RF", 1038, 240)
arrow([(895, 420), (935, 420)], "dt", "stack", 915, 414, anchor="middle")
arrow([(685, 580), (730, 580), (730, 480)], "sg", "A3", 690, 574)
arrow([(790, 705), (790, 480)], "sg", "D12 1-Wire", 796, 660)
arrow([(1002, 705), (1002, 600)], "sg", "analog out", 1010, 660)
arrow([(935, 555), (860, 555), (860, 480)], "sg", "A1", 866, 548)
arrow([(530, 705), (530, 620)], "sg", "audio", 536, 660)
arrow([(1125, 285), (1205, 285), (1205, 145), (1285, 145)], "dt", "LoRa 915 MHz", 1156, 276)
arrow([(1390, 175), (1390, 205)], "dt"); arrow([(1390, 275), (1390, 305)], "dt")
arrow([(1390, 390), (1390, 420)], "dt"); arrow([(1390, 505), (1390, 535)], "dt")
arrow([(1495, 570), (1520, 470)], "dt"); arrow([(1630, 520), (1630, 560)], "dt")
arrow([(1495, 345), (1520, 345)], "dt"); arrow([(1630, 635), (1630, 710)], "dt", "view", 1638, 680)
arrow([(1285, 665), (1272, 665), (1272, 347), (1285, 347)], "pw", "5 V", 1276, 500)
arrow([(790, 960), (790, 805)], "ml", "temperature", 796, 880)
arrow([(1002, 960), (1002, 805)], "ml", "turbidity", 1010, 880)
arrow([(530, 960), (530, 805)], "ml", "sound", 536, 880)
arrow([(300, 400), (400, 400)], "ml", None, dash=True)
arrow([(300, 580), (400, 705)], "ml", None, dash=True)
# ---- legend
box(20, 800, 355, 245, "Legend", [], "n")
for i, (k, t) in enumerate([("pw", "Power (label = voltage or rail)"), ("sg", "Signal / bus (label = pin or protocol)"), ("dt", "Data / radio link"), ("ml", "Mechanical or environmental")]):
    add(f'<line x1="40" y1="{842+i*22}" x2="90" y2="{842+i*22}" stroke="{C[k]}" stroke-width="2.5" marker-end="url(#a-{k})"/>'); text(100, 846 + i * 22, t, 11)
add(f'<rect x="40" y="936" width="50" height="16" rx="3" fill="none" stroke="{C["tbd"]}" stroke-width="1.6" stroke-dasharray="6 4"/>'); text(100, 949, "Undecided (TBD)", 11)
add(f'<rect x="40" y="960" width="50" height="16" rx="3" fill="none" stroke="#b3261e" stroke-width="1.6" stroke-dasharray="6 4"/>'); text(100, 973, "Sources disagree (see conflicts)", 11)
text(40, 1002, "Sources: facts.md, firmware config.h, shore-station.md,", 10, 400, "start", "var(--muted)")
text(40, 1016, "buoy-stability printed-float STEP. Voltages and pins", 10, 400, "start", "var(--muted)")
text(40, 1030, "marked TBD are not settled. Owner: John (SCO-187).", 10, 400, "start", "var(--muted)")
defs = "".join(f'<marker id="a-{k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9z" fill="{C[k]}"/></marker>' for k in C)
style = ('<style>:root{--bg:#ffffff;--card:#f6f5f1;--text:#1f1f1d;--muted:#5f5e5a;--float:#d9d2c3;--hous:#9db8d2}'
         '@media (prefers-color-scheme: dark){:root{--bg:#1c1c1a;--card:#2a2a28;--text:#f1efe8;--muted:#b4b2a9;--float:#5a564b;--hous:#3c5a78}}'
         'text{font-family:system-ui,-apple-system,Segoe UI,sans-serif}</style>')
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {Hh}" width="{W}" height="{Hh}"><title>S.C.O.U.T. system block diagram (draft 2026-10-14)</title>{style}<defs>{defs}</defs><rect width="{W}" height="{Hh}" fill="var(--bg)"/>' + "".join(o) + "</svg>"
open(ROOT / "assets/diagrams/system-block-diagram-2026-10-14.svg", "w").write(svg)
print(len(svg) // 1024, "KB")
