// Web Audio soundscape. Everything is synthesised — no audio files, no network.
// The AudioContext is created only after a user gesture (browser autoplay policy).
// Buses: master <- { ambience, effects, music }. A generated convolution reverb gives distance.

// WIND_ONLY: the continuous ambience is wind (and its gusts) alone. The other beds — fire roar and
// crackle, room tone, parlour murmur, water under ice, steam hiss, train rumble, drone, incidental
// creaks — are kept in code but silenced, so they can be reintroduced one at a time later.
// One-shot effects (footsteps, doors, whistle, the 02:15 scream, notebook sounds) are unaffected.
export const WIND_ONLY = true;

const PRESETS = {
  //            wind  muffle  fire  room  murmur water hiss  drone
  silence:     [0.04, true,   0,    0.15, 0,     0,    0,    0],
  title:       [0.55, false,  0,    0,    0,     0,    0,    0.5],
  station:     [0.42, false,  0,    0,    0,     0,    0.12, 0],
  road:        [0.7,  false,  0,    0,    0,     0,    0,    0],
  village:     [0.55, false,  0,    0,    0,     0,    0,    0],
  village_night:[0.85,false,  0,    0,    0,     0,    0,    0.25],
  parlor:      [0.22, true,   0.55, 0.35, 0.45,  0,    0,    0],
  parlor_night:[0.3,  true,   0.08, 0.45, 0,     0,    0,    0.2],
  room4:       [0.36, true,   0,    0.45, 0,     0,    0,    0],
  creek:       [0.8,  false,  0,    0,    0,     0.55, 0,    0.25],
  sawmill:     [0.72, false,  0,    0,    0,     0.4,  0,    0.35],
};

export class Audio {
  constructor(settings) {
    this.ctx = null;
    this.settings = settings;
    this.pendingAmbience = 'title';
    this.creakTimer = 4;
    this.crackleTimer = 0;
    this.gustTimer = 6;
    this.preset = PRESETS.title;
    this.ambienceKey = 'title';
    this.windDipValue = null;
  }

