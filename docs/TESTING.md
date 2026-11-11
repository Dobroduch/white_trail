# Testing

```bash
npm install            # once: installs @playwright/test (uses your installed Microsoft Edge)
npm test               # everything: data validation, unit tests, browser tests
```

| Command | What it runs |
|---|---|
| `npm run validate` | `tools/validate.mjs`: every cross-reference in the story data, **including Tiled maps** |
| `npm run test:unit` | `node --test tests/unit/`: Tiled conversion, palette and PNG codec |
| `npm run test:e2e` | Playwright, `tests/e2e/*.spec.mjs` |
| `npx playwright test tests/e2e/ui.spec.mjs` | one spec file |
| `npx playwright test --ui` | Playwright's interactive runner |
| `npx playwright show-report test-results/report` | HTML report of the last run (with traces of failures) |

## Browser

By default the tests run headless in the **installed Microsoft Edge**, which is found automatically,
including Edge's newer `EdgeCore\<version>` layout, so Playwright doesn't need to download a browser.
Alternatives:

```bash
PW_CHANNEL=chrome npx playwright test                                  # installed Google Chrome
npx playwright install chromium && PW_CHANNEL=chromium npx playwright test   # Playwright's own Chromium (CI/Linux)
PW_EXECUTABLE="C:/path/to/msedge.exe" npx playwright test              # explicit binary
```

(In PowerShell, set variables with `$env:PW_CHANNEL='chrome'` first.)

The game is served by `tools/serve.mjs` on port 8094 (`PW_PORT`), started automatically.

## What the suite covers

| Spec | Covers |
|---|---|
| `startup` | boot without console or asset errors; title → New investigation via the real keyboard and real-time loop; the `file://` explanation |
| `movement` | real-time A/D walking; exact walk speed and camera follow (fixed step); bounds and edge exits |
| `interactions` | Tiled interactables, phase variants and lights, zone event, door into the parlor; evidence recording; **both full scripted playthroughs** (`T.fullRun`) as the regression test for all existing content |
| `resize` | 7 window sizes (fit, aspect, no scrollbars, no stretch), exact 4× at 1920×1080, live resizing, and the pointer round trip |
| `ui` | pause (freezes dialogue), settings (persisted, drives the audio buses), notebook, inventory and map panels, dialogue choices |
| `audio` | bus routing; recorded sfx, ambience and music with crossfades (generated WAVs); missing-file fallback |
| `tiled` | layers built from the map, parallax, night layers, hot reload, broken-map isolation |
| `visual` | deterministic frames (same seed ⇒ identical pixels across loads; real time doesn't matter) and screenshot baselines |

## Deterministic mode (for screenshots and exact tests)

URL parameters (see [`src/engine/testMode.js`](../src/engine/testMode.js)):

| Parameter | Effect |
|---|---|
| `?test=1` | seeds `Math.random` (seed 1), **stops the real-time loop**, disables auto-pause on blur |
| `&seed=N` | another seed |
| `&live=1` | with `test=1`: keep the real-time loop (seeded but not frame-exact) |
| `?scene=ID` | start directly in a scene with the opening done (works without `test=1`) |
| `&phase=NIGHT`, `&spawn=key` | story phase and spawn for `?scene` |
| `?nopause=1` | don't auto-pause on blur (for real-time tests) |
| `?dpr=N` | force the device pixel ratio |

In `?test=1` mode nothing moves until the test calls `TWT_TEST.step(n)` (n fixed 1/60 s steps, then a
render). Snowfall, wind gusts, fog drift, lantern flicker, fire, NPC idle animation and breath all depend
only on the step count and the seeded `Math.random`, so a frame is a pure function of
**(seed, steps, inputs, viewport)**. `tools/harness.js` (`T.walkTo`, `T.press`, `T.talkThrough`,
`T.fullRun`, `T.info`) is loaded by the tests and works the same way in the browser console.

## Screenshot baselines

Baselines live in `tests/e2e/__screenshots__/<browser>-<platform>/`. They are compared with **zero
tolerance** (`maxDiffPixels: 0`), which only works because the frames are deterministic. They are tied to
the browser and OS (text rendering and GPU differ), so a different machine may need its own baselines.

```bash
npm run test:visual:update      # (re)create baselines after an intended visual change
```

Review the new PNGs before committing them. A failing comparison writes `*-actual.png` and
`*-diff.png` into `test-results/artifacts/`.

Add a scene to `SHOTS` in `tests/e2e/visual.spec.mjs` to cover it.
