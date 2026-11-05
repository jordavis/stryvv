# Stryvv logo sources

The scripts that draw the Stryvv logo. The published files live in the Logos group of the [Stryvv Design System](https://claude.ai/artifact/3YN9n22vGGKBZ3q1eZxVHj). `out/` holds the same files, rebuilt from these scripts.

- `glyphs.py`: the "stryvv" wordmark. It's custom lettering, not a font: each letter is built from circles, bars and polygons measured from Jordan's sketch, then given softly rounded corners. Change a letter here.
- `build.py`: the lockups. It traces the heart mark from `source/heart.png` and sets it beside the wordmark. It writes SVG and PNG files to `out/`.
- `cover_path.py`: prints the wordmark as one compact SVG path for the design system's cover (`components/Cover/preview.html`), where it's inlined so it takes the theme's ink colour.
- `source/heart.png`: the original heart artwork, cropped from the old `public/logo-green.png` (1400×973). Keep it: the heart is traced from it, never redrawn.

## Rebuild

```bash
python3 -m venv .venv && .venv/bin/pip install -r design/logo/requirements.txt
.venv/bin/python design/logo/build.py
```

Options go in as JSON (defaults in `build.py`): `height` (wordmark height relative to the heart), `gap` (space between heart and wordmark), `baseline`, `pad`, and `shifts` (extra x offset per letter key in `glyphs.LETTERS`). Letter spacing is `glyphs.TRACKING`.

## What it makes

| File | Use |
|---|---|
| `stryvv-logo-navy.svg/.png` | The main lockup: teal heart, `navy` (#0b2545) wordmark, on light grounds |
| `stryvv-logo-teal.svg/.png` | One colour, all `teal` (#1f7a8c) |
| `stryvv-logo-on-dark.svg/.png` | Teal heart, white wordmark, on `navy` and dark grounds |
| `stryvv-mark-teal.svg` | The heart alone |
| `stryvv-wordmark-navy/teal/white.svg` | The wordmark alone |

PNGs are 4367×1167. After a change, upload the new files to the design system's Logos group (same names), and update the cover's inlined path if the letters changed.