  get ready() { return !!this.ctx; }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { console.warn('[audio] Web Audio not supported; continuing silently.'); return; }
    try {
      this.ctx = new AC();
    } catch (err) {
      console.warn('[audio] could not create AudioContext:', err.message);
      return;
    }
    this.init(this.ctx);
  }

  // Builds the whole graph on a given context (an OfflineAudioContext works too — used by tests).
  init(c) {
    this.ctx = c;
    this.master = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    this.master.connect(comp).connect(c.destination);
    this.amb = c.createGain(); this.amb.connect(this.master);
    this.fx = c.createGain(); this.fx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master);
    this.reverb = c.createConvolver();
    this.reverb.buffer = this.impulse(3.2, 2.6);
    this.reverbOut = c.createGain(); this.reverbOut.gain.value = 0.55;
    this.reverb.connect(this.reverbOut).connect(this.master);
    this.white = this.noiseBuffer('white');
    this.brown = this.noiseBuffer('brown');
    this.applyVolumes();
    this.buildAmbience();
    this.setAmbience(this.pendingAmbience, true);
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.settings;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.master, t, 0.05);
    this.amb.gain.setTargetAtTime(s.ambience, t, 0.05);
    this.fx.gain.setTargetAtTime(s.effects, t, 0.05);
    this.mus.gain.setTargetAtTime(s.music, t, 0.05);
  }

  // ---------- buffers ----------
  // Seamlessly looping noise: the tail is generated past the end and cross-faded (equal power)
  // into the head, so the loop point has no discontinuity (a seam would click every cycle).
  noiseBuffer(kind) {
    const c = this.ctx, len = c.sampleRate * 8, fade = Math.floor(c.sampleRate * 0.5);
    const raw = new Float32Array(len + fade);
    let last = 0;
    for (let i = 0; i < raw.length; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; raw[i] = last * 3.5; } else raw[i] = w;
    }
    if (kind === 'brown') { // remove DC drift so head and tail sit around the same level
      let mean = 0; for (let i = 0; i < raw.length; i++) mean += raw[i];
      mean /= raw.length; for (let i = 0; i < raw.length; i++) raw[i] -= mean;
    }
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    d.set(raw.subarray(0, len));
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      d[i] = raw[i] * Math.sin(t * Math.PI / 2) + raw[len + i] * Math.cos(t * Math.PI / 2);
    }
    return b;
  }
  impulse(seconds, decay) {
    const c = this.ctx, len = Math.floor(c.sampleRate * seconds);
    const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }
  loopSource(buf) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf; s.loop = true; // whole-buffer loop: the seam is cross-faded
    s.start(0, Math.random() * buf.duration);
    return s;
  }
  lfo(freq, depth, target) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.value = freq; g.gain.value = depth;
    o.connect(g).connect(target); o.start();
    return o;
  }

  // ---------- continuous layers ----------
  buildAmbience() {
    const c = this.ctx;
    const L = (this.layers = {});
    // Wind: one smooth, low roar — seamless brown noise through a gentle 24 dB/oct low-pass whose
    // cutoff drifts very slowly. Gusts are slow swells of this same bed (no narrow-band noise, no
    // whistle layer: those read as scuffing/rubbing).
    {
      const src = this.loopSource(this.brown);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.5;
      const lp2 = c.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 900; lp2.Q.value = 0.5;
      this.lfo(0.031, 110, lp.frequency);
      const swell = c.createGain(); swell.gain.value = 1;
      const muffle = c.createBiquadFilter(); muffle.type = 'lowpass'; muffle.frequency.value = 2400; muffle.Q.value = 0.5;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(lp).connect(lp2).connect(swell).connect(muffle).connect(g).connect(this.amb);
      L.wind = { gain: g, muffle, swell, lp };
    }
    // Fire: low roar (crackles are scheduled as events)
    {
      const src = this.loopSource(this.brown);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(lp).connect(g).connect(this.amb);
      L.fire = { gain: g };
    }
    // Room tone: very low hum of an old building
    {
      const src = this.loopSource(this.brown);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 110;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(lp).connect(g).connect(this.amb);
      L.room = { gain: g };
    }
    // Murmur: indistinct voices — band-limited noise with syllabic amplitude motion.
    {
      const src = this.loopSource(this.white);
      const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 420; f1.Q.value = 3;
      const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 900;
      this.lfo(0.9, 140, f1.frequency);
      const am = c.createGain(); am.gain.value = 0.5;
      this.lfo(4.6, 0.35, am.gain); this.lfo(2.3, 0.2, am.gain);
      const g = c.createGain(); g.gain.value = 0;
      src.connect(f1).connect(f2).connect(am).connect(g).connect(this.amb);
      L.murmur = { gain: g, level: 1 };
    }
    // Water under ice
    {
      const src = this.loopSource(this.white);
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 1.4;
      this.lfo(3.1, 420, bp.frequency); this.lfo(7.7, 220, bp.frequency);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(bp).connect(lp).connect(g).connect(this.amb);
      L.water = { gain: g };
    }
    // Idle steam hiss at the station
    {
      const src = this.loopSource(this.white);
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3200;
      // The pulsing LFO sits on an inner stage. It must never drive the controlled output gain
      // directly: an LFO added to a gain of 0 swings it to ±depth, which played this hiss
      // ("shhh… shhh…") in every scene even though the layer was set to silent.
      const pulse = c.createGain(); pulse.gain.value = 0.7;
      this.lfo(0.3, 0.3, pulse.gain);
      const g = c.createGain(); g.gain.value = 0;
      src.connect(hp).connect(pulse).connect(g).connect(this.amb);
      L.hiss = { gain: g };
    }
    // Train rumble (envelope driven)
    {
      const src = this.loopSource(this.brown);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 140;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(lp).connect(g).connect(this.amb);
      L.rumble = { gain: g };
    }
    // Drone: two detuned low saws, heavily filtered. Sparse; often silent.
    {
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; lp.Q.value = 2;
      this.lfo(0.04, 80, lp.frequency);
      const g = c.createGain(); g.gain.value = 0;
      for (const f of [55, 55.4, 82.4]) {
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start();
      }
      lp.connect(g).connect(this.mus);
      L.drone = { gain: g };
    }
  }

  setAmbience(key, instant = false) {
    this.ambienceKey = key;
    this.preset = PRESETS[key] || PRESETS.silence;
    if (!PRESETS[key]) console.warn(`[audio] unknown ambience "${key}"`);
    if (!this.ctx) { this.pendingAmbience = key; return; }
    let [wind, muffle, fire, room, murmur, water, hiss, drone] = this.preset;
    if (WIND_ONLY) fire = room = murmur = water = hiss = drone = 0;
    const t = this.ctx.currentTime, k = instant ? 0.01 : 1.2;
    const L = this.layers;
    const w = this.windDipValue != null ? this.windDipValue : wind;
    L.wind.gain.gain.setTargetAtTime(w, t, k);
    L.wind.muffle.frequency.setTargetAtTime(muffle ? 300 : 2400, t, k * 0.5);
    L.fire.gain.gain.setTargetAtTime(fire * 0.9, t, k);
    L.room.gain.gain.setTargetAtTime(room * 0.5, t, k);
    L.murmur.gain.gain.setTargetAtTime(murmur * 0.22 * L.murmur.level, t, k);
    L.water.gain.gain.setTargetAtTime(water * 0.16, t, k);
    L.hiss.gain.gain.setTargetAtTime(hiss * 0.08, t, k);
    L.drone.gain.gain.setTargetAtTime(drone * 0.05, t, k * 3);
  }

  windDip(v) {
    this.windDipValue = v;
    if (!this.ctx) return;
    const target = v != null ? v : this.preset[0];
    this.layers.wind.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.8);
  }

  murmur(level) {
    if (!this.ctx) return;
    const L = this.layers.murmur;
    L.level = level;
    L.gain.gain.setTargetAtTime(this.preset[4] * 0.22 * level, this.ctx.currentTime, 0.15);
    if (level === 0) {
      // conversation resumes, more quietly, after a while
      clearTimeout(this._murmurT);
      this._murmurT = setTimeout(() => { L.level = 0.55; if (this.ambienceKey === 'parlor') this.setAmbience('parlor'); }, 9000);
    }
  }

  trainRumble() {
    if (!this.ctx || WIND_ONLY) return;
    const g = this.layers.rumble.gain.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.5, t, 0.6);
    g.setTargetAtTime(0, t + 5.5, 1.2);
  }

  // per-frame: scheduled incidental sounds
  update(dt, ctxInfo) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const [wind, muffle, fire, room, , water] = this.preset;
    if (!WIND_ONLY && fire > 0.05) {
      this.crackleTimer -= dt;
      if (this.crackleTimer <= 0) { this.crackleTimer = 0.04 + Math.random() * 0.35 / fire; this.crackle(fire); }
    }
    this.creakTimer -= dt;
    if (!WIND_ONLY && this.creakTimer <= 0) {
      this.creakTimer = 5 + Math.random() * 9;
      if (room > 0.1) this.sfx('creak', { vol: 0.35 });
      else if (ctxInfo && ctxInfo.scene === 'SAWMILL') this.sfx('creak', { vol: 0.5, low: true });
    }
    if (!muffle && wind > 0.5) {
      this.gustTimer -= dt;
      if (this.gustTimer <= 0) { this.gustTimer = 7 + Math.random() * 10; this.gust(wind); }
    }
    void water;
  }

  // ---------- one-shot helpers ----------
  env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  noise(dest, { type = 'bandpass', freq = 1000, q = 1, a = 0.005, d = 0.1, peak = 0.3, when = 0, buf = this.white, freqEnd = null }) {
    const c = this.ctx, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + a + d);
    const g = c.createGain();
    this.env(g, t, a, peak, d);
    s.connect(f).connect(g).connect(dest);
    s.start(t, Math.random() * 2, a + d + 0.05);
    return g;
  }
  tone(dest, { type = 'sine', freq = 440, a = 0.01, d = 0.3, peak = 0.2, when = 0, freqEnd = null }) {
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + a + d);
    const g = c.createGain();
    this.env(g, t, a, peak, d);
    o.connect(g).connect(dest);
    o.start(t); o.stop(t + a + d + 0.05);
    return o;
  }
  crackle(level) {
    this.noise(this.amb, { type: 'highpass', freq: 1800 + Math.random() * 2500, q: 0.7, a: 0.001, d: 0.02 + Math.random() * 0.04, peak: 0.05 + Math.random() * 0.12 * level });
  }
  // A gust: the wind bed swells and opens up a little, then settles — smooth ramps only.
  gust(level) {
    const c = this.ctx, t = c.currentTime;
    const W = this.layers.wind;
    const peak = 1 + 0.35 * level + Math.random() * 0.15;
    W.swell.gain.cancelScheduledValues(t);
    W.swell.gain.setValueAtTime(W.swell.gain.value, t);
    W.swell.gain.linearRampToValueAtTime(peak, t + 2.2);
    W.swell.gain.linearRampToValueAtTime(1, t + 5.5);
  }

  sfx(name, opt = {}) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const vol = opt.vol != null ? opt.vol : 1;
    const fx = this.fx;
    switch (name) {
      case 'stepSnow': {
        const p = 0.9 + Math.random() * 0.25;
        this.noise(fx, { type: 'bandpass', freq: 1500 * p, q: 0.9, a: 0.004, d: 0.09, peak: 0.12 * vol });
        this.noise(fx, { type: 'highpass', freq: 3500 * p, q: 0.5, a: 0.01, d: 0.05, peak: 0.05 * vol, when: 0.02 });
        this.noise(fx, { type: 'lowpass', freq: 220, a: 0.003, d: 0.07, peak: 0.12 * vol, buf: this.brown });
        break;
      }
      case 'stepWood': {
        this.noise(fx, { type: 'lowpass', freq: 380 + Math.random() * 80, a: 0.002, d: 0.08, peak: 0.25 * vol, buf: this.brown });
        this.noise(fx, { type: 'bandpass', freq: 2200, q: 2, a: 0.001, d: 0.02, peak: 0.04 * vol });
        break;
      }
      case 'whistle': {
        const c = this.ctx, t = c.currentTime;
        const out = c.createGain(); out.gain.value = 0.95 * vol;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
        const send = c.createGain(); send.gain.value = 0.8;
        out.connect(lp).connect(fx); lp.connect(send).connect(this.reverb);
        for (const f of [392, 494, 587]) {
          const o = c.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(f * 0.94, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.25);
          o.frequency.setValueAtTime(f, t + 1.7); o.frequency.exponentialRampToValueAtTime(f * 0.97, t + 2.4);
          const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 2;
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.18);
          g.gain.setValueAtTime(0.09, t + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
          o.connect(bp).connect(g).connect(out); o.start(t); o.stop(t + 2.6);
        }
        this.noise(out, { type: 'bandpass', freq: 1400, q: 1, a: 0.1, d: 2.2, peak: 0.05 });
        break;
      }
      case 'chuff':
        this.noise(fx, { type: 'lowpass', freq: 700, a: 0.01, d: 0.22, peak: 0.12 * vol, freqEnd: 300 });
        break;
      case 'steamHiss':
        this.noise(fx, { type: 'highpass', freq: 2600, a: 0.05, d: 2.4, peak: 0.12 * vol });
        break;
      case 'door':
        this.noise(fx, { type: 'lowpass', freq: 240, a: 0.004, d: 0.2, peak: 0.35 * vol, buf: this.brown });
        this.tone(fx, { type: 'sawtooth', freq: 160, freqEnd: 120, a: 0.05, d: 0.35, peak: 0.02 * vol });
        break;
      case 'creak': {
        const c = this.ctx, t = c.currentTime;
        const o = c.createOscillator(); o.type = 'sawtooth';
        const base = opt.low ? 55 : 85 + Math.random() * 40;
        o.frequency.setValueAtTime(base, t);
        o.frequency.linearRampToValueAtTime(base * (1.2 + Math.random() * 0.3), t + 0.5);
        o.frequency.linearRampToValueAtTime(base * 0.9, t + 0.9);
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = opt.low ? 380 : 700; bp.Q.value = 7;
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * vol, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
        o.connect(bp).connect(g).connect(fx); o.start(t); o.stop(t + 1.1);
        break;
      }
      case 'curtain':
        this.noise(fx, { type: 'bandpass', freq: 1800, q: 1, a: 0.08, d: 0.35, peak: 0.05 * vol, freqEnd: 900 });
        break;
      case 'scream': this.scream(vol); break;
      case 'pen':
        for (let i = 0; i < 4; i++) this.noise(fx, { type: 'highpass', freq: 3200, a: 0.004, d: 0.035, peak: 0.05 * vol, when: i * 0.07 + Math.random() * 0.03 });
        break;
      case 'page':
        this.noise(fx, { type: 'bandpass', freq: 2500, q: 0.8, a: 0.03, d: 0.18, peak: 0.07 * vol, freqEnd: 1200 });
        break;
      case 'tick':
        this.tone(fx, { type: 'triangle', freq: 1400, a: 0.002, d: 0.03, peak: 0.03 * vol });
        break;
      case 'lanternOn':
        this.tone(fx, { type: 'square', freq: 2400, a: 0.001, d: 0.015, peak: 0.02 * vol });
        this.noise(fx, { type: 'lowpass', freq: 300, a: 0.06, d: 0.3, peak: 0.08 * vol, freqEnd: 900 });
        break;
      case 'lanternOff':
        this.tone(fx, { type: 'square', freq: 1800, a: 0.001, d: 0.015, peak: 0.02 * vol });
        this.noise(fx, { type: 'lowpass', freq: 600, a: 0.01, d: 0.12, peak: 0.04 * vol, freqEnd: 200 });
        break;
      case 'refuse':
        this.tone(fx, { type: 'sine', freq: 220, a: 0.01, d: 0.18, peak: 0.05 * vol });
        break;
      default: console.warn(`[audio] unknown sfx "${name}"`);
    }
  }

  // A distant human scream: a voiced source through vowel formants, pitch rising then breaking,
  // filtered by distance and sent into a long reverb. Heard once, at 02:15.
  scream(vol) {
    const c = this.ctx, t = c.currentTime + 0.05;
    const dur = 2.1;
    const out = c.createGain(); out.gain.value = 0.9 * vol;
    const dist = c.createBiquadFilter(); dist.type = 'lowpass'; dist.frequency.value = 2600;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 280;
    const send = c.createGain(); send.gain.value = 1.4;
    out.connect(hp).connect(dist).connect(this.fx);
    dist.connect(send).connect(this.reverb);
    const src = c.createOscillator(); src.type = 'sawtooth';
    const f0 = 520;
    src.frequency.setValueAtTime(f0 * 0.8, t);
    src.frequency.exponentialRampToValueAtTime(f0 * 1.45, t + 0.35);
    src.frequency.setValueAtTime(f0 * 1.45, t + 1.0);
    src.frequency.exponentialRampToValueAtTime(f0 * 1.15, t + 1.5);
    src.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + dur);
    const vib = c.createOscillator(); vib.frequency.value = 6.5;
    const vibG = c.createGain(); vibG.gain.value = 18;
    vib.connect(vibG).connect(src.frequency);
    const jit = c.createBufferSource(); jit.buffer = this.white;
    const jitF = c.createBiquadFilter(); jitF.type = 'lowpass'; jitF.frequency.value = 30;
    const jitG = c.createGain(); jitG.gain.value = 260;
    jit.connect(jitF).connect(jitG).connect(src.frequency);
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.5, t + 0.12);
    env.gain.setValueAtTime(0.5, t + 1.1);
    env.gain.exponentialRampToValueAtTime(0.25, t + 1.5);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // "ah" formants
    for (const [f, q, g] of [[850, 6, 1], [1250, 8, 0.6], [2650, 10, 0.25]]) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      const gg = c.createGain(); gg.gain.value = g;
      src.connect(bp).connect(gg).connect(env);
    }
    // breath
    const br = c.createBufferSource(); br.buffer = this.white;
    const brF = c.createBiquadFilter(); brF.type = 'bandpass'; brF.frequency.value = 1600; brF.Q.value = 0.8;
    const brG = c.createGain(); brG.gain.value = 0.12;
    br.connect(brF).connect(brG).connect(env);
    env.connect(out);
    src.start(t); vib.start(t); jit.start(t); br.start(t);
    for (const n of [src, vib, jit, br]) n.stop(t + dur + 0.1);
  }

  music(kind) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (kind === 'sting') {
      // a low struck bell and a swell of the drone
      for (const [mult, peak, d] of [[1, 0.09, 4.5], [2.76, 0.04, 3.2], [5.4, 0.02, 2.0], [0.5, 0.06, 5]]) {
        this.tone(this.mus, { type: 'sine', freq: 98 * mult, a: 0.005, d, peak });
      }
      if (WIND_ONLY) return;
      const g = this.layers.drone.gain.gain;
      g.cancelScheduledValues(t);
      g.setTargetAtTime(0.07, t, 0.8);
      g.setTargetAtTime(this.preset[7] * 0.05, t + 6, 2.5);
    } else if (kind === 'title') {
      this.tone(this.mus, { type: 'sine', freq: 73.4, a: 0.01, d: 5, peak: 0.06 });
      this.tone(this.mus, { type: 'sine', freq: 146.8 * 1.5, a: 0.01, d: 3, peak: 0.02, when: 0.02 });
    }
  }
}
