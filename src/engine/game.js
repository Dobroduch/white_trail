// Game orchestration: modes, scenes, update order, render passes, overlays and checkpoints.
import { Display, VIEW_W, VIEW_H, WORLD_SCALE, FB_W, FB_H, FB_SCALE, FB_PER_WORLD, UI_W, UI_H, UI_SCALE, snapN } from './display.js';
import { Camera } from './camera.js';
import { getLayers } from '../world/painters.js';
import { SCENES, GLOBAL_EVENTS } from '../world/scenes.js';
import { PROP_FACTORIES } from '../world/props.js';
import { Weather } from '../world/weather.js';
import { renderLighting } from '../world/lighting.js';
import { Silas } from '../entities/silas.js';
import { NPC } from '../entities/npc.js';
import { newState, test, apply, advanceTime, timeString } from '../systems/storyState.js';
import { saveGame, loadGame, hasSave, clearSave, saveSettings } from '../systems/save.js';
import { DialogueRunner } from '../systems/dialogue.js';
import { Cutscene } from '../systems/cutscene.js';
import { LANTERN, toggleLantern, updateLantern, updateWarmth } from '../systems/survival.js';
import { EVIDENCE } from '../data/evidence.js';
import { ITEMS } from '../data/notebookData.js';
import { HUD } from '../ui/hud.js';
import { DialogueView } from '../ui/dialogueView.js';
import { Notebook } from '../ui/notebook.js';
import { TitleMenu, PauseMenu, SettingsMenu, ControlsHelp, Confirm, Inventory, DocumentView, EndCard } from '../ui/menus.js';
import { UI, font, text, wrap } from '../ui/text.js';

const INTERACT_RADIUS = 20;

export class Game {
  constructor({ display, input, audio, settings }) {
    this.display = display; this.input = input; this.audio = audio; this.settings = settings;
    this.camera = new Camera();
    this.weather = new Weather();
    this.player = new Silas();
    this.hud = new HUD(this);
    this.dialogue = new DialogueRunner(this);
    this.dialogueView = new DialogueView(this);
    this.notebook = new Notebook(this);
    this.state = newState();
    this.mode = 'title';
    this.overlays = [];
    this.time = 0;
    this.fade = { v: 1, target: 0, speed: 1 };
    this.card = null;
    this.cutscene = null;
    this.scriptQueue = [];
    this.playerControl = true;
    this.eventTimers = {};
    this.npcs = []; this.props = [];
    this.errorsSeen = new Set();
    this.applySettings(false);
    this.toTitle();
  }

  // ---------------- settings / save ----------------
  applySettings(persist = true) {
    this.camera.reduced = !!this.settings.reducedMotion;
    this.display.setMode(this.settings.scaling);
    this.audio.settings = this.settings;
    this.audio.applyVolumes();
    if (persist) saveSettings(this.settings);
  }
  hasSave() { return hasSave(); }
  checkpoint() {
    if (this.mode !== 'play') return;
    this.state.scene = this.scene.id;
    this.state.playerX = Math.round(this.player.x);
    this.state.facing = this.player.facing;
    saveGame(this.state);
  }

  // ---------------- modes ----------------
  toTitle() {
    this.mode = 'title';
    this.overlays = [new TitleMenu(this)];
    this.cutscene = null; this.scriptQueue = [];
    this.dialogue.active = false;
    this.hud.clear();
    this.card = null;
    this.scene = { id: 'TITLE', name: '', width: 640, exterior: true, bounds: [0, 640], ground: [[0, 160], [640, 160]] };
    this.layers = getLayers('TITLE', 'EVENING', 640);
    this.npcs = []; this.props = [];
    this.weather.configure({ snow: 0.75, wind: 0.6, fog: 0.35 }, 0, true);
    this.titlePan = 0;
    this.fadeTo(0, 2);
    this.audio.setAmbience('title');
  }

  newGame() {
    clearSave();
    this.state = newState();
    this.startPlay('STATION', 'start');
  }
  continueGame() {
    const s = loadGame();
    if (!s) { this.newGame(); return; }
    this.state = s;
    this.startPlay(s.scene, null, s.playerX, s.facing);
  }
  startPlay(sceneId, spawn, x, facing) {
    this.mode = 'play';
    this.overlays = [];
    this.hud.clear();
    this.cutscene = null; this.scriptQueue = [];
    this.playerControl = true;
    this.windOverride = null;
    this.audio.windDip(null);
    this.ridgeLight = null;
    this.camera.override = null;
    this.loadScene(sceneId, spawn, x, facing);
    this.fade.v = 1; this.fadeTo(0, 1.2);
  }

