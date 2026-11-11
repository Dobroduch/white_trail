# THE WHITE TRAIL — First Milestone Build Prompt

You are the lead game developer and technical designer for **THE WHITE TRAIL**, a 2D side-scrolling pixel-art detective mystery adventure for desktop browsers.

I am providing a complete document titled **THE WHITE TRAIL — Game Design Document, Story Bible & AI Development Specification**. Read the entire document before writing code. Treat it as the primary source of truth for the game's setting, characters, story, design philosophy, art direction, systems, and technical constraints. This prompt narrows the task to the first playable milestone; it does not replace the GDD.

Your job is to **implement a playable first vertical slice in the project files**, not merely describe how you would build it. Work directly in the available repository. If it is empty, create the project. Do not ask me questions; make conservative technical decisions, record assumptions, and avoid inventing story canon where the GDD deliberately leaves a question unresolved.

---

## 1. Project identity and non-negotiable direction

The game's title is exactly **THE WHITE TRAIL**. Do not use the former subtitle or any alternative title.

The game is:
- A 2D side-scrolling detective mystery adventure.
- Primarily about exploration, investigation, deduction, dialogue, character relationships, and atmosphere.
- A restrained psychological western set in an isolated Rocky Mountain mining settlement in 1892, during a severe winter storm.
- Built around a small cast of memorable people whose actions and survival matter.

The game is **not** a shooter, run-and-gun platformer, enemy-wave game, monster-hunting game, or resource-management survival game.

### Absolute design rules

1. Mystery and investigation come before combat.
2. No generic enemies, respawning hostiles, random encounters, combat arenas, enemy waves, kill counts, or NPCs placed just to be killed.
3. Every important character must have a name, motive, personality, history, relationships, and a reason to be present. Background patrons may exist as non-combat set dressing, but do not turn them into targets.
4. Silas owns exactly one firearm: his revolver. It has a six-chamber cylinder and starts with three cartridges, according to the GDD. There are no other weapons, weapon upgrades, shops, ammo drops, or ammunition farming.
5. Violence is exceptional and consequential. Do not reward killing or make it the easiest default solution.
6. **Do not add a combat encounter to this first milestone merely to demonstrate shooting.** No one should be shot or killed by the player in this slice. Keep the architecture ready for later authored confrontations, but prioritize proving the mystery-adventure loop. Do not invent an expendable masked gunman or any other disposable enemy.
7. No supernatural event is real in the story's canon. No monsters, ghosts, curses, magic, or actual Wendigo.
8. Hallucinations are virtually absent. There is no sanity meter, paranoia meter, random hallucination, cold-induced hallucination, or routine screen distortion. The only planned hallucination in the entire story is one brief authored episode after Silas drinks poisoned coffee later in the full game. **That event is not part of this milestone.**
9. Strange events in this slice may suggest a supernatural explanation, but do not confirm one. Do not reveal the full human explanation prematurely.
10. The player's progression is knowledge: evidence, deductions, access, and understanding—not weapons, XP, or combat upgrades.

If a tempting feature conflicts with these rules, do not implement it.

---

## 2. Milestone objective

Build a polished, self-contained **10–20 minute playable vertical slice** covering Silas's first arrival in Crow's Hollow and the discovery of Sheriff Nathaniel Hale's body at the old sawmill.

The slice should let a first-time player understand, through play rather than exposition, that THE WHITE TRAIL is a side-scrolling detective mystery with a small, suspicious cast and a cold, oppressive atmosphere.

### Required playable sequence

#### Scene 1 — Blackwood Station, approximately 18:40

- Open with the steam train arriving at Blackwood Station during worsening snowfall and wind.
- Introduce Silas Vance through restrained visual storytelling. Avoid a lengthy opening text dump.
- The conductor explains that the pass is becoming unsafe and that a return train cannot be promised for several days. Keep the dialogue period-appropriate and concise.
- Let the player control Silas on the platform, inspect a small number of meaningful objects, and speak to the conductor.
- Establish the storm, isolation, and late-nineteenth-century technology.

