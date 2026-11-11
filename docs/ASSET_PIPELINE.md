# Asset pipeline

How art and audio get from the editors into THE WHITE TRAIL. None of the editors is controlled by
scripts: you work in them by hand, save the **source** file, export a **standard format** into the
export folder, and the game loads the export. Nothing is compiled; refreshing the browser picks up
new exports (the dev server sends `Cache-Control: no-cache`).

| Tool | Source format (kept, editable) | Export format (loaded by the game) |
|---|---|---|
| Lospec | — | palette: `.gpl` / `.hex` |
| Pixelorama | `.pxo` in `assets/source/pixelorama/` | `.png` in `assets/export/` |
| Tiled | `.tmj` / `.tsj` in `assets/levels/` (JSON is both source and export) | the same files |
| Audacity | `.aup3` in `assets/source/audacity/` | `.ogg` (or `.wav`) in `assets/export/audio/` |

## 1. Directory structure

```text
assets/
  palette/                    generated from src/data/palette.js — import into editors, never edit
    the-white-trail.gpl         Pixelorama / GIMP / Aseprite / Lospec palette
    the-white-trail.hex         one hex per line (Lospec format)
    the-white-trail.png         1×64 swatch strip
  source/                     editable originals (commit these)
    pixelorama/
      characters/ environments/ items/ map/ ui/   existing .pxo files (+ scripts/*.gd painters)
      tilesets/                 .pxo for Tiled tilesets (new)
    audacity/
      ambience/ footsteps/ interaction/ music/    .aup3 projects (new)
  export/                     what the game loads (commit these too)
    characters/ environments/ items/ map/ ui/     existing PNG exports
    tilesets/                   tileset PNGs referenced by assets/levels/tilesets/*.tsj (new)
    audio/                      manifest.json + ambience/ footsteps/ interaction/ music/ (new)
  levels/                     Tiled: the-white-trail.tiled-project, *.tmj maps, tilesets/*.tsj
  sprites/sprites.json        legacy palette-string sprites (still the fallback for every character)
  draft/ backgrounds/ comparisons/   older work-in-progress material, unchanged
```

Rules:

- **One source file per export family**, same base name: `assets/source/pixelorama/tilesets/black_ram_exterior.pxo`
  → `assets/export/tilesets/black_ram_exterior.png`.
- File names are `lower_snake_case`. Never rename an export without updating what references it
  (the loaders log a clear console error naming the missing file, and the game falls back).
- Commit both source and export, so anyone can rebuild an export and the game runs from a clean checkout.

## 2. Resolution and density

- The game's native grid is **480×270** (`NATIVE`). **New art is authored at native density:
  1 image pixel = 1 native pixel.** Never pre-scale exports. Use 100% scale, no filtering, no interlacing.
- Gameplay coordinates are **world units** (1 unit = 1.5 native px; the camera frames 320×180 units).
  Tiled maps and Pixelorama exports stay in native pixels; the loaders convert.
- The visible height is always 270 native px. The visible width follows the window, from
  360 to 720 native px (4:3 to 2.67:1). So a background must cover **720 native px** of visible width,
  not 480.
- Ground line: in the existing exterior scenes, characters stand at **world y = 150 (native y = 225)**.

## 3. Palette (Lospec → Pixelorama)

The single source of truth is [`src/data/palette.js`](../src/data/palette.js): 64 colours in named ramps
(night, slate, haze, snow, wood, stone, light, brass, paper, blood). The core is the procedural
painters' original palette. The rest was sampled from the shipped exports, so the palette describes the
game as it already looks: these 64 colours cover 99.2% of all exported pixels within a small
perceptual tolerance.

**Use it in Pixelorama:** Palette panel ▸ *Import* ▸ `assets/palette/the-white-trail.gpl`. Draw only with
these colours. In Aseprite or GIMP, load the same `.gpl`.

**Changing the palette (using Lospec):**

