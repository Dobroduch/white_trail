# THE WHITE TRAIL — Milestone 1 notes

Status as of 2026-11-11: first playable vertical slice, from the train arrival to the sawmill crime scene and an end-of-chapter card.

## 1. What is implemented

### Playable sequence (six scenes, seven rooms of play)
1. **Blackwood Station, 18:40.** The title fades in over a train arriving in the snow. The conductor steps down, then Silas, who reads the telegram as a short in-world document. The player can examine the waiting room, the freight, the telegraph office and the timetable (`PASS?`). The conductor's exchange is short and branching (pass closing, no return train promised). The road exit is gently gated until he has been spoken to. When the conversation ends he boards, the whistle sounds, and the train leaves. Isolation beat: *"And then it is only the wind."*
2. **The road.** Layered pines, fence, signpost, a rusted ore car, distant warm windows, gusting snow and fog. A tutorial hint introduces the lantern (`F`). The notice board on the road records the printed notice for Sheriff Hale; on a closer look Silas notices there is no mention of Clara.
3. **Crow's Hollow.** A resident watches from a lit window and draws the curtain as Silas passes. **Constable Finch** meets him under the Black Ram's porch. The conversation is a branching hub covering the sheriff, Clara, the telegram (which Silas can show him) and local talk. A closing tone choice (sympathetic vs. pressing) sets `chars.finch.trust`, and that changes what Finch says later in the parlor.
4. **Black Ram Hotel parlor.** Warm interior, with an animated fire, sconces and three silent patrons, whose murmur stops when Silas enters. **Mrs. Gable** stands behind the reception desk and assigns Room 4. Topics depend on evidence:
   - the floor in Room 4, available only after the boards have been examined, with a choice between asking plainly and saying nothing;
   - the register contradiction, available only after both the Room 4 statement and the register have been recorded.

   Finch stands by the fire with a branch-dependent follow-up. The register, photograph, fireplace (restores warmth) and corner table can be examined.
5. **Room 4.** The scrubbed floorboards are paler, with raised grain and dark residue only in the seams. There is no marker; a contextual prompt appears only when Silas stands at them. A second look reveals lye and blood. The wardrobe (smells of lye), washstand (basin scoured dull), window and bed can be examined. Using the bed offers an authored *"Turn in for the night"* choice.
6. **02:15.** Fade to *"Later."*, then a held `02:15` card, then the synthesized distant scream. Control returns in Room 4 at night. This is a one-time event guarded by flags and the `phase` value.
7. **Parlor at night.** Mrs. Gable comes down with a candle (an authored, one-time conversation) and unbolts the door.
8. **The creek path.** Fresh tracks to examine, ice and water, and a deadfall that blocks the bank, so the tracks lead the player to the footbridge.
9. **The old sawmill.** Silas discovers Sheriff Hale hung by the ankles from the waterwheel frame: the camera holds, a low bell and drone sting, then *"...Sheriff."* There are **seven independently inspectable clues**, each with an observation and a closer look:
   - the body;
   - the broken pocket watch (collected);
   - the cavalry-pattern boot impressions in the sheltered sawdust;
   - the half-burned **Pale Order** ledger (collected);
   - the rope and the scored beam;
   - the cuts in the post;
   - the furrow up from the creek.

   After four are recorded, the closing beat plays: a lantern appears on the ridge, swings once, and goes dark. *"Somebody watched me find him."* Leaving by the footbridge then shows the end card, which summarizes recorded details, statements, deductions and the open questions. From there the player can keep investigating or return to the title.

### Systems
- **Rendering.** Native resolution **480×270** (originally 320×180; see §9), scaled by whole numbers and letterboxed, with nearest-neighbour filtering. Render passes are separate: parallax backgrounds → depth-sorted props and characters → snow and fog → lighting (darkness with banded light pools, then additive warm glow) → emissive windows and lamps → foreground snow → composite → UI.
- **Adaptive camera.** Exploration (wide, look-ahead), investigation (zoom ×1.14 between Silas and the object), and dialogue (×1.28 between the speakers), plus authored overrides in cutscenes. Zoom is shimmer-free: the frame is first upscaled crisply by a whole number, and only then cropped with bilinear sampling. The camera position is snapped to the native (480×270) pixel grid. *Reduce camera motion* turns the zoom off.
- **Evidence system.** Data-driven (`src/data/evidence.js`). Each record has:
  - a stable ID, title, category and location;
  - a direct `observed` text and an optional `detail` for the closer look;
  - an `interpretation`;
  - related people, places and evidence, plus tags.

  The discovery state is stored as `{observed, examined, n}`. Recording never duplicates, and examining again adds nothing.
- **Notebook (`Tab`).** Five tabs:
  - **Case:** the telegram, people (updated by story state), and a timeline stamped with in-game times;
  - **Evidence:** OBSERVED / CLOSER LOOK / INTERPRETATION, clearly separated;
  - **Statements:** what was said, and Silas's reading of it;
  - **Leads:** open questions only, never answers;
  - **Deductions:** mark two records to compare.

  There are three authored deductions:
  - *The scene was arranged:* body + furrow **or** body + rope — two separate evidence routes;
  - *The same counting:* marks + ledger;
  - *An unwritten guest:* Mrs. Gable's statement + register.

  A wrong pair gets *"The evidence does not establish that."* Each deduction states its limits ("What it does not tell me").
- **Dialogue.** Data-driven nodes with `branch`, `choices` (with `if` and `once`), `do` effects and `again` text for revisited hubs. The typewriter reveal can be skipped, choices are numbered, and Silas's unspoken observations appear in italics without a name tag. The box sits at the top of the screen so speakers and clues on the ground stay visible.
- **Story state** (`src/systems/storyState.js`). One explicit, serializable object:
  - flags, phase and clock;
  - per-character state (`trust`, `cooperation`, `alive`, …);
  - items, evidence, deductions;
  - completed events and the timeline;
  - a `consequences` record (shots fired and people killed both stay at 0).

  Conditions and effects form a small, testable language.
