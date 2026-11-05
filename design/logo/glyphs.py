"""Custom Stryvv wordmark, drawn from primitives in reference-pixel units (y down).
x-height 80..207 (127 px), main stroke 36, horizontals 32-33, corner radius 4."""
from shapely.geometry import Point, Polygon, box
from shapely.ops import unary_union
from shapely import affinity

RES = 64
def disk(x, y, r): return Point(x, y).buffer(r, quad_segs=RES)
def fillet(cx, cy, r, quadrant):
    """Ink that fills a concave corner; (cx, cy) is the fillet's circle centre.
    quadrant: which side of the centre the corner is on, e.g. (+1, +1) = down-right."""
    qx, qy = quadrant
    sq = box(min(cx, cx + qx * r), min(cy, cy + qy * r), max(cx, cx + qx * r), max(cy, cy + qy * r))
    return sq.difference(disk(cx, cy, r))

def soften(g, r=4.0, inner=1.5):
    """Round convex corners by r, concave corners by inner."""
    g = g.buffer(-r, quad_segs=RES).buffer(r, quad_segs=RES)
    if inner: g = g.buffer(inner, quad_segs=RES).buffer(-inner, quad_segs=RES)
    return g

def s():
    ink = unary_union([box(66, 80, 127, 113), disk(66, 120, 40), box(66, 127, 96, 160),
                       disk(96, 167, 40), box(27, 174, 96, 207)])
    upper = unary_union([box(70, 113, 300, 127), disk(70, 120, 7)])
    lower = unary_union([box(-100, 160, 90, 174), disk(90, 167, 7)])
    return ink.difference(upper).difference(lower)

def t():
    stem = box(150, 38, 186, 167)
    bar = box(134, 82, 223, 113)
    foot = box(190, 174, 223, 207)
    curve = disk(190, 167, 40).intersection(box(150, 167, 190, 207)).difference(box(186, 150, 191, 174))
    return unary_union([stem, bar, foot, curve, fillet(200, 160, 14, (-1, +1))])

def r():
    stem = box(232, 82, 268, 206)
    arm = disk(295, 129, 48).intersection(box(268, 81, 303, 153)).difference(disk(303, 153, 40))
    return unary_union([stem, arm])

def y():
    u = unary_union([box(311, 82, 431, 157), disk(361, 157, 50).intersection(box(300, 157, 420, 220))])
    u = u.difference(unary_union([box(346, 0, 395, 147.5), disk(370.5, 147.5, 24.5)]))
    stem = box(395, 82, 431, 202)
    hook = disk(366, 202, 65).intersection(box(366, 202, 431, 267)).difference(box(0, 0, 395, 230))
    term = box(329, 230, 366, 267)
    return unary_union([u, stem, hook, term, fillet(365, 200, 30, (+1, +1))])

def v(cx=504.5):
    outer = Polygon([(cx - 67, 82), (cx + 67, 82), (cx + 19.5, 206), (cx - 19.5, 206)])
    inner = Polygon([(cx - 27 - 0.37 * 20, 62), (cx + 27 + 0.37 * 20, 62), (cx, 155)])
    return outer.difference(inner)

def vv():
    # the two v's share their top edge, so they are drawn and softened as one shape
    # a short bridge keeps the join solid, so rounding doesn't nick it
    return unary_union([v(), v(504.5 + 130), box(565, 82, 574, 93).intersection(
        Polygon([(560, 82), (579, 82), (569.5, 106)]))])

# letter, concave-corner radius
LETTERS = {'s': (s, 1.5), 't': (t, 1.5), 'r': (r, 1.5), 'y': (y, 5), 'vv': (vv, 2)}
TRACKING = 4  # px added after each letter, opened from the reference so it holds up small

def wordmark(shifts=None, r_corner=4.0, tracking=TRACKING):
    """Union of softened letters; shifts = extra per-letter x offsets (ref px)."""
    shifts = shifts or {}
    parts = [affinity.translate(soften(f(), r_corner, inner), i * tracking + shifts.get(k, 0), 0)
             for i, (k, (f, inner)) in enumerate(LETTERS.items())]
    return unary_union(parts).buffer(0.6, quad_segs=RES).buffer(-0.6, quad_segs=RES)

def to_path(g, sx=1.0, dx=0.0, dy=0.0):
    geoms = getattr(g, 'geoms', [g])
    out = []
    for p in geoms:
        for ring in [p.exterior, *p.interiors]:
            c = list(ring.coords)[:-1]
            out.append('M' + 'L'.join(f'{(x - dx) * sx:.2f},{(y - dy) * sx:.2f}' for x, y in c) + 'Z')
    return ''.join(out)
