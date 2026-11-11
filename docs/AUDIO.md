# Audio

All of the existing sound is **synthesised** in [`src/audio/audio.js`](../src/audio/audio.js) and
remains the fallback. Recorded sounds made in Audacity are layered on top **one at a time**: any sound
that has a file plays the file, and any sound without one keeps its synthesised version.

## Buses and volume

```text
master ─┬─ ambience      continuous beds (wind, room tone, recorded ambience loops)
        ├─ music         drone, stingers, recorded music tracks
        └─ effects ─┬─ footsteps     every sfx whose name starts with "step"
                    └─ interaction   everything else: doors, pages, pen, whistle, scream, UI ticks
```

Each bus has a setting in *Pause ▸ Settings*: Master, Ambience, Effects (with Footsteps and Interaction
sounds as sub-mixes), and Music. Settings persist in `localStorage`. Every gain change uses
`setTargetAtTime`, so sliders, scene changes and music changes glide rather than click.

**Transitions**

- Ambience: on entering a scene, synthesised layers glide to the new preset (≈1.2 s), and a recorded bed
  crossfades (≈2.4 s).
- Music: `audio.playMusic(id)` crossfades over 2.5 s, and `playMusic(null)` fades out. A scene's (or Tiled
  map's) `music` property is applied on entry. A scene without one fades the music out.

## Making a sound in Audacity

1. Record or design the sound and save the project as `assets/source/audacity/<category>/<name>.aup3`.
2. Prepare it:
   - **Footsteps and interaction**: trim the silence at the start (sounds must start immediately),
     add a short fade-out, and normalise peaks to −3 dBFS. Make 3–6 variants per footstep surface.
   - **Ambience beds**: 20–60 s, and **seamless**: cross-fade the tail into the head, and check the
     loop point with *Loop Play* (Shift+Space). Keep the level steady, around −18 dBFS RMS.
   - **Music**: −16 dBFS RMS is a good starting level. If it loops, place the cut points on the beat.
3. *File ▸ Export Audio* as **Ogg Vorbis**, quality 5, 44.1 kHz. Use mono for sfx and stereo for beds
   and music. WAV also works but is ~10× larger. Save into `assets/export/audio/<category>/`.
4. Declare it in [`assets/export/audio/manifest.json`](../assets/export/audio/manifest.json):

```json
{
  "sfx": {
    "stepSnow": { "files": ["footsteps/snow_01.ogg", "footsteps/snow_02.ogg", "footsteps/snow_03.ogg"], "gain": 0.9, "pitch": 0.05 },
    "door":     { "files": ["interaction/door_01.ogg"] }
  },
  "ambience": {
    "village":  { "files": ["ambience/village_wind.ogg"], "gain": 0.7, "replaceSynth": true }
  },
  "music": {
    "sting":    { "files": ["music/sting_bell.ogg"] },
    "hotel":    { "files": ["music/hotel_theme.ogg"], "gain": 0.6, "loop": true }
  }
}
```

- **sfx keys** are the names the game already uses (the cases of `sfx()` in `audio.js`): footsteps
  `stepSnow`, `stepWood`; interaction `door`, `creak`, `curtain`, `page`, `pen`, `tick`, `refuse`,
  `lanternOn`, `lanternOff`, `whistle`, `chuff`, `steamHiss`, `scream`. One file is picked at random
  per play, with ± `pitch` playback variation.
- **ambience keys** are the scene `ambience` presets (`station`, `road`, `village`, `village_night`,
  `parlor`, `parlor_night`, `room4`, `creek`, `sawmill`, `title`). `replaceSynth: true` silences the
  synthesised beds for that key. Otherwise the recording plays alongside them.
- **music**: ids used by `audio.music(kind)` (`sting`, `title`) play once as cues. Any other id is a
  track for a scene's `music` property.
- `gain` defaults to 1.

5. Refresh the browser. Audio is decoded after the first key press or click, because browsers only
   allow sound after a user gesture. A missing or undecodable file logs `[audio] could not load …`, and
   that sound falls back to synthesis.

## Testing

`tests/e2e/audio.spec.mjs` checks the bus routing and per-bus volume. It also generates WAV files on the
fly to test the manifest → fetch → decode → play path, ambience and music crossfades, and the
fallback when a file is missing. Whether a sound *sounds* right is checked only by ear.