- **Cutscene/event runner.** Authored step lists live in `src/data/scripts.js`. Scene events are one-time per playthrough (`eventsDone`), with optional delays. Ambient scripts (barks, hints) never take control from the player.
- **Save.** `localStorage` checkpoints on scene entry, recorded evidence, deductions and story beats. Saves are versioned, merged onto a fresh default state, and characters recorded as dead stay dead. There is also **New investigation / Restart** and **Continue**.
- **Lantern.** Toggle with `F`. It gives a warm banded light pool and makes the darker clues readable. Important clues also have a faint ambient catch-light at night, so darkness alone never hides them. Oil consumption exists in code but is **disabled** (`LANTERN.oilPerMinute = 0`).
- **Warmth.** A slow, low-pressure value: it drains outdoors and recovers indoors, faster near the fire. Below 35, Silas shivers when idle and a small "cold" cue appears. There is no damage, no death and no hallucination link.
- **Revolver.** Exactly one firearm: 6 chambers with 3 loaded. It can be inspected in the inventory. **Firing is not implemented** (see the TODO in `src/systems/survival.js`).
- **Weather.** 340 pooled snow particles in three depth layers. They move with the camera at different parallax speeds, and the wind has noise-driven gusts. There is also ground fog and Silas's breath in the cold.
- **Audio** (Web Audio, all synthesised). It starts only after a user gesture.
  - Ambience: wind (filtered brown noise plus a whistling band), gusts, fire with crackles, room tone, the patrons' murmur (stops when Silas enters), water under ice, steam hiss, train rumble.
  - Effects: footsteps on snow and on wood, steam whistle chord, chuffs, doors, creaks, curtain, pen scratch for notes, page turns, a distant formant-synthesised scream with reverb.
  - Music: a sparse drone and a struck-bell sting.
  - Volume buses: master, ambience, effects and music.
- **UI and robustness.** Minimal HUD: the location/time label, a contextual `E` prompt, hints, barks, "Noted" toasts, and small lantern/cold cues. There are no bars, scores or markers. Pause works anywhere, including mid-dialogue. The game auto-pauses on blur or a hidden tab, suspending audio, and the fixed-step loop never fast-forwards after a stall. Resizing is handled, including by a per-frame size check. Missing assets produce clear console errors and fallback silhouettes. Opening the page via `file://` shows an explanation instead of failing silently.

## 2. Files

All files are new (the repository contained only the two design documents).

- `index.html`, `start.bat`, `README.md`, `NOTES.md`
- `assets/sprites/sprites.json`
- `src/main.js`
- `src/engine/`: `loop.js`, `display.js`, `camera.js`, `input.js`, `assets.js`, `rng.js`, `game.js`
- `src/systems/`: `storyState.js`, `dialogue.js`, `cutscene.js`, `save.js`, `survival.js`
- `src/world/`: `scenes.js`, `painters.js`, `props.js`, `paint.js`, `lighting.js`, `weather.js`
- `src/data/`: `evidence.js`, `dialogue.js`, `scripts.js`, `notebookData.js`
- `src/ui/`: `text.js`, `hud.js`, `dialogueView.js`, `notebook.js`, `menus.js`
- `src/audio/audio.js`
- `tools/`: `serve.mjs`, `validate.mjs`, `harness.js`
- `.claude/launch.json` (dev-server config used for testing)

## 3. Tests actually run, and their results

All runs were in Chromium (the Claude desktop browser pane) against `node tools/serve.mjs`.

| Test | Result |
|---|---|
| `node tools/validate.mjs`: 2,176 data-integrity and state-model checks | **0 errors** |
| `T.fullRun()` (kind to Finch, every clue examined): 27 checks, train → end card, using real input codes | **all PASS** |
| `T.fullRun({ finchKind: false, examineAll: false })` (guarded branch, minimal evidence): 27 checks, including "no deduction without its evidence" | **all PASS** |
| Manual stepping of each scene with screenshots: title, station, train arrival and departure, road with lantern, village and watcher, Finch meeting, parlor, Room 4, notebook tabs, deduction, 02:15 sequence, night parlor, night village, creek, sawmill discovery, ridge light, end card | Rendered as intended after fixes (see below) |
| Save → reload page → Continue (parlor; sawmill after the end) | Flags, evidence, deductions, items restored; no event replayed; train and conductor stay gone |
| Re-examining clues / re-entering scenes | No duplicate evidence (`evidenceCount` unchanged) |
| Title → Controls → New game (with save) → confirm; Pause mid-dialogue (typewriter frozen); Settings change persisted to `localStorage`; Inventory | Work |
| Resize 1280×720 → 960×540 → 1920×1080 | Integer scale 4 → 3 → 6, letterboxed, no overflow |
| Audio with a real click gesture: every sfx, every ambience preset, music, murmur, rumble | No exceptions; output measured with an AnalyserNode: silence 0.009 RMS, creek 0.088, parlor 0.065, scream 0.080, whistle 0.019 (before a later gain increase) |
| Missing sprite / missing sprite sheet | Clear console errors, fallback silhouette, game continues |
| Performance at scale 6 (1920×1080) | 0.3–1.3 ms per update+render frame across all scenes |
| Browser console during the full runs | No errors (`game.errorsSeen` empty) |

Bugs found and fixed during testing:
- The reception desk was invisible (missing `y` argument in its draw calls).
- The counter hid Mrs. Gable entirely, so it was lowered to hip height.
- The train braking curve had a very long tail.
- The dialogue box covered the speakers; it now sits at the top of the screen.
- Silas stood inside the conductor's sprite; he now keeps a conversational distance.
- The 3×5 sign font's "M" read as "N".
- The emulated resize fired no event; a per-frame size check was added.
- The time label jumped 12 minutes when stepping out of the hotel; doors now cost one minute.
- Ambient barks briefly froze movement.
- The ridge light drew over the foreground frame.
- The body hung too high and too dark to read.
- The timeline times were inconsistent with the clock.

