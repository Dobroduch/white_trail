// Minimal HUD: location/time label, contextual interaction prompt, hints, barks, "noted" toast,
// and small lantern / cold cues. No bars, scores, markers or counters.
import { UI, font, text, spaced, panel, keycap, wrap } from './text.js';
import { timeString } from '../systems/storyState.js';
import { EVIDENCE } from '../data/evidence.js';

export class HUD {
  constructor(game) {
    this.game = game;
    this.label = null; this.hintMsg = null; this.barkMsg = null; this.toasts = []; this.titleT = null;
  }
  showLabel(scene, state) {
    this.label = { text: `${scene.name}  —  ${timeString(state.time)}`, t: 0 };
  }
  showTitle() { this.titleT = 0; }
  hint(msg, dur = 6) { this.hintMsg = { text: msg, t: 0, dur }; }
  bark(msg, dur = 4.2) { this.barkMsg = { text: msg, t: 0, dur }; }
  noted(id, detail) {
    const ev = EVIDENCE[id];
    if (!ev) return;
    const kind = ev.category === 'TESTIMONY' ? 'Statement noted' : detail ? 'Noted — closer look' : 'Noted';
    this.toasts.push({ head: kind, text: ev.title, t: 0 });
    if (this.toasts.length > 3) this.toasts.shift();
  }
  item(name) { this.toasts.push({ head: 'Taken', text: name, t: 0 }); }
  clear() { this.label = null; this.hintMsg = null; this.barkMsg = null; this.toasts = []; this.titleT = null; }

  update(dt) {
    if (this.label) { this.label.t += dt; if (this.label.t > 6) this.label = null; }
    if (this.hintMsg) { this.hintMsg.t += dt; if (this.hintMsg.t > this.hintMsg.dur) this.hintMsg = null; }
    if (this.barkMsg) { this.barkMsg.t += dt; if (this.barkMsg.t > this.barkMsg.dur) this.barkMsg = null; }
    for (const t of this.toasts) t.t += dt;
    this.toasts = this.toasts.filter((t) => t.t < 3.6);
    if (this.titleT != null) { this.titleT += dt; if (this.titleT > 7) this.titleT = null; }
  }

  draw(ctx) {
    const g = this.game;
    const fadeIO = (t, inT, hold, outT) => t < inT ? t / inT : t < inT + hold ? 1 : Math.max(0, 1 - (t - inT - hold) / outT);
    // title over the opening
    if (this.titleT != null) {
      const a = fadeIO(this.titleT, 1.6, 3.2, 2.2);
      ctx.globalAlpha = a;
      font(ctx, 15);
      spaced(ctx, 'THE WHITE TRAIL', 160, 46, UI.bone, 3.2, 'center');
      ctx.globalAlpha = 1;
    }
    // location / time label
    if (this.label && !g.dialogue.active) {
      const a = fadeIO(this.label.t, 0.8, 3.6, 1.6);
      ctx.globalAlpha = a;
      font(ctx, 5.2);
      spaced(ctx, this.label.text, 12, 16, UI.bone, 0.9);
      ctx.fillStyle = UI.amberDim;
      ctx.fillRect(12, 19, 24, 0.6);
      ctx.globalAlpha = 1;
    }
    // interaction prompt near the target
    const p = g.prompt;
    if (p && g.canInteractUI()) {
      font(ctx, 5);
      const label = p.label;
      const tw = ctx.measureText(label).width;
      const w = tw + 20, h = 9;
      let x = Math.round(p.sx - w / 2), y = Math.round(p.sy - h - 3);
      x = Math.max(4, Math.min(316 - w, x)); y = Math.max(22, Math.min(118, y));
      panel(ctx, x, y, w, h, 'rgba(9,13,22,0.82)', UI.edgeHi);
      keycap(ctx, 'E', x + 3, y + 7, UI.amber);
      text(ctx, label, x + 13, y + 6.6, UI.bone);
    }
    // hint (tutorial-style, bottom-left)
    if (this.hintMsg && !g.dialogue.active) {
      const a = fadeIO(this.hintMsg.t, 0.5, this.hintMsg.dur - 1.5, 1);
      ctx.globalAlpha = a * 0.95;
      font(ctx, 4.9);
      const lines = wrap(ctx, this.hintMsg.text, 180);
      const h = lines.length * 6.5 + 4;
      panel(ctx, 8, 170 - h, 188, h, 'rgba(9,13,22,0.7)', null);
      lines.forEach((l, i) => text(ctx, l, 12, 170 - h + 7 + i * 6.5, UI.dim));
      ctx.globalAlpha = 1;
    }
    // bark: Silas's passing observation
    if (this.barkMsg && !g.dialogue.active) {
      const a = fadeIO(this.barkMsg.t, 0.4, this.barkMsg.dur - 1.2, 0.8);
      ctx.globalAlpha = a;
      font(ctx, 5.6, { italic: true });
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 2;
      text(ctx, this.barkMsg.text, 160, 104, UI.bone, 'center');
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    // "noted" toasts — quiet, top-right
    this.toasts.forEach((t, i) => {
      const a = fadeIO(t.t, 0.3, 2.5, 0.8);
      ctx.globalAlpha = a;
      font(ctx, 4.5, { italic: true });
      const head = t.head;
      font(ctx, 5.2);
      const w = Math.max(60, ctx.measureText(t.text).width + 12);
      const y = 146 - (this.toasts.length - 1 - i) * 17;
      panel(ctx, 312 - w, y, w, 15, 'rgba(9,13,22,0.78)', UI.edge);
      font(ctx, 4.3, { italic: true });
      text(ctx, head, 312 - w + 6, y + 6, UI.amber);
      font(ctx, 5.2);
      text(ctx, t.text, 312 - w + 6, y + 12, UI.bone);
      ctx.globalAlpha = 1;
    });
    // small status cues
    const s = g.state;
    if (g.mode === 'play' && !g.dialogue.active) {
      let cx = 312;
      if (s.lanternOn) {
        ctx.fillStyle = UI.amber; ctx.globalAlpha = 0.8;
        ctx.fillRect(cx - 3, 168, 3, 4); ctx.fillRect(cx - 4, 167, 5, 1); ctx.fillRect(cx - 2, 166, 1, 1);
        ctx.globalAlpha = 1;
        cx -= 9;
      }
      if (s.warmth < 35) {
        font(ctx, 4.4, { italic: true });
        text(ctx, 'cold', cx, 172, '#94a3b8', 'right');
      }
    }
  }
}
