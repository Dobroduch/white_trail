// Runs authored step lists from data/scripts.js. Each step starts, then is polled until done.
// Steps with { nowait: true } start and immediately let the next step begin.
import { SCRIPTS } from '../data/scripts.js';
import { apply, advanceTime } from './storyState.js';
import { caseOpenForDecision, outcomeOf } from './caseSystem.js';
import { CaseReview } from '../ui/caseReview.js';
import { QUESTIONS } from '../data/caseData.js';

export class Cutscene {
  constructor(game, id) {
    this.game = game;
    this.id = id;
    this.steps = SCRIPTS[id] || [];
    if (!SCRIPTS[id]) console.error(`[cutscene] unknown script "${id}"`);
    // Ambient scripts (barks, hints) run alongside play without taking control from the player.
    this.ambient = !!(this.steps[0] && this.steps[0].ambient);
    this.i = -1;
    this.cur = null;
    this.done = false;
    this.next();
  }

  next() {
    for (;;) {
      this.i++;
      if (this.i >= this.steps.length) { this.done = true; this.cur = null; return; }
      const step = this.steps[this.i];
      const st = { step, t: 0, done: false };
      this.begin(st);
      if (step.nowait || st.done) continue;
      this.cur = st;
      return;
    }
  }

  update(dt) {
    if (this.done) return;
    const st = this.cur;
    if (!st) return;
    st.t += dt;
    if (st.poll && st.poll(dt)) st.done = true;
    if (st.done) this.next();
  }