### Not tested / caveats
- **Real-time feel in a visible window.** The test browser pane was hidden, so requestAnimationFrame was throttled. All play-testing stepped the same fixed 60 Hz simulation from a harness. Moment-to-moment feel (walk speed, camera easing, typewriter pacing) at a true 60 fps was not observed by a person.
- **Audio was not listened to.** Its content, balance and the convincingness of the scream are unverified by ear, and signal levels were checked only numerically.
- Only Chromium was tested; **Firefox and Safari were not**.
- No high-DPI device was tested; device-pixel-ratio handling was only exercised with `?dpr=1`.
- No accessibility review with assistive technology.

## 4. Known limitations and remaining work
- NPCs walk with a body bob rather than leg animation. Silas has idle (breathing) and four-frame walk animations.
- The art is original but deliberately economical: one sprite per character, procedural backgrounds, and no close-up/portrait art for evidence.
- After the ridge-light beat, leaving the sawmill always shows the end card; returning to the village is out of scope for this slice.
- There is no key remapping, gamepad or mouse support (mouse is optional per the spec).
- UI text is drawn with the system Georgia font, falling back to Times. It is rendered crisply at display resolution on pixel-grid panels; the world itself is strictly on its pixel grids (see §9). This was a legibility decision. A bitmap pixel font could replace it if the design owner prefers a pure-pixel UI.
- The location clock uses approximate per-route travel minutes.
- `window.TWT` (the game object) and the `?dpr=N` URL parameter are exposed for testing only.

## 5. Assumptions that need the design owner's decision

Nothing here resolves a Part IX question. Wherever a line needed a detail the GDD does not fix, I kept it noncommittal. Please review:

1. **Finch and the telegram (Q1).** Shown the telegram, Finch says *"That's my name on it… Then you'd best be careful who you show it to."* He neither claims nor denies sending it. This is compatible with every Q1 option, but it does deliberately seed doubt.
2. **Mrs. Gable and Room 4 (Q4).**
   - She says *"A guest took ill"*. Pressed on the register, she adds *"Not every guest wants his name in a book… Some of them pay for that."* This implies an unregistered guest. It may be a lie or a cover.
   - **It leans toward the "protected a guest" branch, so please confirm or adjust.**
   - The register showing no Room 4 guest for a fortnight is a new, small, invented detail.
3. **The scream at 02:15.** Its source is **not identified**; it is logged as an open lead. The GDD fixes when the scream happens but not who screamed. **Decision needed.**
4. **Fresh tracks on the creek path.** One person, moving fast toward the mill that night. **Whose tracks they are is undecided.**
5. **The lantern on the ridge.** A human lantern that swings once and goes dark. Its bearer is undecided. It fits the GDD's "lights on the ridge" as human deception.
6. **Hale's body (Q6).** The scene shows:
   - a coat torn at the side, with blood frozen long before tonight;
   - very little blood beneath him;
   - a rope hauled over the beam;
   - a furrow from the creek;
   - the watch dropped toward the water.

   The deduction is limited to "he did not die where he hangs; hands arranged this". **The murder method, the wound, who did it, and the exact time of death are not stated.** The "torn at the side" detail is a light invention, so please confirm it.
7. **The marks on the post and the ledger (Q7).** Silas reads the marks as *like counting*, and a deduction notes they resemble the ledger's tallies. The marks' meaning is left unread.
   - The ledger page reads "THE PALE ORDER — ACCTS." with dates from the 'seventies, consistent with the GDD's ~1872.
   - Why the ledger was at the scene is unexplained, and the text offers both "meant to burn" and "meant to be found".
8. **Cavalry-pattern boot prints.** These come from the GDD. No spur detail was added, since the GDD lists spurs as later Act IV evidence.
9. **Invented flavor, without plot weight:**
   - telegram wording;
   - the conductor's "three days, could be a week" and "silver town, once";
   - the timetable chalk "PASS?";
   - Mrs. Gable's "bolted at ten" and "mind the third stair";
   - the parlor photograph of a mine crew, with an unreadable plaque;
   - Rusk's store sign, with an account book visible through the window;
   - the anonymous watcher at a village window.
