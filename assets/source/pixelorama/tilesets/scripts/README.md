# Tileset scripts

`tilesets.gd` paints the Tiled tilesets: 16×16 tiles, 8 columns, no margin and no spacing, using
only colours from the central palette (`src/data/palette.js`). `sheet("black_ram_exterior")` returns
the 128×80 Black Ram Hotel exterior tileset used by `assets/levels/black_ram_exterior.tmj`.

**Tile order is fixed.** Tiled stores tiles by index, so a tile may be repainted but never moved.
Add new tiles at the end of `NAMES` (a new row) and their painter, then re-open the tileset in Tiled
so it picks up the new image height.

| index | tiles |
|---|---|
| 0–8 | wall, wall_shadow (under the porch), roof, roof_snow, beam (porch roof with icicles), boardwalk, boardwalk_edge, snow_top (ground crust at native y 224), snow_fill |
| 9–12 | win_tl/tr/bl/br: a whole 32×32 window (casing, panes, snowy sill), opaque so it sits on either wall |
| 13–16 | winlit_*: only the glowing panes of that window, for the Tiled `glow` layer |
| 17–22 | door_tl … door_br: the 32×48 front door with a warm transom |
| 23–28 | sign_0 … sign_5: the 96×16 "BLACK RAM HOTEL" board |
| 29–39 | post, chimney, chimney_top, lamp_top (unlit glass), lamp_pole, lamp_glow (flame, glow layer), rail, drift, wall_end_l, wall_end_r, shadow |

Tiles that repeat are seamless with themselves: horizontally, and vertically for the ones that stack
(wall: log courses of 5 + 5 + 6 px; post; lamp pole; chimney: 4 px brick rows).

## Running it

Open `assets/source/pixelorama/tilesets/black_ram_exterior.pxo` in Pixelorama and run this through the
MCP `eval_gdscript` tool, with params
`{ path: ".../tilesets/scripts/tilesets.gd" }`:

```gdscript
func run(api, image, project, params):
	var s = GDScript.new()
	s.source_code = FileAccess.get_file_as_string(params.path)
	s.reload()
	return s.new().sheet("black_ram_exterior")
```

Then save the project and export a 1× PNG to `assets/export/tilesets/black_ram_exterior.png`, and check it:

```bash
node tools/palette.mjs --check --strict assets/export/tilesets/black_ram_exterior.png
```

Hand edits in Pixelorama are fine too. The script is just how the current version was painted. If you
repaint by hand, the `.pxo` becomes the source of truth and re-running the script would overwrite
your edits.

**Known Pixelorama quirk:** a canvas made with *New* (or the MCP `create_canvas`) can start with a
1×1 cel, so script output, imports and exports silently collapse to one pixel. Run the script on a
project opened from a `.pxo` file instead (this one, or a copy of it), which loads its cels at full size.

## Sawmill tileset (`sawmill_exterior`)

Painted by `tools/make-sawmill-tileset.mjs` (Node, palette colours only, 16×16, 8 columns), not by
`tilesets.gd`: `node tools/make-sawmill-tileset.mjs` writes `assets/export/tilesets/sawmill_exterior.png`, the Tiled
tileset `assets/levels/tilesets/sawmill_exterior.tsj` (every tile has a `name` property) and
`tools/data/sawmill_tiles.json` (name → index). `assets/source/pixelorama/tilesets/sawmill_exterior.pxo` is that image
imported into Pixelorama for hand editing; once you edit it by hand, the `.pxo` is the source of truth and re-running the
script would overwrite your work. Tile order is fixed (add new tiles at the end). Big pieces (the waterwheel, the log on
the carriage, the blade, the cordwood stack, the sign, the rope) are drawn once and sliced into tiles named
`wheel_<row>_<col>` and so on; place them in Tiled as a rectangle of those tiles.

The map `assets/levels/old_sawmill.tmj` was built once by `tools/make-sawmill-level.mjs` and is now edited in Tiled.
It uses this tileset plus the Black Ram tileset's snow tiles, so both places share one snow.

**Importing a PNG into a `.pxo`:** the 1×1-cel quirk above also hits `import_image`. What works: open an existing good `.pxo`
(for example `black_ram_exterior.pxo`), run `eval_gdscript` that loads the PNG and *returns* the `Image` (the canvas resizes
to fit), then `save_project` with the new path and compare an `export_image` against the PNG. The original `.pxo` on disk is
untouched.

## Station tileset (`station_exterior`)

Same approach as the sawmill set: `node tools/make-station-tileset.mjs` (helpers shared in `tools/lib/tilekit.mjs`) writes
`assets/export/tilesets/station_exterior.png`, the Tiled tileset and `tools/data/station_tiles.json`;
`station_exterior.pxo` is that image imported into Pixelorama (round trip verified pixel-identical). It holds the pitched
snow roof (`roof_slope_<a>`: one tile per rise, 3 px per tile; right-hand slopes are the same tiles flipped horizontally in
Tiled), `eave_icicles`, the BLACKWOOD sign, TEL plate, timetable board, freight, `bank_top_*`/`rails` for the track bed,
and the telegraph pole. The station map also uses the Black Ram tileset's wall, windows, door, lamp, chimney, deck boards
and snow. `assets/levels/blackwood_station.tmj` was built once by `tools/make-station-level.mjs` and is now edited in Tiled;
the telegraph wires are an image layer (`assets/export/levels/station_wires.png`, written by that script).

## Main Street tileset (`main_street_exterior`)

`node tools/make-main-street-tileset.mjs` writes `main_street_exterior.png`, the Tiled tileset and `tools/data/main_street_tiles.json`;
`main_street_exterior.pxo` is that image imported into Pixelorama (round trip verified pixel-identical). It holds clapboard siding
for the false-front store, the RUSK GEN'L STORE board, the cracked shop window, dark plank doors, the barred woodshed door and
window, rutted street snow and footprints, porch posts. `assets/levels/main_street.tmj` (built once by
`tools/make-main-street-level.mjs`, now edited in Tiled) combines four tilesets: Black Ram (logs, windows, lamp, boardwalk,
snow), station (the pitched snow roof), sawmill (fence, barrel, crate, planks, cordwood) and this one. The watcher prop takes its
window position from the map (prop `args` = top-left of the lit pane in world units), so moving the window means editing that
property in Tiled.