  begin(st) {
    const g = this.game;
    const s = st.step;
    const finish = () => { st.done = true; };
    if (s.ambient) return finish();
    if ('control' in s) { g.playerControl = s.control; return finish(); }
    if (s.wait != null) { st.poll = () => st.t >= s.wait; return; }
    if (s.fade) { g.fadeTo(s.fade.to, s.fade.dur); st.poll = () => st.t >= s.fade.dur; return; }
    if (s.sfx) { g.audio.sfx(s.sfx); return finish(); }
    if (s.ambience) { g.audio.setAmbience(s.ambience); return finish(); }
    if (s.music) { g.audio.music(s.music); return finish(); }
    if (s.murmur) { g.audio.murmur(s.murmur === 'stop' ? 0 : 1); return finish(); }
    if ('wind' in s) { g.windOverride = s.wind; g.audio.windDip(s.wind); return finish(); }
    if (s.set) { apply([{ set: s.set }], g.state); return finish(); }
    if (s.log) { apply([{ log: s.log }], g.state); return finish(); }
    if (s.char) { apply([{ char: s.char }], g.state); return finish(); }
    if (s.phase) {
      g.state.phase = s.phase;
      if (s.time) { g.state.time.h = s.time[0]; g.state.time.m = s.time[1]; }
      g.reloadScene();
      return finish();
    }
    if (s.time) { advanceTime(g.state, s.time); return finish(); }
    if (s.checkpoint) { g.checkpoint(); return finish(); }
    if (s.hint) {
      if (s.ifLanternOff && g.state.lanternOn) return finish();
      g.hud.hint(s.hint, s.dur || 6);
      return finish();
    }
    if (s.bark) { g.hud.bark(s.bark); return finish(); }
    if (s.label) { g.hud.showLabel(g.scene, g.state); return finish(); }
    if (s.title) { g.hud.showTitle(); return finish(); }
    if (s.markParlor) { g.parlorEnterAt = g.time; return finish(); }
    if (s.card !== undefined) {
      if (s.card === null) { g.card = null; return finish(); }
      g.card = { lines: s.card.lines, t: 0 };
      if (s.card.hold) return finish();
      st.poll = () => {
        if (st.t >= s.card.dur) { g.card = null; return true; }
        return false;
      };
      return;
    }
    if (s.doc) {
      g.openDocument(s.doc);
      st.poll = () => !g.overlay;
      return;
    }
    if (s.endCard) { g.openEndCard(); st.poll = () => !g.overlay; return; }
    // Before Silas leaves the mill: if the case can be decided and has not been, open the case review in prompt mode
    // (commit, or leave it open). Waits until it is closed.
    // The choice (DIALOGUE.CASE_PROMPT): settle it now (only when an account can be put together), go back to the
    // notebook first (cancels leaving), or go up and leave it open.
    if (s.casePrompt) {
      const f = g.state.flags;
      if (f['aftermath_' + s.casePrompt] || (g.state.cases && g.state.cases[s.casePrompt])) return finish();
      const q = QUESTIONS.find((x) => x.case === s.casePrompt);
      f._caseDecidable = caseOpenForDecision(g.state, s.casePrompt);
      delete f._leaveChoice;
      g.startDialogue('CASE_PROMPT');
      st.poll = () => {
        if (g.dialogue.active) return false;
        if (!st.opened) {
          const choice = f._leaveChoice;
          delete f._leaveChoice; delete f._caseDecidable;
          if (choice === 'review') { st.opened = true; g.pushOverlay(new CaseReview(g, q.id, { prompt: true })); return false; }
          if (choice === 'notebook') { // stay at the mill and work it through
            this.i = this.steps.length; g.playerControl = true; g.exitCooldown = 1;
            g.player.autoTarget = g.player.x + 12;
            g.notebook.open('DEDUCTIONS'); g.pushOverlay(g.notebookOverlay());
            return true;
          }
          return true; // leave it open
        }
        return !g.overlay;
      };
      return;
    }
    // The aftermath (once per case): a held "Morning." card, then the outcome's dialogue over black, then its effects.
    if (s.aftermath) {
      const flag = 'aftermath_' + s.aftermath;
      if (g.state.flags[flag]) return finish();
      const out = outcomeOf(g.state, s.aftermath);
      g.card = { lines: ['First light.'], t: 0 };
      st.poll = () => {
        if (!st.talking && st.t >= 2.2) { st.talking = true; g.card = null; g.startDialogue(out.aftermath); }
        if (st.talking && !g.dialogue.active) {
          apply(out.do, g.state);
          g.state.flags[flag] = true;
          return true;
        }
        return false;
      };
      return;
    }
    if (s.say) {
      g.startDialogue(s.say);
      st.poll = () => !g.dialogue.active;
      return;
    }
    if (s.line) {
      g.dialogue.startLines([s.line], { who: s.line.who });
      g.focusDialogue(s.line.who);
      st.poll = () => !g.dialogue.active;
      return;
    }
    if (s.player) return this.playerStep(st, s.player);
    if (s.npc) return this.npcStep(st, s.npc);
    if (s.train) {
      const train = g.props.find((p) => p.id === 'train');
      if (!train) return finish();
      if (s.train === 'arrive') { train.arrive(); g.audio.trainRumble(true); }
      if (s.train === 'depart') { train.depart(); g.audio.trainRumble(true); }
      st.poll = () => train.done();
      return;
    }
    if (s.trainWait) {
      const train = g.props.find((p) => p.id === 'train');
      st.poll = () => !train || train.done();
      return;
    }
    if (s.cameraAt) { g.camera.snap(s.cameraAt.x, g.scene.width); return finish(); }
    if ('camera' in s) {
      g.camera.override = s.camera ? { x: s.camera.x, y: s.camera.y, zoom: s.camera.zoom } : null;
      return finish();
    }
    if (s.ridge) {
      if (s.ridge === 'show') g.ridgeLight = { k: 0, target: 1, swing: 0, t: 0 };
      else if (g.ridgeLight) g.ridgeLight.target = 0;
      return finish();
    }
    console.warn('[cutscene] unhandled step', s);
    finish();
  }

  playerStep(st, p) {
    const g = this.game;
    const pl = g.player;
    if (p.hide) pl.hidden = true;
    if (p.show) pl.hidden = false;
    if (p.x != null) pl.x = p.x;
    if (p.face) pl.facing = p.face;
    if (p.walkTo != null) {
      const target = p.relative ? pl.x + p.walkTo : p.walkTo;
      pl.autoTarget = Math.max(g.scene.bounds[0], Math.min(g.scene.bounds[1], target));
      st.poll = () => pl.autoTarget == null;
      return;
    }
    st.done = true;
  }

  npcStep(st, n) {
    const g = this.game;
    const npc = g.npcs.find((x) => x.id === n.id);
    if (!npc) { st.done = true; return; }
    if (n.hide) npc.hidden = true;
    if (n.show) npc.hidden = false;
    if (n.x != null) { npc.x = n.x; npc.y = npc.groundAt(n.x); }
    if (n.face) npc.facing = n.face;
    let target = n.walkTo;
    if (n.approachPlayer != null) {
      const side = npc.x > g.player.x ? 1 : -1;
      target = g.player.x + side * n.approachPlayer;
    }
    if (target != null) {
      npc.walkTo(target, n.speed || 30);
      st.poll = () => !npc.moving;
      return;
    }
    st.done = true;
  }
}