1. Explore or compare on Lospec (<https://lospec.com/palette-list>). To get a candidate in, download it as
   *GIMP .gpl* or *HEX*.
2. Edit the ramps in `src/data/palette.js`, adding, replacing or renaming. Keep the existing `PAL`
   entries unless you mean to recolour the procedural backgrounds.
3. Run `npm run palette`. This rewrites the `.gpl`, `.hex` and `.png` files in `assets/palette/`.
4. Re-import the `.gpl` in Pixelorama.
5. `npm run test:unit` fails if the generated files drift out of sync with `palette.js`.

To publish the palette on Lospec, upload `assets/palette/the-white-trail.hex` (or the 1× swatch PNG).

**Auditing art:** `npm run palette:check` reports, for every PNG under `assets/export`, the share of
pixels that are exactly on the palette and the most common off-palette colours. Run it on specific
files, failing on any off-palette pixel, with:

```bash
node tools/palette.mjs --check --strict assets/export/tilesets/black_ram_exterior.png
```

Today most older exports are "near" but not exact, because baked lighting and dither introduced
in-between shades. That is expected. New tilesets and sprites should pass `--strict`.

Light and darkness are applied by the engine at runtime, so paint surface colours, not the lit result.
The exceptions are baked light layers (`light_evening.png`) and emissive layers (`glow_*.png`, lit
windows), which use the **light** ramp.

## 4. Pixelorama conventions

### 4.1 Character sprite sheets

Loaded by `NATIVE_SHEETS` in [`src/engine/assets.js`](../src/engine/assets.js).

- **One horizontal strip per character**, all frames the same size, no gaps:
  `assets/export/characters/<name>.png`.
- Frame size in native px. Existing sizes: adults 26–28×42 (Silas is 28×42), seated patrons 18×21.
- Draw facing **right**. The engine mirrors for left.
- **Feet on the bottom row** of the frame, which is where the ground line goes.
- `anchor` is the x (native px, from the left of the frame) of the body's centre of mass when facing right.
  It is used so that turning around doesn't make the body jump.
- Animations are **frame ranges in the strip**, named in the loader. Silas, for example, is
  `silas_idle: [0, 1], silas_walk: [2, 3, 4, 5]`. In Pixelorama, keep each animation as a tag with the same
  name as the sprite (`silas_walk`) so the source documents the frame ranges.
- Export: *File ▸ Export ▸ Spritesheet*, Horizontal, 1 row, all frames, scale 100%, no trim.
- Register a new sheet with one line in `NATIVE_SHEETS`:

  ```js
  { url: 'assets/export/characters/rusk.png', fw: 26, fh: 42, anchor: 11, sprites: { rusk_idle: [0, 1] } },
  ```

  An NPC whose `sprite` is `rusk_idle` then uses it. If the PNG is missing, the console says so and the
  legacy sprite (or a fallback silhouette) is drawn instead.

### 4.2 Tilesets (for Tiled)

- Tile size **16×16 native px**, laid out in a grid with **no margin and no spacing**. Example
  `black_ram_exterior.png` is 8 columns × 5 rows = 128×80.
- Canvas size = `columns × 16` by `rows × 16`. In Pixelorama, set *View ▸ Grid* to 16×16.
- Export the whole canvas as one PNG (*File ▸ Export ▸ PNG*, 100%) to `assets/export/tilesets/<name>.png`.
- Example: `assets/source/pixelorama/tilesets/black_ram_exterior.pxo`, painted by
  `tilesets/scripts/tilesets.gd` (see the README next to it for the tile index table).
- **Never move existing tiles.** Tiled stores tiles by index, so moving a tile changes every map that
  uses it. Add new tiles at the end (new rows), and repaint in place.
- Tiles that belong to the emissive layer (lit window panes, lamp flames) are separate tiles that
  contain **only** the glowing pixels, with everything else transparent. They go on a `glow` layer in
  Tiled (see [TILED_LEVELS.md](TILED_LEVELS.md)).
- After changing the PNG, the matching `.tsj` needs updating only if the image size changed. Re-open
  the tileset in Tiled (it detects the new size) and save.

### 4.3 Backgrounds and parallax layers

- Playfield layers are the **scene width × 1.5** native px wide (a 640-unit scene is 960 px) and
  270 px tall.
- Parallax layers must be at least `ceil((480 + (sceneWidth − 480) × factor + 2) × 1.5)` px wide, where
  `sceneWidth` is in world units and `factor` is the layer's parallax (0 = fixed sky, 1 = playfield).
  Narrower layers leave a gap at the scene's edge. The existing exports under
  `assets/export/environments/parallax/` already follow this. Reuse them as Tiled image layers.
- Foreground layers (factor > 1) must be wider than the scene. Use an image layer.
- Keep layers separate (sky, far, near, playfield, glow, front) so the engine can parallax and light
  them independently.

### 4.4 Animations of props

Animated props (fire, steam, train) are code in `src/world/props.js` and are deterministic in test
mode. Animated **tiles** in Tiled are not supported yet: the loader draws the first frame and warns.
For a looping animated object, make a sprite sheet (4.1) and a `prop` in code.

### 4.5 Items and UI

- Inventory icons: 48×48, `assets/export/items/inventory/<id>_inventory.png`. `tools/validate.mjs`
  checks the size.
- World items: `assets/export/items/world/<id>_world.png`.
- HUD icons: `assets/export/ui/hud_icons.png`. Map pieces: `assets/export/map/*.png` (300×168, see
  `src/data/mapData.js`).

## 5. Audio

See [AUDIO.md](AUDIO.md).
