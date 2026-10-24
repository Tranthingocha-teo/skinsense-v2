# Builds the SkinSense monogram SVGs from Newsreader glyph outlines (no font needed at render time)
# and rasterizes the app icon, Android adaptive layers, splash, web favicon and Open Graph image.
# Usage: python3 build.py /path/to/Newsreader[opsz,wght].ttf   (needs fontTools + rsvg-convert)
import subprocess, sys
from pathlib import Path
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = Path(__file__).parent
REPO = HERE.parents[3]
MOBILE = REPO / "apps/mobile/assets/images"
WEB = REPO / "apps/web/src/app"

CLAY, CREAM, INK, MUTED = "#a7694c", "#f9f7f2", "#25221d", "#625d55"

font = instantiateVariableFont(TTFont(sys.argv[1]), {"wght": 600, "opsz": 24})
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()


def text(s, x, baseline, size, fill):
    k = size / font["head"].unitsPerEm
    parts, adv = [], 0
    for ch in s:
        g = glyphs[cmap[ord(ch)]]
        pen = SVGPathPen(glyphs)
        g.draw(pen)
        parts.append(f'<path transform="translate({adv} 0)" d="{pen.getCommands()}"/>')
        adv += g.width
    svg = f'<g fill="{fill}" transform="translate({x} {baseline}) scale({k} {-k})">{"".join(parts)}</g>'
    return svg, adv * k


def mark(cx, cy, height, fill):
    """Serif S centred on (cx, cy) plus one tap-marked spot at its upper right."""
    b = BoundsPen(glyphs)
    glyphs["S"].draw(b)
    x0, y0, x1, y1 = b.bounds
    k = height / (y1 - y0)
    pen = SVGPathPen(glyphs)
    glyphs["S"].draw(pen)
    s = height / 600
    return (
        f'<path fill="{fill}" transform="translate({cx - (x0 + x1) / 2 * k} {cy + (y0 + y1) / 2 * k}) scale({k} {-k})" d="{pen.getCommands()}"/>'
        f'<circle fill="{fill}" cx="{cx + 262 * s}" cy="{cy - 250 * s}" r="{40 * s}"/>'
    )


def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>\n'


def write(name, content, pngs=()):
    path = HERE / name
    path.write_text(content)
    for out, size in pngs:
        w, h = size
        subprocess.run(["rsvg-convert", "-w", str(w), "-h", str(h), "-o", str(out), str(path)], check=True)


icon = svg(1024, 1024, f'<rect width="1024" height="1024" rx="228" fill="{CLAY}"/>' + mark(512, 512, 600, CREAM))
write("icon.svg", icon, [(MOBILE / "icon.png", (1024, 1024))])
(WEB / "icon.svg").write_text(icon)
# Adaptive icon: the launcher masks to ~66% of the canvas, so the mark stays inside that circle.
write("android-foreground.svg", svg(1024, 1024, mark(512, 512, 420, CREAM)), [(MOBILE / "android-icon-foreground.png", (1024, 1024))])
write("android-monochrome.svg", svg(1024, 1024, mark(512, 512, 420, "#ffffff")), [(MOBILE / "android-icon-monochrome.png", (1024, 1024))])
write("splash.svg", svg(1024, 1024, mark(512, 512, 600, CLAY)), [(MOBILE / "splash-icon.png", (1024, 1024))])

title, _ = text("SkinSense", 430, 318, 112, INK)
tagline = "Nhật ký da riêng tư, mỗi đêm một ảnh."
_, width = text(tagline, 0, 0, 40, MUTED)
line, _ = text(tagline, 434, 398, min(40, 40 * 680 / width), MUTED)
og = svg(1200, 630, f'<rect width="1200" height="630" fill="{CREAM}"/>'
         f'<rect x="120" y="195" width="240" height="240" rx="54" fill="{CLAY}"/>' + mark(240, 315, 140, CREAM) + title + line)
write("og.svg", og, [(WEB / "opengraph-image.png", (1200, 630))])
