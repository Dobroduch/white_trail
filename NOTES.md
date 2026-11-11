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
- **Rendering.** World rendered at a logical **320×180**, scaled by whole numbers and letterboxed, with nearest-neighbour filtering. Render passes are separate: parallax backgrounds → depth-sorted props and characters → snow and fog → lighting (darkness with banded light pools, then additive warm glow) → emissive windows and lamps → foreground snow → composite → UI.
- **Adaptive camera.** Exploration (wide, look-ahead), investigation (zoom ×1.14 between Silas and the object), and dialogue (×1.28 between the speakers), plus authored overrides in cutscenes. Zoom is shimmer-free: the 320×180 frame is first upscaled crisply by a whole number, and only then cropped with bilinear sampling. The camera position is snapped to whole pixels. *Reduce camera motion* turns the zoom off.
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
- UI text is drawn with the system Georgia font, falling back to Times. It is rendered crisply at display resolution on pixel-grid panels; the world itself is strictly 320×180. This was a legibility decision. A bitmap pixel font could replace it if the design owner prefers a pure-pixel UI.
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
