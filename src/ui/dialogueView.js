// Dialogue presentation: speaker tag, restrained typewriter reveal, numbered choices.
// E / Enter / Space reveals the full line, then advances. Up/Down + E or 1–5 pick choices.
import { UI, font, text, panel, wrap, spaced } from './text.js';
import { SPEAKERS } from '../data/dialogue.js';

const SPEEDS = { slow: 28, normal: 50, fast: 95, instant: 1e9 };

export class DialogueView {
  constructor(game) {
    this.game = game;
    this.shown = 0; this.sel = 0; this.lastNodeKey = null; this.t = 0;
  }
  onNode(runner) {
    if (runner.freshText) this.shown = 0;
    else this.shown = 1e9;
    this.sel = 0;
    this.t = 0;
  }
  update(dt, input) {
    const r = this.game.dialogue;
    if (!r.active) return;
    this.t += dt;
    const full = r.lastText ? r.lastText.length : 0;
    const speed = SPEEDS[this.game.settings.textSpeed] || SPEEDS.normal;
    if (this.shown < full) this.shown = Math.min(full, this.shown + speed * dt);
    const revealed = this.shown >= full;
    if (r.choices && revealed) {
      const n = r.choices.length;
      if (input.pressed('up')) { this.sel = (this.sel + n - 1) % n; this.game.audio.sfx('tick'); }
      if (input.pressed('down')) { this.sel = (this.sel + 1) % n; this.game.audio.sfx('tick'); }
      const nums = ['one', 'two', 'three', 'four', 'five'];
      for (let i = 0; i < Math.min(n, 5); i++) if (input.pressed(nums[i])) { this.pick(i); return; }
      if (input.pressed('confirm') && this.t > 0.15) { this.pick(this.sel); return; }
    } else if (input.pressed('confirm')) {
      if (!revealed) this.shown = full;
      else if (this.t > 0.12) r.advance();
    }
  }
  // Optional mouse: (lx, ly) are logical 320x180 screen coordinates.
  click(lx, ly) {
    const r = this.game.dialogue;
    if (!r.active) return;
    const full = r.lastText ? r.lastText.length : 0;
    if (r.choices && this.shown >= full) {
      const i = (this.choiceRects || []).findIndex((b) => lx >= b.x && lx <= b.x + b.w && ly >= b.y && ly <= b.y + b.h);
      if (i >= 0 && i < r.choices.length) this.pick(i);
      return;
    }
    if (this.shown < full) this.shown = full;
    else if (this.t > 0.12) r.advance();
  }
  // hover highlight for choices
  hover(lx, ly) {
    const i = (this.choiceRects || []).findIndex((b) => lx >= b.x && lx <= b.x + b.w && ly >= b.y && ly <= b.y + b.h);
    if (i >= 0) this.sel = i;
  }
  pick(i) {
    this.game.audio.sfx('tick');
    this.game.input.clearAll();
    this.game.dialogue.choose(i);
  }
  draw(ctx) {
    const r = this.game.dialogue;
    if (!r.active) return;
    const who = r.lastWho || 'note';
    const isNote = who === 'note';
    const W0 = 296, X0 = 12;
    font(ctx, 6.1, { italic: isNote });
    const lines = r.lastText ? wrap(ctx, r.lastText, W0 - 16) : [];
    const lineH = 7.6;
    const choices = r.choices && this.shown >= (r.lastText ? r.lastText.length : 0) ? r.choices : null;
    let h = 8 + lines.length * lineH + (choices ? choices.length * 8 + 3 : 0) + 4;
    h = Math.max(h, 26);
    // Anchored at the top: the ground plane (characters, clues) stays visible beneath it.
    const y0 = 12;
    panel(ctx, X0, y0, W0, h, 'rgba(9,13,22,0.92)', UI.edgeHi);
    // speaker tag
    const name = SPEAKERS[who];
    if (name) {
      font(ctx, 4.8, { bold: true });
      const tw = ctx.measureText(name).width + 3 * name.length * 0.18 + 10;
      panel(ctx, X0 + 6, y0 - 6, tw, 9, '#1b1410', UI.amberDim);
      font(ctx, 4.8, { bold: true });
      spaced(ctx, name, X0 + 11, y0 + 0.8, UI.amber, 0.55);
    }
    // text (typewriter)
    font(ctx, 6.1, { italic: isNote });
    let remaining = Math.floor(this.shown);
    const col = isNote ? '#cbd5e1' : UI.bone;
    lines.forEach((l, i) => {
      if (remaining <= 0) return;
      const part = l.slice(0, remaining);
      remaining -= l.length + 1;
      text(ctx, part, X0 + 8, y0 + 10.5 + i * lineH, col);
    });
    this.choiceRects = [];
    if (choices) {
      font(ctx, 5.7);
      const cy = y0 + 10 + lines.length * lineH + 2;
      choices.forEach((c, i) => {
        const y = cy + i * 8 + 4;
        this.choiceRects.push({ x: X0 + 5, y: y - 6, w: W0 - 10, h: 8 });
        const sel = i === this.sel;
        if (sel) { ctx.fillStyle = 'rgba(245,158,11,0.12)'; ctx.fillRect(X0 + 5, y - 6, W0 - 10, 8); }
        text(ctx, `${i + 1}.`, X0 + 9, y, sel ? UI.amber : UI.faint);
        text(ctx, c.text, X0 + 18, y, sel ? UI.bone : UI.dim);
      });
    } else if (r.lastText && this.shown >= r.lastText.length) {
      if (Math.floor(this.t * 2) % 2 === 0) {
        const by = y0 + h;
        ctx.fillStyle = UI.amber;
        ctx.fillRect(X0 + W0 - 10, by - 7, 3, 1); ctx.fillRect(X0 + W0 - 9.5, by - 6, 2, 1); ctx.fillRect(X0 + W0 - 9, by - 5, 1, 1);
      }
    }
  }
}