#### Scene 2 — The road into Crow's Hollow

- The player walks from the station toward the village through a short, atmospheric, side-scrolling exterior.
- Use wind-driven snow, layered pine silhouettes, tracks, fences, distant warm windows, and limited visibility.
- The path should be readable and calm enough for observation; it must not become a precision platforming challenge.
- Introduce the lantern as a practical light source. The player can turn it on and off, but do not create a mandatory stealth gauntlet.
- Silas meets Constable Edgar Finch in or near the village, consistent with the GDD. Finch is nervous and incomplete in his explanations, but nervousness must not be treated as proof of guilt.

#### Scene 3 — The Black Ram Hotel

- The player enters the hotel in a seamless or clearly authored scene transition.
- Establish a warm interior that contrasts strongly with the cold blue exterior.
- Introduce Mrs. Gable as controlled, practical, guarded, and observant—not a one-note villain.
- Include a small number of silent hotel patrons as atmosphere if useful. They are not enemies and are not combat targets. Do not add unnecessary named characters or new plot-critical lore.
- Allow the player to examine the parlor and interact with Mrs. Gable and Finch where appropriate.
- Silas is assigned Room 4.
- Room 4 contains signs that blood was recently scrubbed from the floorboards. Let the player discover and record this through observation rather than a giant glowing marker or an automatic exposition line.
- Provide a concise dialogue and interaction loop. Dialogue choices should reveal character or alter a small, explicit state flag; avoid meaningless choice overload.

#### Scene 4 — Advance to 02:15

- Do not make the player wait in real time for hours.
- After the player has explored the relevant hotel content, offer an authored choice to retire to Room 4 / advance the scene.
- Fade or transition to approximately 02:15.
- A scream is heard outside. This must be a clear, memorable story trigger, not a random event.
- The player regains control and can leave the hotel to investigate.

#### Scene 5 — The route to the old sawmill

- Lead the player through a short snow-covered route toward the old sawmill.
- Use environmental storytelling: disturbed snow, a trail, distant timber structures, water, and wind.
- The player should have to observe and follow the route, but do not make the path unfair or dependent on pixel-perfect searching.
- No random patrols, generic enemies, monster chase, or forced gunfight.

#### Scene 6 — The sheriff's body / first crime scene

- Silas discovers Sheriff Nathaniel Hale suspended near the old waterwheel.
- The display and surrounding evidence should initially suggest a ritualistic or supernatural event, while the physical details remain plausible and grounded.
- Do not portray a literal impossible draining of every drop of blood. The apparent effect is staged and must be explainable through human action and physical evidence later in the story.
- Let the player examine the scene and record at least **four distinct pieces of evidence**. Use the GDD's established evidence, such as:
  - the broken pocket watch;
  - cavalry-style boot impressions;
  - the half-burned ledger referencing the Pale Order;
  - the rope, waterwheel, or timber markings;
  - disturbed snow / the route toward the creek.
- Do not automatically explain the complete murder, identify the murderer, or reveal the entire conspiracy. The player should leave with a stronger question and a few defensible observations—not the answer to the whole mystery.
- Include a notebook/case-file view where the player can review observations and distinguish direct observation from interpretation.
- Include one modest, fair first deduction or evidence connection only if it is supported by clues the player has actually examined. Do not make the notebook solve the mystery automatically.
- End the slice on a strong narrative beat: a new clue, a troubling realization, or a distant sign that someone else is nearby. Do not introduce an actual supernatural entity.

### Scope boundary

Do not build the graveyard, telegraph tower, mine, summit cabin, poisoned-coffee sequence, full story, endings, or a large open world in this milestone. Do not resolve the open story questions in Part IX of the GDD. Make a clean foundation for later expansion.

---

## 3. Gameplay systems required in this milestone

### Side-scrolling movement and world

