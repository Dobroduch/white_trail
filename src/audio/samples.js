// Recorded/edited audio (Audacity exports) layered onto the synthesised soundscape in audio.js.
//
// Everything is optional and declared in assets/export/audio/manifest.json:
//   {
//     "sfx":      { "<sfx name>":  { "files": ["footsteps/snow_01.ogg", …], "gain": 1, "pitch": 0.05 } },
//     "ambience": { "<preset key>": { "files": ["ambience/village_wind.ogg"], "gain": 0.8, "replaceSynth": true } },
//     "music":    { "<track id>":  { "files": ["music/title.ogg"], "gain": 0.7, "loop": true } }
//   }
// Paths are relative to assets/export/audio/. A name that has a sample plays the sample (a random
// variant, with ±pitch playback jitter); any name without one keeps its synthesised sound, so files
// can be added one at a time. A missing manifest means "no samples" (not an error); a missing or
// undecodable file logs an error and that entry falls back to synthesis.
//
// Buses (see audio.js): sfx named step* -> footsteps bus, all other sfx -> interaction bus,
// ambience beds -> ambience bus, music -> music bus. All volume changes are smoothed.

const BASE = 'assets/export/audio/';

export class SampleBank {
  constructor(manifest = {}) {
    this.manifest = { sfx: {}, ambience: {}, music: {}, ...manifest };
    this.raw = new Map(); // path -> ArrayBuffer
    this.buffers = new Map(); // path -> AudioBuffer
    this.decoded = false;
    this.errors = [];
    this.beds = new Map(); // ambience key -> { src, gain }
    this.track = null; // { id, src, gain }
  }
  paths() {
    const out = new Set();
    for (const kind of ['sfx', 'ambience', 'music']) for (const e of Object.values(this.manifest[kind] || {})) for (const f of e.files || (e.file ? [e.file] : [])) out.add(f);
    return [...out];
  }
  async fetchAll() {
    await Promise.all(this.paths().map(async (p) => {
      try {
        const res = await fetch(BASE + p, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.raw.set(p, await res.arrayBuffer());
      } catch (err) { this.fail(`could not load ${BASE + p} (${err.message})`); }
    }));
  }
  async decode(ctx) {
    await Promise.all([...this.raw].map(async ([p, data]) => {
      try { this.buffers.set(p, await ctx.decodeAudioData(data.slice(0))); } catch (err) { this.fail(`could not decode ${BASE + p} (${err.message})`); }
    }));
    this.decoded = true;
  }
  fail(msg) { this.errors.push(msg); console.error('[audio] ' + msg + '; the synthesised sound is used instead.'); }
  entry(kind, id) {
    const e = this.manifest[kind] && this.manifest[kind][id];
    if (!e || !this.decoded) return null;
    const files = (e.files || (e.file ? [e.file] : [])).filter((f) => this.buffers.has(f));
    return files.length ? { ...e, files } : null;
  }
  has(kind, id) { return !!this.entry(kind, id); }

  // One-shot: a random variant, gain × vol, with optional pitch jitter. Returns true if played.
  play(ctx, dest, id, vol = 1, kind = 'sfx') {
    const e = this.entry(kind, id);
    if (!e) return false;
    const s = ctx.createBufferSource();
    s.buffer = this.buffers.get(e.files[Math.floor(Math.random() * e.files.length)]);
    if (e.pitch) s.playbackRate.value = 1 + (Math.random() * 2 - 1) * e.pitch;
    const g = ctx.createGain();
    g.gain.value = (e.gain != null ? e.gain : 1) * vol;
    s.connect(g).connect(dest);
    s.start();
    return true;
  }

  // Looping ambience beds: crossfade from whatever is playing to `key`'s bed (or to silence).
  setAmbience(ctx, dest, key, fade = 1.2) {
    const t = ctx.currentTime;
    for (const [k, bed] of this.beds) {
      if (k === key) continue;
      bed.gain.gain.cancelScheduledValues(t);
      bed.gain.gain.setTargetAtTime(0, t, fade / 3);
      bed.src.stop(t + fade * 2);
      this.beds.delete(k);
    }
    const e = this.entry('ambience', key);
    if (!e || this.beds.has(key)) return !!e;
    const src = ctx.createBufferSource();
    src.buffer = this.buffers.get(e.files[0]);
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(g).connect(dest);
    src.start(t, Math.random() * src.buffer.duration);
    g.gain.setTargetAtTime(e.gain != null ? e.gain : 1, t, fade / 3);
    this.beds.set(key, { src, gain: g });
    return true;
  }
  replacesSynth(key) { const e = this.entry('ambience', key); return !!(e && e.replaceSynth); }

  // Music: crossfade to track `id`; null fades the current track out.
  playMusic(ctx, dest, id, fade = 2.5) {
    if (this.track && this.track.id === id) return true;
    const t = ctx.currentTime;
    if (this.track) {
      const old = this.track;
      old.gain.gain.cancelScheduledValues(t);
      old.gain.gain.setTargetAtTime(0, t, fade / 3);
      old.src.stop(t + fade * 2);
      this.track = null;
    }
    const e = id ? this.entry('music', id) : null;
    if (!e) return false;
    const src = ctx.createBufferSource();
    src.buffer = this.buffers.get(e.files[0]);
    src.loop = e.loop !== false;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(g).connect(dest);
    src.start(t);
    g.gain.setTargetAtTime(e.gain != null ? e.gain : 1, t, fade / 3);
    this.track = { id, src, gain: g };
    if (!src.loop) src.onended = () => { if (this.track && this.track.src === src) this.track = null; };
    return true;
  }
}

/** Fetch the manifest and files at boot (decoding waits for the AudioContext, i.e. a user gesture). */
export async function loadAudioBank(audio, url = BASE + 'manifest.json') {
  let manifest = {};
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (res.ok) manifest = await res.json();
    else if (res.status !== 404) console.error(`[audio] ${url}: HTTP ${res.status}; no recorded audio will be used.`);
  } catch (err) {
    console.error(`[audio] ${url} is not valid JSON (${err.message}); no recorded audio will be used.`);
  }
  const bank = new SampleBank(manifest);
  await bank.fetchAll();
  audio.attachBank(bank);
  return bank;
}