10. **Mercer.** Clara's father is referred to only as "Mr. Mercer"; Gideon is not named or shown.
11. **Clara (Q3).** She is mentioned, but nothing is said of her whereabouts.
12. **Year and times.** 1892 (the GDD's working canon), with arrival at 18:40 and the scream at 02:15 (both from the prompt).

## 6. Update — responsive display, fullscreen, mouse, wind-only audio (2026-11-11)

**Why the canvas looked small.** `Display.resize()` only ever used `floor(min(viewport / 320×180))`. A window that fits 3.9× rendered at 3×, losing about a quarter of each dimension; smaller windows lost even more (1.9× → 1×).

**What changed** (the internal resolution is still 320×180; gameplay systems are untouched):
- `src/engine/display.js` gained a **sharp-fit** path. The world buffer is upscaled with nearest-neighbour to a whole multiple ≥ the target, then drawn once with bilinear filtering at the exact 16:9 fit (width a multiple of 16).
  - **Default 'auto' mode:** whole-pixel scaling when it covers ≥ 90% of the fit, otherwise sharp fit.
  - **'integer' mode:** always uses a whole multiple.
  - Camera zoom already used the same upscale-then-sample path, so they share code (`Display.crop`).
- The canvas is sized to the frame and centred by CSS. `image-rendering: pixelated` stays on it, and the page background forms the letterbox.
- Resizing works three ways: the `resize` event, `fullscreenchange`, and a per-frame size check.
- **Fullscreen:** `Alt+Enter`, or Pause → Settings → Fullscreen (Fullscreen API on the document element).
- **Pointer mapping:** client → logical (`Display.clientToLogical`, via the canvas bounding rect, so DPR, letterbox and fullscreen are irrelevant) → undo framing zoom (`Display.unprojectZoom`) → world (`Game.pointerToWorld`).
- **Optional mouse:**
  - each interactable has a world-space hotspot box, and the cursor becomes a pointer over it;
  - clicking walks to the object and uses it;
  - clicking empty ground walks there (clicking past a scene edge exits through it);
  - clicking advances dialogue, and clicking a choice picks it;
  - any movement key cancels a mouse-walk.
- **New settings:** `scaling` ('auto' | 'integer') and a Fullscreen toggle, both in Settings; Alt+Enter is listed in Controls.
- **Audio:**
  - `WIND_ONLY = true` in `src/audio/audio.js`. The continuous ambience is now only wind and its gusts.
  - Silenced but kept in code: fire roar and crackle, room tone, the patrons' murmur, water under ice, steam hiss, train rumble, drone, and incidental creaks.
  - One-shot effects are unchanged: footsteps, doors, the whistle, the scream, and notebook sounds.

**Tested:**
- **Scale calculation:** 9 window sizes from 300×150 to 1920×950, all exact 16:9, with the limiting dimension filled 94–100% in 'auto'. One example: 1100×620 → 1088×612 at 3.4×, centred with 6 px / 4 px margins; the screenshot confirmed it is crisp.
- **Pointer round trip** world → client → world: error 0.000 at zoom 1 and at the dialogue zoom of 1.28.
- **Dispatched pointer events:**
  - click on the register → Silas walks over and examines it;
  - click on Mrs. Gable → dialogue starts;
  - click on a choice during the 1.28 zoom → the right choice is picked;
  - click in the letterbox → ignored.
- **Regression:** both scripted full playthroughs pass at 3.4× (27 + 27 checks), with no runtime errors, and `validate.mjs` passes.
- **Audio:** with ambience set to each scene and the sting and rumble triggered, every non-wind layer stays at gain 0.
- **Fullscreen not verified:** the embedded test browser refuses the Fullscreen API ("Permissions check failed"). The keypress handler fires and calls `requestFullscreen`, but the actual switch must be checked in a normal browser.

## 7. Update — wind-only ambience, smoothed (2026-11-11)

**Cause of the background scuffing.** The ambient noise beds were 3-second buffers looped from a random `loopStart`. Brown noise drifts, so each loop seam jumped by about 13× a normal sample step — a click every 1.5–3 seconds. The wind also had a narrow-band white-noise "whistle" with a wobbling gain, and its gusts were bandpass-swept white noise; both read as rubbing.

**Fix** (`src/audio/audio.js`):
- Noise buffers are now 8 seconds long, DC-corrected, and their tail is cross-faded into their head (equal power), so the loop has no seam.
- The wind is a single low bed: brown noise through a 24 dB/oct low-pass with a very slow cutoff drift.
- Gusts are smooth volume swells of that same bed.
- The whistle layer is removed.
- Every other continuous layer stays off (`WIND_ONLY`).

**Tested.** A 12-second offline render of the creek and parlor ambience, measured by sample steps: the largest step is 1.2–1.3× the 99.9th percentile (no click outliers). The live graph builds with no errors in any scene, and the full playthrough passes. **The result has not been listened to.**

## 8. Fix — the constant "shhh… shhh…" (2026-11-11)

**Cause.** The station's steam-hiss layer had its output gain set to 0, but a 0.3 Hz LFO was connected straight to that gain parameter. An LFO adds to a parameter's value, so the gain swung between −0.03 and +0.03, playing high-passed white noise in a slow pulse in **every scene**. `WIND_ONLY` couldn't silence it, because the preset only sets the base value.

**Fix.** The LFO now drives an inner `pulse` stage; the controlled output gain sits after it and is a real zero.

**Verified with an AnalyserNode on the master bus** (live game, real key gesture):
- With the wind muted, output is 0.00000 RMS in the station, parlor, creek and sawmill.
- The wind alone puts 99.4% of its energy below 600 Hz and 0.00% above 1.5 kHz.
- The full playthrough passes.

All other LFOs drive filter frequencies or inner stages, not output gains.

## 9. Native resolution 320×180 → 480×270 (2026-11-11)

**Goal.** Raise the logical resolution to 480×270 without zooming out. Silas, the composition, movement and timing stay the same; the change adds a finer pixel grid for motion, effects and future art.

**Coordinate spaces** (all constants live in `src/engine/display.js`; nothing else hard-codes 320/180/480/270):

| Space | Size | Used for |
|---|---|---|
| NATIVE | 480×270 | the logical pixel grid: camera scrolling, sprite placement, lighting, snow, pointer input, future art |
| WORLD units | camera frames `VIEW_W×VIEW_H` = 320×180 | positions, speeds, collision, scene widths, all existing art (1 art pixel = 1 unit = `WORLD_SCALE` 1.5 native px) |
| FRAMEBUFFER | 960×540 (`FB_SCALE` 2 per native px) | world compositing |
| UI units | `UI_W×UI_H` = 320×180 (`UI_SCALE` 1.5 native px) | HUD, menus, dialogue layout; drawn on the output canvas at device resolution |
| DEVICE / CSS px | output backing store / page size | handled only by `Display` |

**Why a 960×540 framebuffer.** Showing 320-density art at 1.5× on a 480 grid with nearest-neighbour gives uneven 1-2-1-2 pixel widths. Those widths also shimmer as things move, and bilinear filtering would blur them instead. 960×540 is the smallest grid on which both a legacy pixel (exactly 3×3) and a native pixel (exactly 2×2) are whole, so both kinds of art stay exact. At 1920×1080 it is presented at a clean 2× (= 4× native).

**Render passes** (`Game.draw`):
- **world:** 3 px per unit, shifted by the camera's sub-unit remainder. This draws parallax layers, props, characters, breath, foreground and emissive glows. Legacy draw code is unchanged: it still subtracts a whole-unit `camX` and rounds.
- **view:** screen-anchored legacy textures (fog).
- **native:** 2 px per native px (snow).
- **lighting:** rendered into native-resolution 480×270 buffers, then nearest-scaled.

**Camera.** World-unit position, snapped to the native grid (steps of 2/3 unit, smoother than the old 1-unit steps). It is exposed as `pos` = `ix` (whole units) + `sub` (0, 1/3 or 2/3). `Game.layerX(factor)` is the single source of parallax offsets, and the ridge lantern uses it too. Silas and the NPCs snap to the native grid via `snapN`; static props remain glued to the playfield.

**UI.** Layout coordinates are unchanged, now expressed as `UI_W`/`UI_H`/`UI_CX` instead of literals. The UI transform is `outputWidth / UI_W`, so every panel and font keeps its previous apparent size. Text is vector, so it gains nothing from a pixel grid.

**Input.** Pointer path: `Display.clientToNative` (CSS → native via the canvas's bounding rect, so DPR, letterbox and fullscreen don't matter) → `Display.unprojectZoom` (native) → `/ WORLD_SCALE + camera.pos` → world. Dialogue choices use `Display.clientToUI`.

**Unchanged by design:** world coordinates, scene widths, ground lines, bounds, hotspot sizes, interaction radii, walk speed (44 units/s), acceleration, camera follow rates and zoom factors, cutscene coordinates, and all story data.

**Effects at the new resolution:**
- **Lighting:** radii are scaled ×1.5 into native px, with the same bands and colours. Band steps are 1.5× finer; the minimum radius is now 3 native px (formerly 2 legacy px).
- **Snow:** flake sizes are 1/2/3 native px for the far/mid/near layers. The nearest whole-pixel match to the old 1/1/2 legacy px (1.5/1.5/3 native) makes far flakes a little finer.
- **Fog** and **breath** are unchanged.
- **Scanlines:** one per art row, as before.

**Tested** (in-app browser; `?dpr=1` unless noted):

| Check | Result |
|---|---|
| `node tools/validate.mjs` | 2176 checks, 0 errors |
| `T.fullRun()` and `T.fullRun({ finchKind: false, examineAll: false })` | 27/27 and 27/27 PASS, 0 runtime errors |
| 1920×1080 | 1920×1080 output, native ×4, framebuffer ×2 (integer path) |
| 1366×768 | 1360×765 sharp fit (native ×2.83), centred 3 px / 2 px |
| 1280×720 | 1280×720 sharp fit (native ×2.67) |
| 1024×768 | 960×540 integer (native ×2), letterboxed 32 px / 114 px |
| 760×480 | 752×423 sharp fit, no scrollbars |
| 1280×720 CSS at DPR 1.5 | 1920×1080 backing store, native ×4 integer |
| Live resize between all of the above | no reload, no errors |
| Hotspot round trip (world → client → world → `hotspotAt`), at every size and at zoom 1 / 1.14 / 1.28 | every on-screen hotspot hit, error 0.0000 units |
| Dispatched clicks at every size | click on Mrs. Gable → walk + dialogue at zoom 1.28; hover on a choice → selects it; click → advances |
| Pixel exactness: the playfield layer alone, at camera phases 0, 1/3, 2/3 and the scene edges | 0 off-grid edges, horizontally or vertically; every legacy pixel is an exact 3×3 framebuffer block, so no blur and no uneven pixels |
| Composition | camera position is identical to the pre-migration build for the same input; Silas is 28 of 180 world rows (15.6% of the frame height), unchanged |
| Walk speed | 44.00 units/s, unchanged |
| Render submit time (1920×1080 output) | ~0.4 ms at zoom 1, ~0.5 ms at zoom 1.28 (CPU side only; GPU time not measured) |
| Screenshots | station, parlor (dialogue zoom + toast), creek at night (lantern, snow, fog, foreground) and the title menu all match the previous look |

**Art that would benefit from native 480×270 redraws** (not required; everything works and stays exact as-is):
- **Characters** (`assets/sprites/sprites.json`): Silas (body, legs, idle/walk composites), conductor, Finch, Gable, the patrons, Hale's body, the lantern and the candle. These are the biggest win: faces and hands read at 1.5× density.
- **Procedural backdrops** (`src/world/painters.js`): every scene's main playfield (station, road, village, parlor, Room 4, creek, sawmill), plus the sky gradients, mountain ridges and pine rows. Signage uses a 3×5 pixel font (`signText`) that would read better at native density.
- **Procedural props** (`src/world/props.js`): train body, wheels and steam, fire, the desk front, the watch and the ledger.
- **Fog texture** (`fogTexture` in `paint.js`).

**Using native-density art later.** Draw it in the native pass (`ctx.setTransform(FB_SCALE, 0, 0, FB_SCALE, 0, 0)`), or in the world pass with a destination size of `width / WORLD_SCALE` world units. Either way, one asset pixel equals 2×2 framebuffer px. A layer replacing a painter canvas needs the scene width × 1.5 native px. To mix densities on one asset type, give assets a `density` field (px per world unit: 1 legacy, 1.5 native) and size the `drawImage` destination by it. No asset uses this yet, so the loader is unchanged.

**Known limitations:**
- A window size that is an odd multiple of 480 (e.g. 1440×810 at 3×) puts a legacy pixel at 4.5 device px. Those sizes use the sharp-fit path, which leaves a one-pixel soft edge on legacy art; native-grid elements stay exact. The default 'auto' mode only picks 3× when it fills ≥ 90% of the window.
- At 1280×720 and 1366×768 the old build was a pixel-perfect 4×. Now it is sharp fit, because 480 does not divide those widths at a useful whole factor. The result is visually near-identical (hairline filtering only), but not bit-exact.
- Static props still sit on whole legacy units relative to the playfield. That is intended (they are part of it), but a prop moving by itself, like the train, steps in whole units rather than native px.
- Not verified: real-time feel at 60 fps in a visible window (the test pane throttles rAF), Firefox/Safari, and real fullscreen (the embedded browser refuses the API).

## 10. Asset, level and test workflow (2026-11-11)

**Goal.** A non-destructive foundation for Lospec → Pixelorama → Tiled → Audacity → Playwright, with the Black Ram Hotel exterior as the first Tiled location. No existing scene was rebuilt.

**Already in place (reused, not duplicated):** the `assets/source/pixelorama` → `assets/export` split and its loaders (`assets.js` `NATIVE_SHEETS`, `nativeArt.js`); the 480×270 display, camera and `layerX` parallax; the scene data model in `scenes.js`; master/ambience/effects/music buses; `tools/harness.js` and `tools/validate.mjs`. The Tiled scenes, the Playwright tests and the new audio code all go through these.

**Added:**
- **Directories:** `assets/levels/` (Tiled project, maps, tilesets), `assets/palette/`, `assets/export/tilesets/`, `assets/export/audio/{ambience,footsteps,interaction,music}` + `manifest.json`, `assets/source/audacity/…`, `assets/source/pixelorama/tilesets/`.
- **Palette:** `src/data/palette.js` holds 64 colours in named ramps. The painters' `PAL` is now imported from it with unchanged values. `tools/palette.mjs` writes `.gpl/.hex/.png` and audits PNGs.
- **Tiled:** `src/world/tiled/` has `tiledMap.js` (pure map → scene conversion; native px → world units), `tiledRender.js` (tile and image layers, flips, external `.tsj`, parallax via `parallaxx`, `role` back/main/glow/front, `phase`), and `levels.js` + `levelList.js` (registry, hot reload with `TWT.levels.reload()`). It also adds `registerPainter`/`clearLayerCache` to `painters.js`. Object classes: spawn, bounds, ground, exit, door, interactable, npc, light, prop, event. `assets/levels/the-white-trail.tiled-project` defines them as Tiled custom classes.
- **Black Ram exterior:** `assets/levels/black_ram_exterior.tmj`, 960×272 px = a 640-unit scene. It reuses the town parallax exports, and its tileset (`assets/export/tilesets/black_ram_exterior.png`, 40 tiles, palette-only) was first bootstrapped as programmer art by `tools/make-demo-level.mjs`, then repainted in Pixelorama (see below). It has a door into the existing parlor, edge exits to the village, three interactables (one with night variants), a zone event, phase-tagged lights and glow layers. It is reachable only via `?scene=BLACK_RAM_EXTERIOR`, **not linked into the story**.
- **Entry points and test mode:** `Game.startAt(scene, {phase, spawn})`, `?scene=`, `?phase=`. `src/engine/testMode.js` handles `?test=1`: seeded `Math.random`, manual stepping through `TWT_TEST.step(n)`, no auto-pause.
- **Audio:** `src/audio/samples.js` provides optional recorded sfx variants, ambience beds and music, all crossfaded; synthesis stays the fallback. There are new `footsteps` and `interaction` sub-buses under effects, with settings and two Settings-menu rows (row spacing 10 → 9). Scenes take a `music` property. `windDip` respects `replaceSynth`.
- **Tests:** `package.json` (dev dependency `@playwright/test` 1.65.0, installed), `playwright.config.mjs` (installed Edge, found under `EdgeCore\<version>`; no browser download), 8 e2e specs, 2 unit test files, and 4 screenshot baselines. `validate.mjs` now converts and checks every Tiled map.
- Smaller changes: an empty inline favicon in `index.html` (removes a 404 from the console checks), and `test-results/` in `.gitignore`.
- **Docs:** `docs/ASSET_PIPELINE.md`, `docs/TILED_LEVELS.md`, `docs/AUDIO.md`, `docs/TESTING.md`, and README sections.

**Tested (Edge 157, headless, Windows):**

| Check | Result |
|---|---|
| `node tools/validate.mjs` (now includes the Tiled map) | 2246 checks, 0 errors |
| `node --test tests/unit/` | 11/11 pass |
| `npx playwright test` (full `npm test`) | 38/38 pass, 0 flaky, ~1.3 min |
| …including `T.fullRun()` and `T.fullRun({finchKind:false, examineAll:false})` | all checks PASS, 0 runtime errors |
| Visual baselines re-run twice after creation | 12/12 pixel-identical (`maxDiffPixels: 0`) |
| One earlier run | 1 failure was an Edge launch crash before any test code ran; the same spec then passed 9/9 with `--repeat-each=3`. `retries: 1` now reports such cases as flaky |

**Not verified / limits:**
- The Tiled map and project file were written to the documented Tiled 1.10 JSON format but **were not opened in the Tiled application** (no editor was automated). Opening them in Tiled is the first manual check.
- ~~The tileset is programmer art and has no `.pxo` source yet.~~ Done; see §11.
- No recorded audio exists. The sample path is tested only with generated WAVs, and nothing was listened to.
- The screenshot baselines are specific to this Edge version on Windows. Text rendering differs elsewhere, so other machines need their own baselines.
- Tile animations, tint colours, infinite maps and non-CSV tile data are unsupported, each with a clear error or warning.
- `npm run palette:check`: 74 of 81 existing exports contain off-palette (mostly "near") shades from baked lighting and dither. This is reported, not changed.

## 12. Exterior world, Phase 1 — town geography in Tiled (2026-11-11)

**What changed.** The hand-written `VILLAGE` scene is gone. Walking order is now STATION → ROAD → **VILLAGE** (Main Street, `assets/levels/main_street.tmj`, 480 units) → **BLACK_RAM_EXTERIOR** (hotel forecourt, `black_ram_exterior.tmj`, 640 units) → PARLOR; at night the forecourt's east edge leads to CREEK → SAWMILL. Both maps are Tiled-authoritative; the old `paintVillage` code, `VILLAGE_GROUND` and the `nativeArt` entry were deleted.

**Story gates kept:** hotel door needs `metFinch` (blocked line preserved); the creek exit needs NIGHT (same blocked line); Finch meet / watcher events and all dialogue ids are unchanged. `FINCH_MEET` now walks Finch off east (`walkTo 474`, no door sound) instead of into a door that is no longer on this map.

**Pass 1 art.** Main Street's playfield is composed from the existing `town/main.png` cut left of the hotel (cabin, Rusk's store, lamp) plus the woodshed and tiled ground (`tools/make-main-street.mjs` → `assets/export/levels/main_street_playfield.png`; the map is written once, then Tiled owns it). The street seam near x=408 px and the plain middle stretch are placeholders for Pass 2.

