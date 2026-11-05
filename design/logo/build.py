"""Stryvv lockup: traced heart mark + the custom wordmark in glyphs.py, as SVG and PNG.

Usage: python build.py ['{"gap": 0.26}'] [out-dir]   (see README.md)"""
import json, os, sys
import numpy as np, cv2
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import glyphs

TEAL, NAVY, WHITE = '#1f7a8c', '#0b2545', '#ffffff'
cfg = dict(height=0.86, gap=0.26, baseline=0.755, pad=0.10, shifts={})
if len(sys.argv) > 1: cfg.update(json.loads(sys.argv[1]))
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'out')
os.makedirs(out, exist_ok=True)

# heart: traced from the original artwork, cropped from the old public/logo-green.png (1400x973)
heart = Image.open(os.path.join(HERE, 'source', 'heart.png')); HW, HH = heart.size
alpha = np.array(heart)[:, :, 3]; up = 4
bw = cv2.threshold(cv2.resize(alpha, (HW * up, HH * up), interpolation=cv2.INTER_CUBIC), 127, 255, cv2.THRESH_BINARY)[1]
contours, _ = cv2.findContours(bw, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
def smooth(c, k=9):
    p = c[:, 0, :].astype(float); ker = np.ones(k) / k
    return np.stack([np.convolve(np.r_[p[-k:, i], p[:, i], p[:k, i]], ker, 'same')[k:-k] for i in (0, 1)], 1)
heart_polys = [cv2.approxPolyDP(smooth(c).astype(np.float32).reshape(-1, 1, 2), 0.35 * up, True)[:, 0, :] / up
               for c in contours if cv2.contourArea(c) >= 50 * up * up]
def poly_d(polys, dx=0, dy=0):
    return ''.join('M' + 'L'.join(f'{x + dx:.1f},{y + dy:.1f}' for x, y in p) + 'Z' for p in polys)

# wordmark geometry in reference px: t top 38, baseline 207, descender 267
word = glyphs.wordmark(cfg['shifts'])
x0, y0, x1, y1 = word.bounds
s = cfg['height'] * HH / (y1 - y0)
pad = round(cfg['pad'] * HH)
hx, hy = pad, pad
wx = hx + HW + cfg['gap'] * HH
base = hy + cfg['baseline'] * HH
wy = base - 207 * s                      # canvas y of reference y=0
W = round(wx + (x1 - x0) * s + pad)
H = round(max(hy + HH, wy + y1 * s) + pad)

def word_d(ox, oy, sc):
    return glyphs.to_path(word, sc, x0 - ox / sc, -oy / sc)
heart_d = poly_d(heart_polys, hx, hy)
def svg(body, w, h):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Stryvv">{body}</svg>\n'
def lockup(words):
    return svg(f'<path fill="{TEAL}" fill-rule="evenodd" d="{heart_d}"/><path fill="{words}" fill-rule="evenodd" d="{word_d(wx, wy, s)}"/>', W, H)
for name, col in [('navy', NAVY), ('teal', TEAL), ('on-dark', WHITE)]:
    open(f'{out}/stryvv-logo-{name}.svg', 'w').write(lockup(col))
mp = round(0.06 * HH)
open(f'{out}/stryvv-mark-teal.svg', 'w').write(svg(f'<path fill="{TEAL}" fill-rule="evenodd" d="{poly_d(heart_polys, mp, mp)}"/>', HW + 2 * mp, HH + 2 * mp))
# wordmark alone, 1000 px tall
ws = 1000 / (y1 - y0); wp = 0
for name, col in [('navy', NAVY), ('teal', TEAL), ('white', WHITE)]:
    open(f'{out}/stryvv-wordmark-{name}.svg', 'w').write(svg(f'<path fill="{col}" fill-rule="evenodd" d="{word_d(0, -y0 * ws, ws)}"/>', round((x1 - x0) * ws), 1000))

# PNGs: original heart raster + supersampled wordmark
def raster_word(scale, ox, oy, w, h, ss=4):
    m = Image.new('L', (w * ss, h * ss), 0); d = ImageDraw.Draw(m)
    T = lambda pts: [((x - x0) * scale * ss + ox * ss, (y * scale + oy) * ss) for x, y in pts]
    for p in getattr(word, 'geoms', [word]):
        d.polygon(T(p.exterior.coords), fill=255)
        for i in p.interiors: d.polygon(T(i.coords), fill=0)
    return m.resize((w, h), Image.LANCZOS)
mask = raster_word(s, wx, wy, W, H)
for name, col in [('navy', NAVY), ('teal', TEAL), ('on-dark', WHITE)]:
    img = Image.new('RGBA', (W, H), tuple(int(col[i:i + 2], 16) for i in (1, 3, 5)) + (0,)); img.putalpha(mask)
    img.alpha_composite(heart, (hx, hy)); img.save(f'{out}/stryvv-logo-{name}.png', optimize=True)
print(out, W, H, 'scale', round(s, 3))
