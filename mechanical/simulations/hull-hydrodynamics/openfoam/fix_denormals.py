"""Zero denormal numbers (for example -1.6e-312) in the newest saved time of every processor directory.

OpenFOAM writes them in ASCII but cannot read them back, which breaks a restart. Run before every resume.
Usage: python3 fix_denormals.py CASE_DIR
"""
import re, sys, glob, os
case = sys.argv[1]
pat = re.compile(rb"-?\d+(?:\.\d+)?[eE]-(?:30[89]|3[1-9]\d)\b")
total = 0
for proc in sorted(glob.glob(f"{case}/processor*")):
    times = [d for d in os.listdir(proc) if re.fullmatch(r"[0-9.eE+-]+", d)]
    if not times: continue
    latest = max(times, key=float)
    for dirpath, _, files in os.walk(f"{proc}/{latest}"):
        for f in files:
            p = os.path.join(dirpath, f)
            data = open(p, "rb").read()
            if b"format      binary" in data[:600] or b"format binary" in data[:600]: continue
            new, n = pat.subn(b"0", data)
            if n: open(p, "wb").write(new); total += n
print(f"fix_denormals: {total} denormal values zeroed in {case}")
