# Quality gates

Run these after every new chapter, and before every push that changes play. A gate passes only with the evidence
named beside it: a command's result, a test run, or a measurement. Never mark one from memory.

Serve the game for the manual and perf steps with `node tools/serve.mjs 8094` (Playwright starts it by itself).

## 1. Data
- [ ] `node tools/validate.mjs` reports 0 errors (every cross-reference between maps, dialogue, scripts, evidence,
      deductions, sprites and items).
- [ ] `node tools/palette.mjs --check <new exported PNGs>`: 0 off-palette pixels in the new art.
      (The full `--strict` check still fails on older assets that were off-palette before; see NOTES.)

## 2. Stability and progression
- [ ] Every chapter has a full-run harness (`T.fullRun`, `fullRun2` … `fullRunN`) and a spec that plays it for
      each case outcome, with optional finds included and skipped (`tests/e2e/chapterN.spec.mjs`).
- [ ] `tests/e2e/robustness.spec.mjs`, "every checkpoint … resumes into a playable state": extend its playthrough
      to the newest chapter. No checkpoint may resume into a state where Silas cannot move.
- [ ] No runtime errors: every spec ends with `expectClean` (console errors and `TWT.errorsSeen`).

## 3. Saves
- [ ] A save in the middle of the new chapter and on its end card reloads into the same place and state (per
      chapter spec).
- [ ] An unreadable, malformed or outdated save is set aside under `thewhitetrail.save.v1.unreadable`, never
      deleted, and the player is asked before a new game (`robustness.spec.mjs`).
- [ ] New state fields have defaults in `newState()` (older saves gain them through `migrateCaseState`).

## 4. Mobile (landscape, touch only)
- [ ] `tests/e2e/mobile.spec.mjs` passes on all three phone projects (small Android 640×360, large Android 915×412,
      iPhone-sized 844×390), including a touch-only playthrough of the newest chapter with no `touchMisses`.
- [ ] `tests/e2e/layout.spec.mjs` passes at its four sizes: no text off screen, past its panel, or over other text,
      through every chapter, the notebook, the menus and the end cards. Add any new panel or end card to its list.
- [ ] Look at the review captures in `test-results/review/` for the new chapter (end cards, mobile end cards).

## 5. Performance
- [ ] `node tools/perf.mjs --label <name>`: 60 fps median in every scenario; at 4× CPU throttling no more than 1%
      of frames over 33 ms. Compare against the last recorded run in `test-results/perf/`.
- [ ] `node tools/perf-profile.mjs --scene <heaviest new scene>`: the heap after GC does not grow over the
      60-second walk (more than ~0.5 MB of steady growth is a leak to find).
- [ ] New per-frame work (props, lights, HUD) does not show in the profile's top ten unless it is drawing.

## 6. Regression
- [ ] `npx playwright test`: every test passes (the full suite, all projects).
- [ ] NOTES.md has a section for the chapter: what was added, what changed, what is not done, and what the tests
      cover.

## Not covered by automation (say so in the report rather than claiming it)
- Real phones: Safari on iPhone and Chrome on Android hardware (the mobile projects are Chromium emulation with an
  iPhone user agent; WebKit is not installed).
- Firefox and WebKit: desktop Firefox is installed here, but Playwright drives only its own patched builds
  (`npx playwright install firefox webkit`, a download not yet made), so the suite runs in Edge (Chromium) only.
- Real audio output, real fullscreen and orientation lock, a phone call or screen lock interrupting play.
- Frame rate on a real high-refresh or low-end display (`perf.mjs` throttles a desktop CPU; it is a stand-in).
