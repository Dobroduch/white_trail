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
| `chapter2` | the second day played straight on from the first night's end card for four combinations of outcomes (each first-night outcome visibly colouring the day), nothing lost or replayed, a save on the first night's end card resuming there, a mid-chapter save, the first night's people and beats absent by day; captures in `test-results/review/ch2-endcard-*.png` |
| `mobile` | (mobile projects only) see below |
| `case` | case 1 (Sheriff Hale) played to every outcome: the true account with and without the hidden wheel pit, both wrong accounts, and leaving it open; the review never ranks accounts and refuses an unsupported commitment; the pit entrance is absent until known (furrow closer look, or Mrs. Gable); hints (delay, request-only, pause / hidden tab, reset); People and Mind map pages; reload mid-investigation; saves from the previous build (`tests/e2e/fixtures/save-v1-*.json`); lantern only in hand while lit; Silas's speaker styling; the Road sign; the night sky. Review captures go to `test-results/review/` |

## Mobile (landscape, touch only)

`tests/e2e/mobile.spec.mjs` runs in three **mobile projects** (`playwright.config.mjs`); the desktop project
(`msedge`) runs everything else:

| Project | Emulates | Viewport (CSS px, landscape) | DPR |
|---|---|---|---|
| `mobile-android-small` | a small Android phone | 640×360 | 2 |
| `mobile-android-large` | a large Android phone | 915×412 | 2.625 |
| `mobile-iphone` | an iPhone-sized phone (iOS Safari user agent) | 844×390 | 3 |

Each uses Playwright device emulation (`isMobile`, `hasTouch`, the device pixel ratio), so `(pointer: coarse)`
matches, the touch controls switch on by themselves, and taps / holds are real touch events (Playwright's
touchscreen, or raw CDP `Input.dispatchTouchEvent` for several fingers at once). The spec covers fit and safe-area
layout (native 270 px height, aspect kept, no scroll, every button ≥ 44 CSS px, inside the frame, not overlapping
another button, not covering Silas or the dialogue box); portrait → rotate prompt → landscape (play suspended, state
identical afterwards, controls laid out again); hold-to-walk, stop on release, a second finger while walking;
tapping dialogue and choices; the act button; Notebook / Inventory / Map / pause buttons and tapping the notebook's
tabs and lines; a scene transition; title → New investigation → save → reload → Continue, all by touch; **the
whole first chapter played touch only**, and **Chapter 2 played touch only** from the first night's end card to its own.

```bash
npx playwright test --project=mobile-iphone                 # one device
npx playwright test tests/e2e/mobile.spec.mjs               # all three
```

**Touch-only playthroughs.** `T.useTouch(true)` switches `tools/harness.js` to touch: every key the harness would
press is instead a real pointer event (`pointerType: 'touch'`) on the **visible** on-screen button for that action,
a tap on a dialogue choice / the dialogue text / a notebook tab or line on the canvas, or a held walk pad. An action
with no visible touch control is not faked: it is recorded in `T.touchMisses`, which the tests require to be empty.
So `T.useTouch(true); T.fullRun({...})` proves that every action the run needs exists on screen for a finger.

**What emulation does not prove.** These runs use the installed Edge (Chromium) with mobile emulation. They do not
exercise WebKit / iOS Safari, real browser toolbars collapsing, real notches and safe-area insets (the emulated
insets are 0), the Fullscreen and Screen Orientation APIs on a device, Web Audio unlock rules on iOS, real touch
latency, thermal behaviour or frame rate on phone GPUs. See NOTES.md §20 for what was and was not checked on
physical devices.

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
| `?dpr=N` | force the device pixel ratio (`0` = use the device's own) |
| `?touch=1` / `?touch=0` | force the touch controls on / off (default: on for coarse pointers and after the first touch) |
| `?hintDelay=N` | seconds of stuck play before the first hint can be asked for (`&hintFollowUp=N` for the follow-up; default half). Works without `test=1`, for playtesting |

In `?test=1` mode nothing moves until the test calls `TWT_TEST.step(n)` (n fixed 1/60 s steps, then a
render). Snowfall, wind gusts, fog drift, lantern flicker, fire, NPC idle animation and breath all depend
only on the step count and the seeded `Math.random`, so a frame is a pure function of
**(seed, steps, inputs, viewport)**. `tools/harness.js` (`T.walkTo`, `T.press`, `T.talkThrough`,
`T.fullRun`, `T.info`) is loaded by the tests and works the same way in the browser console.

`T.fullRun2()` plays Chapter 2 on from the first night's end card: `{ conclusion: 'C2_BLAST' | 'C2_WAR' | 'C2_RITE' | null, thorough }`. Both run by touch after `T.useTouch(true)`.

`T.fullRun()` takes `{ finchKind, examineAll, conclusion, pit }`: `conclusion` (`C_STAGED`, `C_TONIGHT`, `C_RITE`) forms the Hale
deductions, sets the readings and commits to it at the footbridge; without it the case is left open. `pit: true` climbs down into the
wheel pit. `T.deduce(a, b)` marks two key statements on the Deductions page; `T.decide(cid)` sets readings and commits in the case review.

The save fixtures were captured from the build before the case system (commit 32fb956) by playing `T.fullRun()` there and keeping the
saves it wrote; they must keep loading.

## Screenshot baselines

Baselines live in `tests/e2e/__screenshots__/<browser>-<platform>/`. They are compared with **zero
tolerance** (`maxDiffPixels: 0`), which only works because the frames are deterministic. They are tied to
the browser and OS (text rendering and GPU differ), so a different machine may need its own baselines.

```bash
npm run test:visual:update      # (re)create baselines after an intended visual change
```

Review the new PNGs before committing them. Note that `maxDiffPixels: 0` still uses Playwright's default per-pixel colour threshold (0.2), so a very dark, subtle change (the night-sky tint on the forecourt was one) can pass against an old baseline: after an intended change to dark scenes, regenerate those baselines explicitly (delete the PNG, then `--update-snapshots`). A failing comparison writes `*-actual.png` and
`*-diff.png` into `test-results/artifacts/`.

Add a scene to `SHOTS` in `tests/e2e/visual.spec.mjs` to cover it.
