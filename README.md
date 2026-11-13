# THE WHITE TRAIL

A 2D side-scrolling pixel-art detective mystery. Crow's Hollow, Rocky Mountains, winter 1892.

This repository contains **two chapters, played as one continuous game**:

- **I. The first night.** Silas Vance arrives at Blackwood Station and walks into Crow's Hollow. He meets Constable Finch, takes Room 4 at the Black Ram Hotel, hears the 02:15 scream, and finds Sheriff Nathaniel Hale's body at the old sawmill. He then decides what happened to Hale, or leaves the question open.
- **II. Deceit and Isolation.** The second day follows straight on from the first night's end card. It visits Rusk's store and its account book, the chapel and Reverend Vale, an opened grave, and the telegraph tower with Ada Bell. It ends with a second case, *What is the Pale Order doing now?*, and supper with Finch at dusk.

The first night's outcome carries into the second day. A full playthrough takes about 30–50 minutes. The game plays on desktop (keyboard and mouse) and in mobile browsers held sideways (touch).

Built with vanilla JavaScript (ES modules), HTML5 Canvas 2D and the Web Audio API. There are no runtime dependencies, no build step and no network assets (Playwright is a development-only dependency for the tests).

## Running it

The game uses native ES modules, so browsers will not load it from `file://`. Serve the folder over http instead.

**Windows:** double-click `start.bat`. It starts a local server and opens `http://localhost:8080`.

**Any OS (Node.js 18 or newer):**

```bash
node tools/serve.mjs
```

Then open <http://localhost:8080> in a desktop browser (Chrome, Edge or Firefox), or from a phone on the same network at `http://<this computer's address>:8080` (see "Phones and tablets" below).

Any other static file server also works if you run it from this folder, for example `python -m http.server 8080` or `npx serve`.

Click or press any key on the title screen. Browsers only allow audio to start after a user gesture. Headphones are recommended.

## Controls

| Key | Action |
|---|---|
| `A` / `D` or `←` / `→` | Walk |
| `E` (or `Enter`) | Examine, speak, open, continue dialogue |
| `F` | Light or shutter the lantern |
| `Tab` (or `J`) | Notebook / case file |
| `I` | Inventory (read the telegram, inspect the revolver) |
| `Esc` | Pause, or close a panel (works during dialogue too) |
| `1`–`5` or `↑` / `↓` + `E` | Choose a dialogue option |
| `Alt` + `Enter` | Toggle fullscreen (also in Pause → Settings) |

Inside the notebook, `←` / `→` switch tabs, `↑` / `↓` choose an entry, and `E` marks records to compare on the **Deductions** tab.

### Phones and tablets

Open the game in a mobile browser (Chrome on Android, Safari on iOS) and hold the device **sideways**; in portrait it waits behind a "turn your device" prompt, exactly where you left it. Touch controls appear by themselves:

| On screen | Does |
|---|---|
| ◀ ▶ (bottom-left, hold) | Walk. Or tap the ground to walk there, or tap a person or clue to go to it and use it |
| The magnifier button (bottom-right) | Examine, speak, open: it is labelled with what it will do |
| Lantern, ? | Light or shutter the lantern; ask for a hint (it glows when one has come to mind) |
| Notebook, Inventory, Map, ≡ (top-right) | The three panels and the pause menu |
| Tap the dialogue / a choice / a menu line | Continue, choose, confirm |
| In the notebook | Tap a tab; tap a line to select it, tap it again to use it (mark, choose a reading); ▲ ▼ scroll; Next question, Review case, Back |
| ◀ ▲ ▼ ▶, OK, Back | In menus and the case review |

On Android the first tap of a visit also asks for fullscreen and a landscape lock, where the browser allows it. iPhone Safari has no fullscreen for pages; add the game to the Home Screen for the most screen space. Settings → **Touch controls** can force them on or off.

The game is fully playable with the keyboard. The mouse is optional: click something (the cursor changes over it) to walk to it and use it, click empty ground to walk there, click dialogue to continue, click a choice to pick it. There is no jump and no combat in this chapter.

## Saving

Progress is saved automatically to `localStorage` at checkpoints: entering a scene, recording evidence, forming a deduction, and story beats. **Continue** on the title screen resumes from the last checkpoint. **New investigation** (title screen), or **Pause → Restart from the beginning**, wipes the save and starts again from the train.

## Display

The game's native resolution is **480×270** and it scales to fill the browser window. The 16:9 ratio is always kept and the image is never stretched; any leftover space becomes black bars, and the frame stays centred. At 1920×1080 (device pixels) the frame is an exact 4×.