**Tests.** `tests/e2e/world.spec.mjs` (geometry, collision/camera bounds, all transitions, story gates, review screenshots in `test-results/world/`), updated interactions/audio specs, new `main-street-evening` baseline, harness `fullRun` extended with the forecourt step.

**Station and Sawmill (same day, second step).** Both are now Tiled maps too (`blackwood_station.tmj`, `old_sawmill.tmj`), made by `tools/migrate-scene-to-tiled.mjs` from the old `scenes.js` entries; the converted scene data was diffed against the originals (only cosmetic differences: station ground length, sawmill event xMax = width). The maps own the layout; the map property `painter` keeps each scene's existing painter for its art, so the train prop and the ridge-light prop (which read painter state) are untouched. New: exit property `scriptIf` (run a script instead of travelling; used by the sawmill's SLICE_END exit) and map property `painter`. These two maps use an 8 px grid because 560 units = 840 px is not a multiple of 16; Pass 2 resizes them to 16 px tiles when the art moves to tilesets.

**Not done yet:** Pass 2 (tileset art, lighting/snow details, audio assets) for every location; ROAD and CREEK are still hand-written scenes; the MILL signpost has no visual on the forecourt; maps never opened in the Tiled app. Station→Sawmill have 62/62 e2e tests passing (world.spec.mjs now covers all four locations, the station gate and every sawmill inspection point).