- Logical resolution: **320×180**.
- Pixel-perfect integer scaling where possible; preserve 16:9 aspect ratio with letterboxing rather than distortion.
- Crisp nearest-neighbor rendering; disable image smoothing.
- Grounded, deliberate left/right movement with collision.
- Small authored obstacles, steps, doors, and scene transitions. Jumping is optional and must not become a precision-platforming focus.
- Smooth but restrained side-scrolling camera.
- Use room-sized connected scenes rather than one enormous map.

### Adaptive camera

Implement three restrained framing behaviours:
1. **Exploration:** wider framing, showing routes and environmental context.
2. **Investigation:** slightly closer framing when examining an important clue; keep Silas and the object readable.
3. **Dialogue:** closer, more intimate framing that emphasizes characters and pauses.

Transitions must be smooth and must not cause pixel shimmer. Do not use aggressive zoom, constant camera shake, or rapid cuts.

### Interaction

- Contextual interaction prompt when Silas is close to a usable object or character.
- Use a generous interaction radius.
- Interactions should be explicit and readable. Avoid highlighting every object constantly.
- Important clues must be discoverable through visual composition, lantern light, sound, or contextual description—not only through a marker.

### Investigation and notebook

Implement a real, data-driven evidence system, even if the first slice contains only a few clues.

Each evidence record should include at least:
- stable ID;
- title;
- location/scene ID;
- direct observation text;
- optional inspection detail;
- discovery state;
- related people/locations/evidence;
- optional deduction tags.

The notebook must:
- list discovered evidence and witness statements;
- distinguish **Observed** from **Interpretation**;
- allow the player to reopen an evidence entry;
- show unresolved leads without pretending to know the answer;
- avoid spoiling unearned conclusions.

At least four clues at the sawmill must be independently inspectable and recorded only when the player examines them. Re-entering a scene must not duplicate evidence.

### Dialogue and character state

- Implement concise branching dialogue for Finch and Mrs. Gable; the conductor may have a short exchange.
- Use data-driven dialogue nodes/choices rather than hard-coding every conversation into one large function.
- Track only states that matter in this slice (for example, whether the player asked about the sheriff, whether Mrs. Gable was questioned about Room 4, or whether a clue has been presented).
- No global morality, paranoia, or reputation meter.
- Characters should not dump the whole plot. Let evasions, pauses, contradictions, and what they refuse to discuss create tension.
- Do not invent a detailed secret or resolve a story question that the GDD leaves open. Where the dialogue needs a detail that is not canonically fixed, keep it noncommittal and record the assumption in `NOTES.md`.

### Lantern and weather

- Toggle lantern on/off.
- Use a visible, restrained local light effect that makes nearby objects readable.
- Add atmospheric wind and snow particles with varying direction and density.
- Snow and light must never hide required clues or interaction prompts.
- Do not let oil management dominate this slice. It is acceptable for oil consumption to be disabled or generously tuned for the prototype, but keep the code modular for later balancing.
- Warmth may be represented subtly, or implemented as a low-pressure supporting value. Do not create a rapid-depletion survival loop or cold-related hallucinations.

### Combat boundary

- Do not implement an active shooting encounter in this milestone.
- Do not spawn targets, enemy patrols, or generic hostile NPCs.
- The revolver may be represented in inventory / character state and inspected, but firing can remain unimplemented or disabled with a clear internal TODO.
- Do not let the player shoot the conductor, Finch, Mrs. Gable, patrons, the sheriff's body, or background scenery.
- Later combat must be an authored scene involving a real story character, a clear motive, and meaningful non-lethal alternatives. This is not the milestone for inventing that scene.

---

## 4. Art direction and audiovisual implementation

### Visual style

Create a cohesive original pixel-art presentation, not a generic collection of colored rectangles.

- Native logical canvas: 320×180.
- Strong silhouette readability at low resolution.
- Pixel-art character sprite for Silas with at least idle and walk states (even if the first animation is simple).
- Recognizable silhouettes for the conductor, Finch, and Mrs. Gable.
- Layered environments for the station, snowy path/village edge, hotel interior, Room 4, and sawmill.
- Exterior palette: deep navy `#090d16`, icy slate `#334155`, bone white `#f1f5f9`, midnight purple `#171026`.
- Interior warmth: amber `#f59e0b`, kerosene orange `#d97706`, dark timber browns, restrained crimson `#991b1b`.
- Clear contrast between warm interior light and cold exterior darkness.
- Add restrained parallax layers, snow, fog, and lantern illumination.
- Optional CRT scanlines/vignette must be subtle and disabled by default unless they improve readability.

