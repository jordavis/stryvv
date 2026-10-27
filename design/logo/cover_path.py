"""Print the wordmark as one compact SVG path, for the design system cover
(components/Cover/preview.html), where it is inlined so it takes the theme's ink colour."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glyphs

w = glyphs.wordmark().simplify(0.2)
x0, y0, x1, y1 = w.bounds
rings = []
for p in getattr(w, 'geoms', [w]):
    for ring in [p.exterior, *p.interiors]:
        rings.append('M' + 'L'.join(f'{x - x0:.1f},{y - y0:.1f}' for x, y in list(ring.coords)[:-1]) + 'Z')
d = ''.join(rings).replace('.0,', ',').replace('.0L', 'L').replace('.0Z', 'Z')
print(json.dumps({'viewBox': f'0 0 {x1 - x0:.1f} {y1 - y0:.1f}', 'd': d}))