## 13. Sawmill Pass 2 — tile-built (2026-11-11)

**What changed.** `old_sawmill.tmj` is now a 54×17-tile map (864 px = 576 units; the creek end gained 16 units) with tile layers ground · back_wall · structure · details, the existing Pixelorama parallax PNGs as image layers, and **no painter**: `paintSawmill`, the `nativeArt` entries and `SAWMILL_GROUND` are deleted. New tileset `sawmill_exterior` (136 tiles, palette-exact, `tools/make-sawmill-tileset.mjs`; Pixelorama source `sawmill_exterior.pxo`, verified pixel-identical round trip). The map reuses the Black Ram snow tiles for the ground.

**All clue, exit, spawn, light and event objects are untouched**, so positions, prompts and story are as before (62 → 65 e2e tests, `T.fullRun` unchanged and passing). The ridge-light prop no longer depends on a painter: a layer flagged `ridge` publishes its skyline heights (`levels.js`), and `nativeHeights` is exported from `painters.js`.

**Art added** (storytelling and landmarks, no new plot): hanging broken planks and a snow-laden roof with icicles on the shed; a saw carriage with log and rust-eaten blade; the stopped, iced waterwheel as a 6×6 tile block; the frame with braces, rope and rope-scuffed beam; a cordwood stack, stump, broken fence and a MILL board on the approach so the first screen is no longer empty; one set of footprints coming in from the bridge; sawdust floor with boot impressions and the ash pit; the drag furrow on the bank; ice rim and black water.