Use original temporary pixel-art sprites/tiles drawn by you or generated as local project assets. Do not hotlink assets. Do not use copyrighted characters, copied game sprites, or unlicensed commercial assets. If you must use placeholders, make them deliberate pixel-art placeholders with coherent silhouettes and palette—not flat colored boxes or emoji.

### Audio

Use Web Audio API or original local audio assets.
- Low-frequency filtered wind ambience.
- Snow footsteps.
- Distant train whistle / steam and restrained mechanical ambience at the station.
- Wooden creaks / hotel room tone.
- A distant scream at the authored 02:15 event.
- Sawmill water / wood / wind ambience.
- Minimal music: restrained drone or sparse notes; silence is often preferable.

Respect browser autoplay policies: initialize/resume audio only after a user gesture. Include master, ambience, and effects volume controls if practical. Do not let audio become repetitive or overpower dialogue.

---

## 5. Technical requirements

Use **vanilla JavaScript, HTML5 Canvas 2D, CSS, and Web Audio API**. Prefer native ES modules and no framework. Avoid unnecessary dependencies, backend services, remote APIs, and network assets. If the repository already has a sensible setup, inspect it and reuse it rather than replacing it without reason.

Keep source modular and readable. A suitable structure is:

```text
THE_WHITE_TRAIL/
├── index.html
├── README.md
├── NOTES.md
├── src/
│   ├── main.js
│   ├── engine/        # game loop, renderer, camera, input, scene manager
│   ├── entities/     # Silas, characters, interactables
│   ├── systems/      # dialogue, evidence, notebook, story state, lantern, save
│   ├── world/        # scene data, collision, scene transitions
│   ├── ui/           # HUD, dialogue, notebook, pause/menu
│   └── audio/        # audio manager and soundscape
└── assets/
    ├── sprites/
    ├── backgrounds/
    ├── tilesets/
    ├── ui/
    └── audio/
```

Adjust the layout if the existing repository needs a different organization, but preserve separation of concerns. Do not put the entire game into one enormous function or one unmaintainable file.

### Engineering rules

- Use a fixed or semi-fixed update step and `requestAnimationFrame` rendering.
- Separate world rendering, lighting/effects, and UI rendering.
- Avoid subpixel sprite positions that cause pixel shimmer.
- Handle resize, pause, focus loss, and browser audio restrictions.
- Use explicit scene IDs and stable evidence / character IDs.
- Keep story state separate from presentation state.
- Use data-driven scene, dialogue, and evidence definitions where practical.
- Save important flags and discovered evidence to `localStorage` at intentional checkpoints; do not save every frame.
- A scene transition or reload must not resurrect a dead character or duplicate evidence. The first slice has no player-caused deaths, but the state model should support persistent character state later.
- Provide a reset/new-game function so testing is repeatable.
- Handle missing assets with useful console errors and a graceful fallback; do not fail silently.
- Do not claim a test passed unless you actually ran it.

### Controls

Use a simple keyboard-first desktop scheme:
- `A` / `D` or arrow keys: move left / right.
- `E`: interact / examine / advance contextual interaction.
- `F`: toggle lantern.
- `Tab`: open/close notebook.
- `I`: inventory (if implemented in this slice).
- `Esc`: pause / close current panel.
- `Space`: optional modest jump only if needed for traversal.

Show controls unobtrusively in the opening tutorial or a help panel. Make sure interactions work without a mouse. If mouse use is added, it must be optional.

---

## 6. User interface requirements

The UI must feel like part of a restrained period detective adventure.

