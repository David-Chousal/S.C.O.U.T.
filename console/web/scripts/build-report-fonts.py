"""Cut the static TTF weights the report PDF needs from the console's variable WOFF2 fonts.

react-pdf cannot pick a weight inside a variable font, so Download PDF registers these static
instances instead (SCO-317). Both families are under the SIL Open Font License 1.1 with no
Reserved Font Name; the licence files are copied alongside. Needs fontTools and brotli:

    pip3 install --user fonttools brotli
    python3 scripts/build-report-fonts.py
"""

from pathlib import Path
import shutil

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = Path(__file__).resolve().parent.parent
SOURCE = HERE / "src" / "app" / "fonts"
OUT = HERE / "public" / "fonts" / "report"
WEIGHTS = {"dmsans": [400, 500, 700], "jetbrainsmono": [400, 500]}
FAMILY = {"dmsans": "DM Sans", "jetbrainsmono": "JetBrains Mono"}
STYLE = {400: "Regular", 500: "Medium", 700: "Bold"}


def rename(font: TTFont, family: str, weight: int) -> None:
    """Give each instance its own style and PostScript name, so a PDF never merges two weights."""
    style = STYLE[weight]
    names = {1: FAMILY[family], 2: style, 4: f"{FAMILY[family]} {style}", 6: f"{FAMILY[family].replace(' ', '')}-{style}",
             16: FAMILY[family], 17: style}
    for record in list(font["name"].names):
        if record.nameID in names:
            record.string = names[record.nameID]


def instance(family: str, weight: int) -> Path:
    font = TTFont(SOURCE / f"{family}-latin.woff2")
    axes = {"wght": weight}
    if any(axis.axisTag == "opsz" for axis in font["fvar"].axes):
        axes["opsz"] = 14
    static = instantiateVariableFont(font, axes, updateFontNames=False)
    static.flavor = None
    rename(static, family, weight)
    target = OUT / f"{family}-{weight}.ttf"
    static.save(target)
    return target


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for family, weights in WEIGHTS.items():
        for weight in weights:
            target = instance(family, weight)
            print(f"{target.relative_to(HERE)}  {target.stat().st_size // 1024} KiB")
    for licence in ("ofl-dm-sans.txt", "ofl-jetbrains-mono.txt"):
        shutil.copy(SOURCE / licence, OUT / licence)


if __name__ == "__main__":
    main()