- **Fill window** (default): uses whole-pixel scaling of 480×270 whenever that fills at least 90% of the window. Otherwise the frame is upscaled with nearest-neighbour to a whole multiple and smoothly downscaled once to the exact fit. That fills the window while keeping pixel edges sharp.
- **Whole pixels**: always uses the largest whole multiple of 480×270. This is the crispest option but can leave wide borders.

The existing art is authored at the original 320×180 density and is shown at exactly 1.5 native pixels per art pixel, so the camera frames the same part of the world as before. See `src/engine/display.js` for the coordinate spaces, and NOTES.md §9 for details.

Choose between them in Pause → Settings → Display scaling. Resizing the window and entering or leaving fullscreen rescale the game immediately.

## Settings

Pause → Settings has volume sliders (master / ambience / effects, with footsteps and interaction sub-mixes / music), text speed (including instant), *reduce camera motion* (disables the framing zoom), and optional vignette and scanlines (both off by default).

## Tests

```bash
npm install   # once; installs @playwright/test and uses your installed Microsoft Edge
npm test      # data validation + unit tests + Playwright browser tests
```

`node tools/validate.mjs` (also `npm run validate`) checks the data's integrity: every dialogue node, script, evidence ID, deduction pair, scene exit/spawn, item and sprite reference resolves, including the scenes built from Tiled maps. It also covers the state-model rules (no duplicate evidence, revolver 3/6, serialization). The Playwright suite covers startup, movement, interactions (including both full playthroughs), resizing, UI, audio, the Tiled loader and deterministic screenshots. See [docs/TESTING.md](docs/TESTING.md).

To run the automated playthrough in the browser, open the game and enter this in the developer console:

```js
(await import('/tools/harness.js')).install();
T.fullRun();                                      // ~27 checks, kind-to-Finch branch
T.fullRun({ finchKind: false, examineAll: false }); // guarded branch, minimal evidence
```

`T.fullRun()` drives the real input path from the train to the end card and returns PASS/FAIL lines. **It overwrites your save.**

## Project layout

## Asset and level workflow

Art is made in **Pixelorama** (sources in `assets/source/pixelorama/`, PNG exports in `assets/export/`), levels in **Tiled** (`assets/levels/*.tmj`), sound in **Audacity** (sources in `assets/source/audacity/`, Ogg exports in `assets/export/audio/`). All of them use the central palette in `src/data/palette.js` (exported for editors to `assets/palette/`). Nothing needs building: save or export, then refresh the browser.

- [docs/ASSET_PIPELINE.md](docs/ASSET_PIPELINE.md): directories, palette (Lospec), Pixelorama sprite sheet and tileset conventions
- [docs/TILED_LEVELS.md](docs/TILED_LEVELS.md): creating and updating a level in Tiled, with the object and property reference
- [docs/AUDIO.md](docs/AUDIO.md): buses, volume, transitions, adding Audacity exports
- [docs/TESTING.md](docs/TESTING.md): test commands, deterministic mode, screenshot baselines

The first Tiled location is the Black Ram Hotel exterior. Open it directly with <http://localhost:8080/?scene=BLACK_RAM_EXTERIOR>. It is not linked into the story yet.

```text
index.html            entry page (shows a clear message if opened from file://)
start.bat             Windows launcher
package.json          npm scripts (start, test, validate, palette…); dev dependency: @playwright/test
assets/levels/        Tiled project, maps (.tmj) and tilesets (.tsj)
assets/palette/       generated palette files for the editors (.gpl / .hex / .png)
assets/sprites/       sprites.json — original palette-string pixel art (Silas, cast, props)
src/main.js           bootstrap, focus/visibility pause
src/engine/           loop (fixed 60 Hz), display (480×270 native, resolution constants + scaling + zoom compositor),
                      camera (exploration / investigation / dialogue framing), input, assets, game
src/systems/          storyState (flags, conditions, effects), dialogue runner, cutscene runner,
                      save, survival (lantern, warmth, revolver stub)
src/world/            scenes (data), painters (procedural pixel-art backgrounds), props,
                      lighting, weather, paint primitives
src/data/             evidence, dialogue, scripts (authored beats), notebook data
src/ui/               HUD, dialogue view, notebook, menus
src/world/tiled/      Tiled map loader: tiledMap.js (map → scene data), tiledRender.js (layers), levels.js / levelList.js (registry)
src/data/palette.js   the central 64-colour palette
src/audio/            Web Audio soundscape (synthesised) + samples.js (recorded Audacity exports, optional)
tools/                serve.mjs (static server), validate.mjs (data tests), harness.js (browser test driver),
                      palette.mjs (palette export/audit), make-demo-level.mjs (Black Ram map bootstrap)
tests/                unit/ (node --test), e2e/ (Playwright specs and screenshot baselines)
docs/                 workflow documentation
```

See `NOTES.md` for what is implemented, what was tested, known limitations, and the story assumptions that need the design owner's decision.