  // ---------------- scenes ----------------
  sceneDef(id) {
    const base = SCENES[id];
    if (!base) { console.error(`[scene] unknown scene "${id}", falling back to STATION`); return this.sceneDef('STATION'); }
    const d = Object.assign({ id }, base);
    if (this.state.phase === 'NIGHT' && base.night) Object.assign(d, base.night);
    return d;
  }

  loadScene(id, spawnKey, x, facing) {
    const def = this.sceneDef(id);
    this.scene = def;
    this.state.scene = def.id;
    this.layers = getLayers(def.id, this.state.phase, def.width);
    const groundAt = (gx) => this.groundAt(gx);
    this.npcs = (def.npcs || []).filter((n) => test(n.if, this.state) && this.state.chars[n.id] && this.state.chars[n.id].alive !== false)
      .map((n) => new NPC(n, groundAt));
    this.props = (def.props || []).filter((p) => test(p.if, this.state)).map((p) => {
      const f = PROP_FACTORIES[p.type];
      if (!f) { console.error(`[scene] unknown prop type "${p.type}"`); return null; }
      const prop = f(...(p.args || []));
      prop.id = p.id || p.type;
      return prop;
    }).filter(Boolean);
    // train placement depends on story state, never on a replayed event
    const train = this.props.find((p) => p.id === 'train');
    if (train) {
      if (this.state.flags.trainDeparted) train.hide();
      else if (this.state.flags.introDone) train.placeStopped();
    }
    let px = x;
    let pf = facing;
    if (px == null) {
      const sp = (def.spawns && def.spawns[spawnKey]) || Object.values(def.spawns)[0];
      px = sp.x; pf = sp.facing;
    }
    this.player.hidden = false;
    this.player.place(px, pf || 1, groundAt);
    this.camera.snap(px, def.width);
    this.weather.configure(def.weather, this.camera.pos, true);
    this.audio.setAmbience(def.ambience);
    this.eventTimers = {};
    this.exitCooldown = 0.4;
    this.camera.setMode('exploration');
  }

  // Re-apply scene data after a story phase change, keeping Silas where he is.
  reloadScene() {
    const x = this.player.x, f = this.player.facing;
    this.loadScene(this.scene.id, null, x, f);
  }