**Not done:** no recorded audio (the creek/wind synthesis is unchanged), no warm artificial light (the ridge lantern remains the only one, by design), approach fence and footprints are subtle at night darkness. The map is unopened in the Tiled app.

## 14. Station Pass 2 — tile-built (2026-11-11)

**What changed.** `blackwood_station.tmj` is now a 54×17-tile map (864 px = 576 units; the road end gained 16 units, the east exit moved with it) with parallax image layers, a fog band, a **track bed tile layer behind the train**, then deck · wall · structure · roof tile layers, a glow layer (lit telegraph window, lamp flame), the telegraph wires as an image layer and the existing foreground drifts. No painter: `paintStation*` and the `nativeArt` station entries are deleted (only the train sprites are still loaded, by the train prop). New `station_exterior` tileset (64 tiles, palette-exact, `tools/make-station-tileset.mjs`, Pixelorama source `station_exterior.pxo` with a verified round trip); the house reuses Black Ram walls, windows, door, lamp and chimney.

**The train needed no decoupling:** it is a prop drawn at z −5, and every Tiled back layer sits below that (z ≤ −95), so it still runs between the track bed and the platform. Conductor, clue positions, the gate, the intro event and all dialogue are unchanged (68 e2e tests: world specs for layers/train/intro, a new `station-house-evening` baseline, `T.fullRun` unchanged).

**Shared tooling.** The Canvas/registry/writer helpers moved to `tools/lib/tilekit.mjs`; the sawmill tileset regenerates byte-identical.

**Art:** pitched snow roof with eave icicles and a chimney, log walls, the BLACKWOOD board, a dark waiting-room window and the lit telegraph window with its TEL plate, the chalk timetable, freight (lamp-oil crate and mail sacks), the lamp, a snow-crusted ballast bank with rails and sleepers, the pole and wires.