- Minimal HUD; do not display large health, sanity, paranoia, or survival bars.
- Small contextual interaction prompt.
- Dialogue panel with readable text, speaker identification, and clear choices.
- Notebook accessible with `Tab`, containing evidence entries and a brief lead list.
- Small location/time label where useful (e.g. `BLACKWOOD STATION — 18:40`, later `OLD SAWMILL — 02:15`).
- No arcade score, kill counter, combo display, loot popups, or quest-marker clutter.
- Ensure the interface remains legible at common browser sizes while the game is internally rendered at 320×180.

---

## 7. Quality bar and acceptance checklist

The milestone is complete only when the following are true:

### Playability
- [ ] The project starts locally using the instructions in `README.md`.
- [ ] A player can complete the full sequence from the train arrival to the sawmill crime scene.
- [ ] Movement, collision, interaction, scene transitions, and camera follow work reliably.
- [ ] The player is never trapped by a softlock or an interaction that cannot be completed.
- [ ] The game can be restarted cleanly.

### Story and design fidelity
- [ ] The title shown in the game is exactly THE WHITE TRAIL.
- [ ] The story follows the provided GDD and this prompt.
- [ ] The player meets Finch and Mrs. Gable and can inspect Room 4.
- [ ] The 02:15 scream occurs as an authored one-time event, not randomly.
- [ ] The player discovers Sheriff Hale at the sawmill.
- [ ] At least four distinct clues can be examined and recorded.
- [ ] The notebook distinguishes direct observations from interpretations.
- [ ] No full conspiracy reveal or unresolved story-canon decision is invented.

### Tone and systems
- [ ] The game clearly reads as a mystery adventure, not a shooter.
- [ ] No generic enemy, disposable combat NPC, random patrol, or forced gunfight exists.
- [ ] The player does not shoot or kill anyone in this milestone.
- [ ] No actual supernatural entity/event appears.
- [ ] No hallucination occurs in this milestone.
- [ ] No sanity/paranoia/morality meter exists.
- [ ] Lantern, snow, wind, warm interiors, and cold exteriors contribute to atmosphere without harming clue readability.
- [ ] The camera has exploration, investigation, and dialogue framing behaviours.

### Technical quality
- [ ] Canvas uses 320×180 logical resolution and crisp scaling.
- [ ] No major console errors during a normal playthrough.
- [ ] No evidence duplicates after scene re-entry.
- [ ] Dialogue and scene state do not accidentally replay one-time events.
- [ ] The game handles resize, pause, and browser audio restrictions.
- [ ] Save/load preserves the slice's important progress, or saving is explicitly documented as deferred with a safe checkpoint/restart mechanism.

---

## 8. How to work

1. Inspect the repository and read the full GDD.
2. Briefly report the current project state and a concise implementation plan.
3. Then implement the milestone directly—do not stop after planning or asking for approval.
4. Run the project using the available local tooling. Check the browser console and fix errors you can reproduce.
5. Play through or automate as much of the required sequence as the environment allows. Verify the scene transitions, interactions, notebook, evidence recording, and restart behavior.
6. Do a final pass for visual consistency, text legibility, control clarity, and adherence to the design rules.
7. Update `README.md` with exact run instructions and controls.
8. Create `NOTES.md` containing: implemented features, files changed, tests actually run and their results, known bugs/limitations, and any story/technical assumptions that need the design owner's decision.

### Final response format

When finished, provide:
- a short summary of what is playable;
- exact instructions to run it;
- the controls;
- what was tested and what was not tested;
- known limitations and remaining work;
- a clear statement confirming whether the acceptance checklist is fully met or which items remain incomplete.

Do not claim the game is complete if only a scaffold or mockup exists. Do not replace implementation with a lengthy design explanation. **Build the first playable milestone now.**

---

## Creative north star

THE WHITE TRAIL is about a man who arrives expecting to investigate a disappearance and discovers a community that has spent decades burying its history. Snow hides tracks, people hide motives, and superstition hides practical crimes. Silas carries a revolver, but the most important thing he carries is the ability to notice what other people overlook.

**The player should fear what people are willing to do to protect a secret—not a monster waiting in the dark.**
