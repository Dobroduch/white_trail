# Making levels in Tiled

Tiled maps become ordinary scenes. Doors, exits, conditions, events, lights, weather, ambience,
saving and the notebook all work exactly as they do for the hand-written scenes in
`src/world/scenes.js`. The first example is the **Black Ram Hotel exterior**
(`assets/levels/black_ram_exterior.tmj`).

Requires **Tiled 1.10 or newer** (<https://www.mapeditor.org>).

## Quick start: see the example

1. Run `npm start` (or `start.bat`).
2. Open <http://localhost:8080/?scene=BLACK_RAM_EXTERIOR>. Add `&phase=NIGHT` for the night version.
3. In Tiled: *File ▸ Open File or Project* ▸ `assets/levels/the-white-trail.tiled-project`, then open
   `black_ram_exterior.tmj` from the Project panel.

## The opening-chapter exteriors (in the story)

Walking order: STATION → ROAD → **VILLAGE** (Crow's Hollow Main Street, `main_street.tmj`) →
**BLACK_RAM_EXTERIOR** (the hotel forecourt) → PARLOR (the hotel, through the door once Finch has been met) and,
at night only, east from the forecourt → CREEK → SAWMILL. STATION, VILLAGE, BLACK_RAM_EXTERIOR and SAWMILL exist only as Tiled
maps; `scenes.js` holds the other scenes and the links to them. STATION, VILLAGE and SAWMILL are tile-built (Pass 2: `tools/make-*-level.mjs` built each map once, Tiled owns it now);
the hotel forecourt is the original Black Ram map.

## Update an existing level

1. Edit the map in Tiled and save (Ctrl+S). The `.tmj` is what the game loads, so there's no export step.
2. In the browser, either refresh the page, or keep playing and run this in the dev console:

   ```js
   await TWT.levels.reload()     // re-fetches the current level's map, tilesets and images
   ```

3. If the level didn't change, check the console. Every problem is logged with a `[tiled]` prefix,
   and a map that fails to load is skipped without breaking the rest of the game.
4. Run `npm run validate`. It converts every map exactly as the game does and checks that doors and exits
   lead to real scenes and spawns, that dialogue, evidence and script ids exist, that tileset and image
   files exist, and that no tile index is out of range.

To repaint tiles, edit the Pixelorama source and export over the tileset PNG (see
[ASSET_PIPELINE.md §4.2](ASSET_PIPELINE.md)), then reload as above.

## Create a new level

1. **New map** (*File ▸ New ▸ New Map*):
   - Orientation *Orthogonal*, tile layer format **CSV**, render order *Right Down*.
   - Map size **fixed** (not Infinite). Width = scene width in world units × 1.5 ÷ 16 tiles
     (for example, a 640-unit scene is 960 px = 60 tiles). Height **17 tiles** (272 px; only the top 270 px are shown).
   - Tile size **16×16**.
   - Save it as `assets/levels/<name>.tmj` (*JSON map files*).
2. **Tileset**: *Map ▸ Add External Tileset* to reuse one from `assets/levels/tilesets/`. For a new one,
   use *File ▸ New ▸ New Tileset* (Based on Tileset Image, 16×16, margin 0, spacing 0) with the PNG from
   `assets/export/tilesets/`, and save it as JSON (`.tsj`) in `assets/levels/tilesets/`.
   **Don't use `.tsx` (XML) tilesets**: the game reads JSON only.
3. **Layers** (bottom to top, see "Layers" below): parallax image layers, then tile layers for the
   playfield, then `glow` layers, then one object layer, then foreground.
4. **Objects**: add a **`spawn`** (required), a **`bounds`** rectangle, optionally a **`ground`**
   polyline, and the doors, exits, interactables, lights and so on (see "Objects" below). The project
   file defines these classes, so pick them from the *Class* dropdown and their properties appear
   ready to fill.
5. **Map properties** (*Map ▸ Map Properties*): `name`, `ambience`, `darkness`, weather, and the rest
   (see "Map properties" below).
6. **Register** the level with one line in [`src/world/tiled/levelList.js`](../src/world/tiled/levelList.js):

   ```js
   { id: 'RUSK_STORE', url: 'assets/levels/rusk_store.tmj' },
   ```

   The `id` is the scene id used by doors and exits (`to: 'RUSK_STORE'`). It must not clash with a
   scene in `scenes.js`.
7. Open `http://localhost:8080/?scene=RUSK_STORE`, then run `npm run validate` and `npm test`.
8. To make it reachable in play, add a door or exit leading to it from an existing scene (in
   `scenes.js`, or as a `door` object in another Tiled map). If it's a new place on Silas's map, add it
   to `src/data/mapData.js` too.

## Units

Everything in Tiled is **native pixels** (1 Tiled px = 1 Pixelorama px). The game converts positions
to world units (÷ 1.5). The ground line used by the existing exteriors is **y = 225** px.

## Layers

| Role | Tiled layer | How it's set | Drawn |
|---|---|---|---|
| `back` | image or tile layer | parallax factor < 1, or property `role = back` | behind the playfield, scrolled at its parallax factor |
| `main` | tile or image layer | factor 1 (the default) | the playfield; all `main` layers merge into one image |
| `glow` | tile or image layer | property `role = glow` | emissive pixels (lit windows, lamps), drawn **after** the lighting pass so they stay bright; characters in front of them are cut out |
| `front` | image layer | parallax factor > 1, or `role = front` | in front of everything |

- **Parallax** is Tiled's own *Parallax Factor ▸ X* (layer properties). 0 is fixed (sky), 0.08 distant
  mountains, 0.3 to 0.5 far trees and roofs, 1 the playfield, 1.2 foreground. Tiled previews it when you
  pan, and the game uses the same value. Factors on a group multiply into its children.
- A `glow` layer with a factor other than 1 belongs to the nearest layer **below** it with the same factor
  (for example, the far town lights on the 0.5 rooftops layer).
- **Phase**: a layer with the custom property `phase = EVENING` or `phase = NIGHT` is drawn only in that
  phase. Use this for different skies or lit windows.
- **Opacity**, **visibility** and **offset** are respected. *Repeat X* on image layers tiles horizontally.
- Hidden layers are ignored, so you can keep reference or tracing layers in the map.
- Not supported (yet): tile animations (the first frame is drawn), tint colour, isometric maps,
  infinite maps, and the base64 or zlib tile formats.

## Objects

Set an object's **Class** (Tiled ≤ 1.8: *Type*). Positions: a point is used as-is; a rectangle or
ellipse uses its centre. Properties marked "native" are in pixels.

| Class | Name | Properties | Becomes |
|---|---|---|---|
| `spawn` | spawn key, e.g. `fromStreet` (**required**) | `facing` 1 / −1 | `spawns[name]` |
| `bounds` | — (rectangle) | — | walkable x-range. Walking into an edge triggers that side's exit |
| `ground` | — (polyline) | — | the ground profile Silas walks on (default: flat at map property `groundY`, else 225) |
| `exit` | — | `side` left/right (inferred from position if empty), `to`, `spawn`, `if`, `phase`, `blockedLines`, `blockedScript`, `scriptIf` (JSON `{"if":…,"script":"ID"}`: run the script instead of travelling) | scene-edge exit |
| `door` | door id | `label`, `verb` (Enter), `to`, `spawn`, `minutes` (1), `if`, `phase`, `blockedLines` | an "Enter — label" prompt at its x |
| `interactable` | object id | `label`, `lines`, `again`, `variants`, `evidence`, `dialogue`, `verb`, `important`, `warm`, `radius` (native), `if`, `phase` | an "Examine — label" prompt |
| `npc` | character id (`finch`, `gable`, …) | `label` (display name), `sprite`, `dialogue`, `facing`, `z`, `lantern`, `candle`, `if`, `phase` | a character. Must exist in story state `chars` |
| `light` | — | `r` radius (native, default 60, or the ellipse size), `warm` 0–1, `strength`, `phase` | a light pool. Untagged lights shine in both phases |
| `prop` | — | `propType` (a key of `PROP_FACTORIES` in `props.js`), `args` (JSON array), `id`, `if`, `phase` | a scripted prop (fire, steam, …) |
| `event` | event id (once per playthrough) | `script`, `bark`, `delay`, `do` (JSON effects), `if`, `phase` | a story event. As a **rectangle** it fires only while Silas is inside its x-range |

Text and JSON properties:

- `lines`, `again`, `blockedLines`: **one line of dialogue per line of text** (blank lines are ignored).
- `if`: a condition as JSON, in the same language as `scenes.js`, for example `{"flag":"metFinch"}`,
  `{"all":[{"phase":"NIGHT"},{"notItem":"WATCH"}]}`. `phase` is shorthand that is AND-ed with `if`.
- `variants`: JSON list such as `[{"if":{"phase":"NIGHT"},"lines":["…"]},{"if":{},"lines":["…"]}]`.
- `do`: JSON list of effects, for example `[{"set":{"sawSign":true}}]`.

Ids used here (`to`, `spawn`, `dialogue`, `evidence`, `script`, `sprite`) must exist in the game data.
`npm run validate` checks them.

## Map properties

| Property | Type | Meaning |
|---|---|---|
| `name` | string | location title shown in the HUD |
| `exterior` | bool | outdoors: snow footsteps, cold, door sounds between inside and out |
| `ambience` | string | ambience preset key (`village`, `parlor`, `creek`, …) or a recorded bed from the audio manifest |
| `music` | string | recorded music track id (crossfades in on entry; fades out when absent) |
| `darkness` | float | ambient darkness 0–1 |
| `ambient` | string | `warm` for interior darkness tint |
| `snow`, `wind`, `fog` | float | weather 0–1 (omit all three for none) |
| `surface` | string | footstep surface override (`wood`) |
| `painter` | string | keep this scene's existing painter for its art (layout-only map; no image/tile layers needed) |
| `travel` | int | minutes added to the clock when arriving |
| `groundY` | float | flat ground line in native px if there is no `ground` object |
| `night` | string (JSON) | overrides for the night phase, for example `{"darkness":0.84,"ambience":"village_night","weather":{"snow":0.9,"wind":0.85,"fog":0.4}}` |

## Troubleshooting

| Console message | Fix |
|---|---|
| `tileset "x.tsx" is XML` | Save the tileset as JSON (`.tsj`) or embed it in the map |
| `infinite maps are not supported` | Map Properties ▸ uncheck *Infinite* |
| `layer … is base64-encoded` | Map Properties ▸ Tile Layer Format ▸ CSV |
| `map is N px tall; it must be at least 270 px` | Resize the map to 17 rows of 16 px |
| `no spawn object` | Add a point with class `spawn` and a name |
| `could not load image …` | A tileset or image layer points to a file that isn't there (paths are relative to the `.tmj` / `.tsj`) |
| `unknown object class "…" was ignored` (warning) | Typo in the Class, or an editor-only object (fine) |