**Not done:** no recorded audio; the platform has no awning (the roof's overhang and icicles stand in for it); the deck is the Black Ram boardwalk tile; not opened in Tiled.

## 15. Main Street Pass 2 — tile-built (2026-11-12)

**What changed.** `main_street.tmj` (480 units, 45×17 tiles) is now built from tiles instead of the stitched crop of the old painted town (that crop, its generator `make-main-street.mjs` and `main_street_playfield.png` are deleted). It combines four tilesets (Black Ram, station, sawmill, new `main_street_exterior`, 48 tiles, palette-exact, Pixelorama source with a verified round trip): the log cabin with a pitched snow roof, chimney and the watcher's window; Rusk's clapboard false-front store with the lettered board, cracked shop window (a counter, sacks, the account book left open), awning with icicles and a dark door; the street lamp (lit in the evening, glow layer tagged EVENING); rutted street snow, one set of prints heading east, a hitching rail, a stump, cordwood; and the barred woodshed with its window.

**Fixes found on the way.** The street-lamp light shone at night although the lamp is out; it is now tagged EVENING. The watcher prop had its window position hard-coded in `props.js` and sat off the new window; it now takes its position from the map (`args` [57,110]), so geometry lives in Tiled. Both have tests.

**Unchanged:** every interactable, the Finch and watcher events, exits, spawns, gates and dialogue (the objects layer was kept). Visual baseline `main-street-evening` was regenerated on purpose.

**Not done:** recorded audio; the east end still ends at the woodshed rather than showing the way toward the hotel (the forecourt screen takes over at the edge); not opened in Tiled.

## 16. Hotel forecourt detail pass (2026-11-12)

The forecourt keeps its Black Ram hotel, annex, boardwalk, lamp and windows. Added (`tools/patch-forecourt-pass2.mjs`, run once; Tiled owns the map): the street arriving from Main Street (rutted snow), snow trodden flat in front of the door, one set of prints leaving east toward the creek path, barrels/crate/bench/drifts/shrub, the **MILL board** on its post with an interactable ("Old sign", the line it had on the old village street), an outbuilding door/window and an unlit lantern on its hook, and pines framing the way down to the creek. Five tiles were appended to `main_street_exterior` (88 tiles, existing indices unchanged, Pixelorama source re-imported with a verified round trip). Two forecourt baselines were regenerated on purpose; 73 e2e tests pass.

**Not done:** the pines read faintly at night darkness; no recorded audio; the east exit still jumps straight to the creek screen (no bank slope drawn). Road and Creek are still hand-written scenes.

## 17. Road and Creek, tile-built (2026-11-12)

**What changed.** `ROAD` (`road_to_crows_hollow.tmj`, 800 units) and `CREEK` (`creek_path.tmj`, 768 units: 8 units wider so the width is whole tiles) are now Tiled maps built from the new `wilderness_exterior` tileset (216 tiles, palette-exact, Pixelorama source with a verified round trip), via `tools/migrate-scene-to-tiled.mjs` (layout, diffed against the old scene data) and `tools/make-wilderness-levels.mjs` (art, built once). `scenes.js` now only holds PARLOR and ROOM4; `paintRoad`, `paintCreek`, `ROAD_GROUND`, `CREEK_GROUND` and their `nativeArt` entries are deleted. The existing parallax PNGs (with the Road's distant village lights and glow) are image layers.

**Terrain tiles.** Both scenes have rolling ground, so the ground is tiles whose crust row follows the polyline (see the tileset README). The Road's ground is 3 px lower than before so the crust always has a row to sit in (151.3 instead of 150 world units at x=0); a test checks the crust against the polyline. Fences, the CROW'S HOLLOW signpost, the ore car and the notice board stand behind the terrain with their feet sunk in; the creek has its bank, ice rim and black water, the footbridge (in front) and the deadfall, and fresh prints lead to the bridge.

**A mistake found and fixed.** The `station-house-evening` baseline I added earlier actually captured the Road: its setup walked Silas to world x=560, past the station's east bound, so the exit fired. The setup now walks to x=430 (in front of the house) and the baseline was regenerated, with the creek baseline.

**Unchanged:** all interactables, events, doors, gates and dialogue. 81 e2e tests pass (two baselines regenerated).

**Not done:** both scenes are very dark by design at their story phases, so the new art reads best with the lantern; no recorded audio; the interiors (PARLOR, ROOM4) and the title backdrop are still painted, not tile-built.

## 18. The hotel interiors, tile-built — every playable scene is now a Tiled map (2026-11-12)

**What changed.** `PARLOR` (`black_ram_parlor.tmj`, 39×17 tiles = a 416-unit room; the east wall gained 24 px so the width is whole tiles) and `ROOM4` (`room_4.tmj`, 30×17) are Tiled maps built from the new `hotel_interior` tileset (312 tiles, palette-exact, Pixelorama source with a verified round trip). Layout was migrated with `migrate-scene-to-tiled.mjs` first (diffed), then `make-interior-levels.mjs` built the art with each feature at the position of the painting it replaces, so every interactable, prop (fire, patrons, desk, window snow) and light is untouched. The authored light/glow passes stay as phase-tagged image layers over the tiles. `scenes.js` now holds only the global events; the `paintParlor*`/`paintRoom4*` painters and the per-scene `nativeArt` machinery are empty/deleted. The only procedural scene left is the **title-screen backdrop** (`paintTitle`), which is a menu background, not a playable place.

**Art.** Parlor: damask wallpaper, panelled wainscot, a stone hearth with mantel candles and clock, the photograph of the mine crew, pigeonholes with the key row (key 4 missing), brass sconces, the stairs with newel and balusters up to a dark landing, the glass-paned door. Room 4: cold stippled walls, the wardrobe, washstand with scoured basin and candle, the window onto the snow, the iron bed, the pale patch where a picture hung, and the **scrubbed boards** as visibly paler floor tiles at the clue (tested).

**Tests:** 94 e2e pass incl. `T.fullRun` (unchanged); parlor-fire baseline regenerated, `room4-night` added.

**Not done:** the Parlor's wallpaper was darkened once after review but interiors have been seen only through the test screenshots; no recorded audio; the title backdrop is still procedural; no maps opened in the Tiled application.