  groundAt(x) {
    const pts = this.scene.ground;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      if (x >= x0 && x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
    return pts[pts.length - 1][1];
  }

  transitionTo(to, spawn, minutes) {
    if (this.transition) return;
    this.transition = { to, spawn, t: 0, swapped: false, minutes };
    this.playerControl = false;
    this.fadeTo(1, 0.4);
    if (!this.scene.exterior || !SCENES[to].exterior) this.audio.sfx('door', { vol: 0.7 });
  }
  updateTransition(dt) {
    const tr = this.transition;
    if (!tr) return;
    tr.t += dt;
    if (!tr.swapped && tr.t >= 0.42) {
      tr.swapped = true;
      advanceTime(this.state, tr.minutes != null ? tr.minutes : SCENES[tr.to].travel != null ? SCENES[tr.to].travel : 2);
      this.loadScene(tr.to, tr.spawn);
      this.hud.showLabel(this.scene, this.state);
      this.checkpoint();
      this.fadeTo(0, 0.5);
    }
    if (tr.swapped && tr.t >= 0.95) { this.transition = null; this.playerControl = true; }
  }

  fadeTo(v, dur) { this.fade.target = v; this.fade.speed = dur <= 0 ? 1e9 : Math.abs(v - this.fade.v) / dur; if (dur <= 0) this.fade.v = v; }

  // ---------------- scripts / dialogue ----------------
  runScript(id) {
    if (this.cutscene && !this.cutscene.done) { this.scriptQueue.push(id); return; }
    this.cutscene = new Cutscene(this, id);
  }
  startDialogue(id, npc = null) {
    this.dialogue.start(id, { speakerNpc: npc });
    if (npc) {
      this.camera.setMode('dialogue', { x: npc.x, y: npc.y - 18 });
      // keep a natural conversational distance
      const dx = this.player.x - npc.x;
      if (Math.abs(dx) < 17) {
        const side = dx === 0 ? -npc.facing : Math.sign(dx);
        const tx = Math.max(this.scene.bounds[0], Math.min(this.scene.bounds[1], npc.x + side * 18));
        if (Math.abs(tx - npc.x) >= 12) { this.player.autoTarget = tx; this.player.backstep = true; }
      }
      this.player.facing = npc.x >= (this.player.autoTarget ?? this.player.x) ? 1 : -1;
    }
  }
  focusDialogue(who) {
    const npc = this.npcs.find((n) => n.id === who && !n.hidden);
    if (npc) this.camera.setMode('dialogue', { x: npc.x, y: npc.y - 18 });
  }
  onDialogueNode(runner) { this.dialogueView.onNode(runner); if (runner.lastWho) this.focusDialogue(runner.lastWho); }
  onDialogueEnd() { this.camera.setMode('exploration'); this.input.clearAll(); this.dialogueCooldown = 0.2; }

  handleEffects(results, pendingScripts) {
    for (const r of results) {
      if (r.noted) { this.hud.noted(r.noted, r.detail); this.audio.sfx('pen'); this.checkpointSoon = true; }
      if (r.item && ITEMS[r.item]) this.hud.item(ITEMS[r.item].name);
      if (r.script) { if (pendingScripts) pendingScripts.push(r.script); else this.runScript(r.script); }
    }
  }

  // ---------------- overlays ----------------
  pushOverlay(o) { this.overlays.push(o); this.input.clearAll(); }
  get overlay() { return this.overlays[this.overlays.length - 1] || null; }
  popOverlay() { this.overlays.pop(); this.input.clearAll(); }
  openDocument(id) { this.pushOverlay(new DocumentView(this, id)); this.audio.sfx('page'); }
  openEndCard() { this.pushOverlay(new EndCard(this)); }

  handleOverlayAction(act) {
    const o = this.overlay;
    if (!act) return;
    if (o instanceof TitleMenu) {
      if (act === 'continue') { this.audio.unlock(); this.continueGame(); }
      else if (act === 'new') {
        if (this.hasSave()) this.pushOverlay(new Confirm(this, 'Begin a new investigation? Your saved progress will be lost.', 'confirmNew'));
        else this.newGame();
      }
      else if (act === 'settings') this.pushOverlay(new SettingsMenu(this));
      else if (act === 'controls') this.pushOverlay(new ControlsHelp(this));
      return;
    }
    if (act === 'confirmNew') { this.newGame(); return; }
    if (act === 'confirmRestart') { this.newGame(); return; }
    if (act === 'confirmTitle') { this.checkpoint(); this.toTitle(); return; }
    if (act === 'back' || act === 'close' || act === 'resume') { this.popOverlay(); this.audio.resume(); return; }
    if (o instanceof PauseMenu) {
      if (act === 'notebook') { this.notebook.open(); this.pushOverlay(this.notebookOverlay()); }
      else if (act === 'inventory') this.pushOverlay(new Inventory(this));
      else if (act === 'settings') this.pushOverlay(new SettingsMenu(this));
      else if (act === 'controls') this.pushOverlay(new ControlsHelp(this));
      else if (act === 'restart') this.pushOverlay(new Confirm(this, 'Restart from the train? All progress will be lost.', 'confirmRestart'));
      else if (act === 'title') this.pushOverlay(new Confirm(this, 'Save at this checkpoint and return to the title?', 'confirmTitle'));
      return;
    }
    if (o instanceof Inventory && act.startsWith('doc:')) { this.openDocument(act.slice(4)); return; }
    if (o instanceof EndCard) {
      if (act === 'continue') { this.popOverlay(); this.loadScene('SAWMILL', 'fromCreek'); this.fadeTo(0, 1.2); this.playerControl = true; this.cutscene = null; }
      if (act === 'title') this.toTitle();
    }
  }
  notebookOverlay() {
    const nb = this.notebook;
    return { update: (input) => nb.update(input), draw: (ctx) => nb.draw(ctx), isNotebook: true };
  }

  // ---------------- per-step update ----------------
  update(dt) {
    try {
      this.step(dt);
    } catch (err) {
      const key = String(err && err.message);
      if (!this.errorsSeen.has(key)) { this.errorsSeen.add(key); console.error('[game] update error:', err); }
    }
    this.input.endStep();
  }

  canMove() { return this.mode === 'play' && this.playerControl && !this.dialogue.active && !this.transition && !this.overlay && !this.cutsceneBlocking(); }
  cutsceneBlocking() { return !!(this.cutscene && !this.cutscene.done && !this.cutscene.ambient); }
  canInteractUI() { return this.canMove() && (this.dialogueCooldown || 0) <= 0; }

  step(dt) {
    const input = this.input;
    // fades always progress
    const f = this.fade;
    if (f.v !== f.target) { const d = f.speed * dt; f.v = f.v < f.target ? Math.min(f.target, f.v + d) : Math.max(f.target, f.v - d); }

    if (input.anyPressed) this.audio.unlock();

    const ov = this.overlay;
    if (ov) {
      const act = ov.update(input);
      if (act) this.handleOverlayAction(act);
      if (this.mode === 'title') this.updateWorld(dt, true);
      else if (ov instanceof DocumentView && this.overlays.length === 1) this.updateWorld(dt, false); // let the snow fall behind the telegram
      return;
    }
    if (this.mode !== 'play') return;

    // global keys
    if (input.pressed('pause')) { this.pushOverlay(new PauseMenu(this)); return; } // also pauses mid-dialogue
    const free = !this.dialogue.active && !this.transition && !this.cutsceneBlocking();
    if (input.pressed('notebook') && free) { this.notebook.open(); this.pushOverlay(this.notebookOverlay()); return; }
    if (input.pressed('inventory') && free) { this.pushOverlay(new Inventory(this)); return; }
    if (input.pressed('lantern') && this.playerControl && !this.dialogue.active) {
      if (toggleLantern(this.state)) this.audio.sfx(this.state.lanternOn ? 'lanternOn' : 'lanternOff');
    }

    if (this.dialogue.active) this.dialogueView.update(dt, input);
    if (this.dialogueCooldown > 0) this.dialogueCooldown -= dt;

    this.updateWorld(dt, false);

    // interaction
    this.prompt = this.findPrompt();
    if (this.prompt && this.canInteractUI() && input.pressed('interact')) this.interact(this.prompt.target);
    this.updatePointer();

    // cutscenes
    if (this.cutscene) {
      this.cutscene.update(dt);
      if (this.cutscene.done) {
        this.cutscene = null;
        if (this.scriptQueue.length) this.runScript(this.scriptQueue.shift());
      }
    }
    this.updateTransition(dt);
    if (!this.transition) this.checkExits(dt);
    this.checkEvents(dt);
    if (this.checkpointSoon && !this.dialogue.active) { this.checkpointSoon = false; this.checkpoint(); }
  }

  updateWorld(dt, titleMode) {
    this.time += dt;
    if (titleMode) {
      this.titlePan += dt * 7;
      const max = 640 - VIEW_W;
      this.camera.x = (Math.sin(this.titlePan / 140) * 0.5 + 0.5) * max;
      this.weather.update(dt, this.camera.pos, null);
      return;
    }
    this.player.update(dt, this);
    for (const n of this.npcs) n.update(dt, this);
    for (const p of this.props) p.update && p.update(dt, this);
    this.camera.update(dt, this.player);
    this.weather.update(dt, this.camera.pos, this.windOverride);
    this.hud.update(dt);
    updateLantern(this.state, dt);
    const nearFire = this.scene.id === 'PARLOR' && this.state.phase === 'EVENING' && this.player.x < 140;
    updateWarmth(this.state, dt, this.scene, this.weather.wind, nearFire);
    this.audio.update(dt, { scene: this.scene.id });
    if (this.ridgeLight) {
      const r = this.ridgeLight;
      r.t += dt;
      r.k += Math.sign(r.target - r.k) * Math.min(Math.abs(r.target - r.k), dt * (r.target ? 0.9 : 2.2));
      r.swing = r.t > 2.8 && r.t < 4.2 ? Math.round(Math.sin((r.t - 2.8) * 4.5) * 2) : 0;
    }
  }

  // Surface under Silas: snow outdoors, wood/hard indoors (scene.surface overrides, e.g. the station platform).
  footstep() {
    const s = this.scene;
    const surface = s.surface || (s.exterior ? 'snow' : 'wood');
    this.audio.sfx(surface === 'snow' ? 'stepSnow' : 'stepWood', { vol: 0.55 });
  }

  // ---------------- interaction ----------------
  interactables() {
    const s = this.state;
    const out = [];
    // hx/hy/hw/hh: the clickable hotspot box in world space (used by the optional mouse support)
    for (const n of this.npcs) if (!n.hidden && !n.moving && n.dialogue) out.push({ kind: 'npc', x: n.x, y: n.y - 30, hy: n.y - 14, hw: 9, hh: 15, label: `Talk — ${n.name}`, ref: n, radius: 26 });
    for (const d of this.scene.doors || []) { const g = this.groundAt(d.x); out.push({ kind: 'door', x: d.x, y: g - 30, hy: g - 16, hw: 12, hh: 18, label: `${d.verb} — ${d.label}`, ref: d }); }
    for (const it of this.scene.interactables || []) {
      if (!test(it.if, s)) continue;
      let verb = it.verb || 'Examine';
      if (it.evidence) {
        const rec = s.evidence[it.evidence];
        const ev = EVIDENCE[it.evidence];
        if (rec && ev.detail && !rec.examined) verb = 'Look closer';
      }
      out.push({ kind: 'thing', x: it.x, y: it.y - 4, hy: it.y, hw: 11, hh: 12, label: `${verb} — ${it.label}`, ref: it });
    }
    return out;
  }
  findPrompt() {
    if (!this.canMove()) return null;
    let best = null, bd = Infinity;
    for (const o of this.interactables()) {
      const d = Math.abs(o.x - this.player.x);
      const r = o.radius || o.ref.radius || INTERACT_RADIUS;
      if (d <= r && d < bd) { bd = d; best = o; }
    }
    if (!best) return null;
    const ui = this.worldToUI(best.x, best.y);
    return { target: best, label: best.label, sx: ui.x, sy: ui.y };
  }

  // ---------------- coordinate conversions ----------------
  // world -> native screen (pre-zoom) -> framing zoom -> UI layout units
  worldToUI(wx, wy) {
    const cam = this.camera;
    const fo = cam.screenFocus();
    const pr = Display.projectZoom((wx - cam.pos) * WORLD_SCALE, wy * WORLD_SCALE, cam.zoom, fo.x, fo.y);
    return { x: pr.x / UI_SCALE, y: pr.y / UI_SCALE };
  }
  // Draw-x (in the sub-translated world pass, world units) of a parallax layer with this factor.
  // Every parallax layer and anything attached to one (e.g. the ridge lantern) must use this.
  layerX(factor) {
    const cam = this.camera;
    return cam.sub - snapN(cam.pos * factor);
  }

  // ---------------- optional mouse support ----------------
  // Client (CSS) px -> native screen px -> (undo framing zoom) -> world units. Correct at any
  // scale, letterbox, DPR, fullscreen state and camera zoom.
  pointerToWorld(clientX, clientY) {
    const n = this.display.clientToNative(clientX, clientY);
    if (!n) return null;
    const cam = this.camera;
    const fo = cam.screenFocus();
    const b = Display.unprojectZoom(n.x, n.y, cam.zoom, fo.x, fo.y);
    return { nx: n.x, ny: n.y, x: b.x / WORLD_SCALE + cam.pos, y: b.y / WORLD_SCALE };
  }
  hotspotAt(wx, wy) {
    let best = null, bd = Infinity;
    for (const o of this.interactables()) {
      const dx = Math.abs(o.x - wx), dy = Math.abs(o.hy - wy);
      if (dx <= o.hw && dy <= o.hh && dx + dy < bd) { bd = dx + dy; best = o; }
    }
    return best;
  }
  updatePointer() {
    const input = this.input;
    const canvas = this.display.canvas;
    // choice hover only when the mouse actually moved, so it never fights the keyboard
    const pk = input.pointer ? input.pointer.x + ',' + input.pointer.y : '';
    if (this.dialogue.active && input.pointer && pk !== this.lastPointerKey) {
      const l = this.display.clientToUI(input.pointer.x, input.pointer.y);
      if (l) this.dialogueView.hover(l.x, l.y);
    }
    this.lastPointerKey = pk;
    // hover cursor
    if (input.pointer && this.canMove()) {
      const p = this.pointerToWorld(input.pointer.x, input.pointer.y);
      const hot = p && this.hotspotAt(p.x, p.y);
      canvas.style.cursor = hot ? 'pointer' : 'default';
      this.hover = hot;
    } else { this.hover = null; canvas.style.cursor = 'default'; }
    // finish a walk-then-interact started by a click
    if (this.pendingClick && this.player.autoTarget == null) {
      const target = this.pendingClick; this.pendingClick = null;
      const pr = this.findPrompt();
      if (pr && pr.target.ref === target.ref && this.canInteractUI()) this.interact(pr.target);
    }
    const clicks = input.takeClicks();
    for (const c of clicks) {
      if (this.dialogue.active) {
        const l = this.display.clientToUI(c.x, c.y);
        if (l) this.dialogueView.click(l.x, l.y);
        continue;
      }
      if (!this.canMove()) continue;
      const p = this.pointerToWorld(c.x, c.y);
      if (!p) continue;
      const hot = this.hotspotAt(p.x, p.y);
      const pl = this.player;
      const [b0, b1] = this.scene.bounds;
      if (hot) {
        const r = hot.radius || hot.ref.radius || INTERACT_RADIUS;
        if (Math.abs(hot.x - pl.x) <= r && this.canInteractUI()) { this.interact(hot); continue; }
        const side = pl.x < hot.x ? -1 : 1;
        pl.autoTarget = Math.max(b0, Math.min(b1, hot.x + side * Math.min(r - 4, 12)));
        this.pendingClick = hot;
      } else {
        // walk toward the clicked spot; clicking past a scene edge leaves through it
        pl.autoTarget = Math.max(b0, Math.min(b1, p.x));
        pl.pushDir = p.x < b0 ? -1 : p.x > b1 ? 1 : 0;
        this.pendingClick = null;
      }
    }
  }

  interact(o) {
    this.input.clearAll();
    if (o.kind === 'npc') { this.startDialogue(o.ref.dialogue, o.ref); return; }
    if (o.kind === 'door') {
      const d = o.ref;
      if (test(d.if, this.state)) this.transitionTo(d.to, d.spawn, d.minutes != null ? d.minutes : 1);
      else { this.audio.sfx('refuse'); this.dialogue.startLines(d.blockedLines || ['It won\'t open.']); }
      return;
    }
    const it = o.ref;
    const s = this.state;
    if (it.dialogue) { this.camera.setMode('investigation', { x: it.x, y: it.y }); this.dialogue.start(it.dialogue); return; }
    const looked = s.looked[it.id] || 0;
    s.looked[it.id] = looked + 1;
    let lines;
    let effects = [];
    if (it.evidence) {
      const ev = EVIDENCE[it.evidence];
      const rec = s.evidence[it.evidence];
      if (!rec) { lines = [ev.observed]; effects.push({ evidence: it.evidence }); }
      else if (ev.detail && !rec.examined) {
        lines = [ev.detail]; effects.push({ examine: it.evidence });
        if (ev.collect) effects.push({ item: ev.collect });
      } else lines = [ev.observed];
    } else if (it.variants) {
      lines = (it.variants.find((v) => test(v.if, s)) || it.variants[0]).lines;
    } else {
      lines = looked > 0 && it.again ? it.again : it.lines;
    }
    if (it.warm) s.warmth = Math.min(100, s.warmth + 10);
    this.camera.setMode('investigation', { x: it.x, y: it.y });
    this.dialogue.startLines(lines);
    this.handleEffects(apply(effects, s));
  }

  // ---------------- exits & events ----------------
  checkExits(dt) {
    this.exitCooldown = Math.max(0, (this.exitCooldown || 0) - dt);
    if (!this.canMove() || this.exitCooldown > 0) return;
    const p = this.player;
    const [b0, b1] = this.scene.bounds;
    let side = null;
    if (p.x <= b0 + 0.5 && (this.input.held('left') || p.pushDir < 0)) side = 'left';
    if (p.x >= b1 - 0.5 && (this.input.held('right') || p.pushDir > 0)) side = 'right';
    if (!side) return;
    p.pushDir = 0;
    const ex = (this.scene.exits || []).find((e) => e.side === side);
    if (!ex) return;
    this.exitCooldown = 0.8;
    if (ex.scriptIf && test(ex.scriptIf.if, this.state)) { this.runScript(ex.scriptIf.script); return; }
    if (test(ex.if, this.state)) { this.transitionTo(ex.to, ex.spawn); return; }
    if (ex.blockedScript) { this.runScript(ex.blockedScript); return; }
    this.dialogue.startLines(ex.blockedLines || ['No way through.']);
    p.autoTarget = p.x + (side === 'left' ? 10 : -10);
  }

  checkEvents(dt) {
    if (this.dialogue.active || this.transition || (this.cutscene && !this.cutscene.done) || this.overlay) return;
    const s = this.state;
    const ctx = { playerX: this.player.x };
    for (const ev of [...(this.scene.events || []), ...GLOBAL_EVENTS]) {
      if (s.eventsDone.includes(ev.id)) continue;
      if (!test(ev.if, s, ctx)) { this.eventTimers[ev.id] = 0; continue; }
      this.eventTimers[ev.id] = (this.eventTimers[ev.id] || 0) + dt;
      if (this.eventTimers[ev.id] < (ev.delay || 0)) continue;
      s.eventsDone.push(ev.id);
      if (ev.do) this.handleEffects(apply(ev.do, s));
      if (ev.bark) this.hud.bark(ev.bark);
      if (ev.script) this.runScript(ev.script);
      return;
    }
  }

  // ---------------- rendering ----------------
  render() {
    try { this.draw(); } catch (err) {
      const key = 'r:' + String(err && err.message);
      if (!this.errorsSeen.has(key)) { this.errorsSeen.add(key); console.error('[game] render error:', err); }
    }
  }

  // Render passes. The world is composited into the 960×540 framebuffer using three transforms:
  //   world  — 1 world unit = FB_PER_WORLD (3) px, shifted left by the camera's sub-unit remainder;
  //            legacy art and props draw here exactly as they always have (camX = whole units).
  //   view   — 1 world unit = 3 px with no camera shift (screen-anchored legacy textures, e.g. fog).
  //   native — 1 native px = FB_SCALE (2) px (snow, lighting, and future native-density art).
  draw() {
    const d = this.display;
    d.ensureSize();
    const ctx = d.fbCtx;
    const cam = this.camera;
    const camX = cam.ix;
    const F = FB_PER_WORLD;
    const worldT = () => ctx.setTransform(F, 0, 0, F, -Math.round(cam.sub * F), 0);
    const viewT = () => ctx.setTransform(F, 0, 0, F, 0, 0);
    const nativeT = () => ctx.setTransform(FB_SCALE, 0, 0, FB_SCALE, 0, 0);
    const L = this.layers;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, FB_W, FB_H);
    worldT();
    const lx = new Map(); // parallax factor -> draw x (computed once per frame)
    const layerX = (layer) => { if (!lx.has(layer.factor)) lx.set(layer.factor, this.layerX(layer.factor)); return lx.get(layer.factor); };
    for (const b of L.back) ctx.drawImage(b.canvas, layerX(b), 0);
    // world drawables sorted by depth
    const list = [];
    for (const p of this.props) if (p.draw) list.push({ z: p.z || 0, fn: () => p.draw(ctx, camX, this) });
    list.push({ z: 0, fn: () => ctx.drawImage(L.main.canvas, -camX, 0) });
    for (const n of this.npcs) list.push({ z: n.z, fn: () => n.draw(ctx, camX) });
    if (this.mode === 'play') list.push({ z: 10, fn: () => this.player.draw(ctx, camX, this.state.lanternOn) });
    list.sort((a, b) => a.z - b.z);
    for (const it of list) it.fn();
    this.weather.drawBreath(ctx, camX);
    nativeT();
    this.weather.draw(ctx, true);
    worldT();
    for (const f of L.front) ctx.drawImage(f.canvas, layerX(f), 0);
    viewT();
    this.weather.drawFog(ctx, cam.pos);
    // lighting (rendered at native resolution)
    if (this.mode === 'play' || this.mode === 'title') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      renderLighting(ctx, this.collectLights(camX), this.ambient(), cam.sub);
    }
    // emissive pixels
    worldT();
    for (const b of L.back) if (b.glow) ctx.drawImage(b.glow, layerX(b), 0);
    if (L.main.glow) ctx.drawImage(L.main.glow, -camX, 0);
    for (const p of this.props) if (p.glow) p.glow(ctx, camX, this);
    nativeT();
    this.weather.draw(ctx, false);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // compose to the screen
    const fo = cam.screenFocus();
    d.present(cam.zoom, fo.x, fo.y);
    const out = d.ctx;
    const OW = d.canvas.width, OH = d.canvas.height;
    if (this.settings.vignette) {
      const g = out.createRadialGradient(OW / 2, OH / 2, OH * 0.35, OW / 2, OH / 2, OW * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.38)');
      out.fillStyle = g; out.fillRect(0, 0, OW, OH);
    }
    // scanlines follow the art's pixel rows (world units), so their density is unchanged
    const SW = d.scale * WORLD_SCALE; // device px per world unit
    if (this.settings.scanlines && SW >= 3) {
      out.fillStyle = 'rgba(0,0,0,0.13)';
      const th = Math.max(1, Math.floor(SW / 3));
      for (let y = 0; y < VIEW_H; y++) out.fillRect(0, Math.round((y + 1) * SW) - th, OW, th);
    }
    // fade
    if (this.fade.v > 0.001) { out.fillStyle = `rgba(3,4,8,${this.fade.v})`; out.fillRect(0, 0, OW, OH); }
    // UI in UI layout units (device px per UI unit; may be fractional in sharp-fit mode)
    const S = OW / UI_W;
    out.save();
    out.setTransform(S, 0, 0, S, 0, 0);
    out.imageSmoothingEnabled = true;
    if (this.card) this.drawCard(out);
    if (this.mode === 'play') {
      this.hud.draw(out);
      this.dialogueView.draw(out);
    }
    for (const o of this.overlays) o.draw(out);
    out.restore();
    out.imageSmoothingEnabled = false;
  }

  drawCard(ctx) {
    ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, UI_W, UI_H);
    font(ctx, this.card.lines[0].length < 8 ? 11 : 7);
    this.card.lines.forEach((l, i) => text(ctx, l, UI_W / 2, 92 + i * 12, UI.bone, 'center'));
  }

  ambient() {
    if (this.mode === 'title') return { color: '#04060d', alpha: 0.5 };
    const warm = this.scene.ambient === 'warm';
    return { color: warm ? '#140906' : '#03050c', alpha: this.scene.darkness != null ? this.scene.darkness : 0.5 };
  }

  collectLights(camX) {
    const out = [];
    if (this.mode === 'title') { out.push({ x: 230, y: 150, r: 46, warm: 0.2 }); return out; }
    for (const l of this.scene.lights || []) out.push({ x: l.x - camX, y: l.y, r: l.r, warm: l.warm, strength: l.strength });
    for (const p of this.props) if (p.lights) for (const l of p.lights(this)) out.push(Object.assign({}, l, { x: l.x - camX }));
    for (const n of this.npcs) for (const l of n.lights()) out.push(Object.assign({}, l, { x: l.x - camX }));
    const p = this.player;
    if (!p.hidden) {
      out.push({ x: p.x - camX, y: p.y - 16, r: LANTERN.selfLightRadius, strength: 0.55 });
      if (this.state.lanternOn) {
        const lp = p.lanternPos();
        const flick = Math.round(Math.sin(this.time * 9.3) * 1.2 + Math.sin(this.time * 3.1));
        out.push({ x: lp.x - camX, y: lp.y, r: LANTERN.radius + flick, warm: LANTERN.warm });
      }
    }
    // Faint ambient catch-light on important clues so darkness alone never hides them.
    if (this.scene.darkness > 0.7) {
      for (const it of this.scene.interactables || []) {
        if (!it.important || !test(it.if, this.state)) continue;
        out.push({ x: it.x - camX, y: it.y, r: 12, strength: 0.45 });
      }
    }
    return out;
  }
}

export { timeString };
