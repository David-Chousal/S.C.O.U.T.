"""Inline the three.js library and data/*.json into viewer-template.html -> buoy-viewer.html.

The result is one self-contained file (no network requests), the same pattern as the stability explorer,
so it can be opened from disk or dropped into the site as-is.

    python3 build_viewer.py
"""

import json
from pathlib import Path

HERE = Path(__file__).parent
ORDER = ["float-regular", "float-mushroom", "assembly-v6", "assembly-v7"]  # picker order, same as MODELS


def main() -> None:
    models = [json.loads((HERE / "data" / f"{i}.json").read_text(encoding="utf-8")) for i in ORDER]
    html = (HERE / "viewer-template.html").read_text(encoding="utf-8")
    subs = {"/*THREE*/": (HERE / "vendor" / "three.min.js").read_text(encoding="utf-8"),
            "/*CONTROLS*/": (HERE / "vendor" / "OrbitControls.js").read_text(encoding="utf-8"),
            "/*MODELS*/": json.dumps(models, separators=(",", ":"))}
    for token, text in subs.items():
        assert html.count(token) == 1, token
        html = html.replace(token, text.replace("</script", "<\\/script"))
    out = HERE / "buoy-viewer.html"
    out.write_text(html, encoding="utf-8")
    print(f"{out.name}: {out.stat().st_size / 1e6:.2f} MB, {len(models)} models")


if __name__ == "__main__":
    main()
