// Title, pause, settings, controls help, confirmation, inventory, document and end-card overlays.
// All keyboard-driven. Each overlay: update(input) -> action | null, draw(ctx).
import { UI, font, text, spaced, panel, wrap, keycap } from './text.js';
import { ITEMS, TELEGRAM_TEXT, LEADS } from '../data/notebookData.js';
import { EVIDENCE } from '../data/evidence.js';
import { DEDUCTIONS } from '../data/notebookData.js';
import { revolverDescription } from '../systems/survival.js';
import { test, countAt } from '../systems/storyState.js';

function menuNav(self, input, n, audio) {
  if (input.pressed('up')) { self.sel = (self.sel + n - 1) % n; audio.sfx('tick'); }
  if (input.pressed('down')) { self.sel = (self.sel + 1) % n; audio.sfx('tick'); }
}
function drawMenu(ctx, items, sel, x, y, { align = 'left', size = 6.4, gap = 10 } = {}) {
  items.forEach((it, i) => {
    const s = i === sel;
    font(ctx, size, { italic: !s && false });
    const col = it.disabled ? UI.faint : s ? UI.bone : UI.dim;
    const yy = y + i * gap;
    if (s) {
      const w = ctx.measureText(it.label).width;
      const lx = align === 'center' ? x - w / 2 - 7 : x - 7;
      ctx.fillStyle = UI.amber; ctx.fillRect(lx, yy - 3, 3, 1.2);
    }
    text(ctx, it.label, x, yy, col, align);
  });
}

// ---------------- Title ----------------
export class TitleMenu {
  constructor(game) { this.game = game; this.sel = 0; this.t = 0; this.pressed = false; this.build(); }
  build() {
    const has = this.game.hasSave();
    this.items = [];
    if (has) this.items.push({ label: 'Continue', act: 'continue' });
    this.items.push({ label: 'New investigation', act: 'new' });
    this.items.push({ label: 'Settings', act: 'settings' });
    this.items.push({ label: 'Controls', act: 'controls' });
    this.sel = 0;
  }
  update(input) {
    this.t += 1 / 60;
    if (!this.pressed) { if (input.anyPressed && this.t > 0.4) { this.pressed = true; this.game.input.clearAll(); this.game.audio.music('title'); } return null; }
    menuNav(this, input, this.items.length, this.game.audio);
    if (input.pressed('confirm')) return this.items[this.sel].act;
    return null;
  }
  draw(ctx) {
    const a = Math.min(1, this.t / 2.5);
    ctx.globalAlpha = a;
    font(ctx, 17);
    spaced(ctx, 'THE WHITE TRAIL', 160, 62, UI.bone, 3.6, 'center');
    ctx.fillStyle = UI.amberDim; ctx.fillRect(140, 69, 40, 0.7);
    font(ctx, 5.2, { italic: true });
    text(ctx, 'Crow\'s Hollow, in the Rocky Mountains. Winter, 1892.', 160, 79, UI.dim, 'center');
    ctx.globalAlpha = 1;
    if (!this.pressed) {
      if (this.t > 1.2 && Math.floor(this.t * 1.4) % 2 === 0) { font(ctx, 5.4); text(ctx, 'Press any key', 160, 130, UI.dim, 'center'); }
      ctx.fillStyle = 'rgba(5,7,12,0.75)'; ctx.fillRect(0, 162, 320, 18);
      font(ctx, 4.5, { italic: true });
      text(ctx, 'Sound is part of this game. Headphones recommended.', 160, 172, UI.dim, 'center');
      return;
    }
    drawMenu(ctx, this.items, this.sel, 160, 110, { align: 'center', size: 6.2, gap: 10 });
    ctx.fillStyle = 'rgba(5,7,12,0.75)'; ctx.fillRect(0, 162, 320, 18);
    font(ctx, 4.5, { italic: true });
    text(ctx, 'Up / Down  choose    E / Enter confirm', 160, 172, UI.dim, 'center');
  }
}

// ---------------- Pause ----------------
export class PauseMenu {
  constructor(game) {
    this.game = game; this.sel = 0;
    this.items = [
      { label: 'Resume', act: 'resume' }, { label: 'Notebook', act: 'notebook' }, { label: 'Inventory', act: 'inventory' },
      { label: 'Settings', act: 'settings' }, { label: 'Controls', act: 'controls' },
      { label: 'Restart from the beginning', act: 'restart' }, { label: 'Save and quit to title', act: 'title' },
    ];
  }
  update(input) {
    if (input.pressed('pause')) return 'resume';
    menuNav(this, input, this.items.length, this.game.audio);
    if (input.pressed('confirm')) return this.items[this.sel].act;
    return null;
  }
  draw(ctx) {
    ctx.fillStyle = 'rgba(5,7,12,0.72)'; ctx.fillRect(0, 0, 320, 180);
    panel(ctx, 96, 34, 128, 104, UI.panel, UI.edgeHi);
    font(ctx, 6.4); spaced(ctx, 'PAUSED', 160, 50, UI.bone, 2, 'center');
    drawMenu(ctx, this.items, this.sel, 112, 66, { size: 5.8, gap: 9.4 });
  }
}

// ---------------- Settings ----------------
export class SettingsMenu {
  constructor(game) { this.game = game; this.sel = 0; }
  rows() {
    const s = this.game.settings;
    const pct = (v) => `${Math.round(v * 100)}%`;
    return [
      { key: 'master', label: 'Master volume', val: pct(s.master), kind: 'vol' },
      { key: 'ambience', label: 'Ambience volume', val: pct(s.ambience), kind: 'vol' },
      { key: 'effects', label: 'Effects volume', val: pct(s.effects), kind: 'vol' },
      { key: 'music', label: 'Music volume', val: pct(s.music), kind: 'vol' },
      { key: 'textSpeed', label: 'Text speed', val: s.textSpeed, kind: 'enum', opts: ['slow', 'normal', 'fast', 'instant'] },
      { key: 'reducedMotion', label: 'Reduce camera motion', val: s.reducedMotion ? 'on' : 'off', kind: 'bool' },
      { key: 'vignette', label: 'Vignette', val: s.vignette ? 'on' : 'off', kind: 'bool' },
      { key: 'scanlines', label: 'Scanlines', val: s.scanlines ? 'on' : 'off', kind: 'bool' },
      { key: 'back', label: 'Back', kind: 'back' },
    ];
  }
  update(input) {
    const rows = this.rows();
    if (input.pressed('pause') || input.pressed('back')) return 'back';
    menuNav(this, input, rows.length, this.game.audio);
    const r = rows[this.sel];
    const s = this.game.settings;
    const dir = (input.pressed('right') ? 1 : 0) - (input.pressed('left') ? 1 : 0);
    if (r.kind === 'back') { if (input.pressed('confirm')) return 'back'; return null; }
    const conf = input.pressed('confirm');
    if (!dir && !conf) return null;
    const d = dir || 1;
    if (r.kind === 'vol') s[r.key] = Math.max(0, Math.min(1, Math.round((s[r.key] + d * 0.1) * 10) / 10));
    if (r.kind === 'bool') s[r.key] = !s[r.key];
    if (r.kind === 'enum') { const i = r.opts.indexOf(s[r.key]); s[r.key] = r.opts[(i + d + r.opts.length) % r.opts.length]; }
    this.game.applySettings();
    this.game.audio.sfx('tick');
    return null;
  }
  draw(ctx) {
    ctx.fillStyle = 'rgba(5,7,12,0.78)'; ctx.fillRect(0, 0, 320, 180);
    panel(ctx, 70, 24, 180, 132, UI.panel, UI.edgeHi);
    font(ctx, 6.4); spaced(ctx, 'SETTINGS', 160, 39, UI.bone, 2, 'center');
    this.rows().forEach((r, i) => {
      const y = 54 + i * 10.4;
      const sel = i === this.sel;
      font(ctx, 5.6);
      if (sel) { ctx.fillStyle = UI.amber; ctx.fillRect(80, y - 3, 3, 1.2); }
      text(ctx, r.label, 87, y, sel ? UI.bone : UI.dim);
      if (r.val) text(ctx, (sel && r.kind !== 'back' ? '‹ ' : '') + r.val + (sel ? ' ›' : ''), 240, y, sel ? UI.amber : UI.dim, 'right');
    });
    font(ctx, 4.3, { italic: true });
    text(ctx, 'Up / Down  choose    Left / Right  change    Esc back', 160, 150, UI.faint, 'center');
  }
}

// ---------------- Controls help ----------------
export class ControlsHelp {
  constructor(game) { this.game = game; }
  update(input) { if (input.pressed('pause') || input.pressed('confirm') || input.pressed('back')) return 'back'; return null; }
  draw(ctx) {
    ctx.fillStyle = 'rgba(5,7,12,0.8)'; ctx.fillRect(0, 0, 320, 180);
    panel(ctx, 56, 22, 208, 136, UI.panel, UI.edgeHi);
    font(ctx, 6.4); spaced(ctx, 'CONTROLS', 160, 37, UI.bone, 2, 'center');
    const rows = [
      [['A', 'D'], 'or arrow keys — walk'], [['E'], 'examine · speak · open · continue'], [['F'], 'light or shutter the lantern'],
      [['Tab'], 'notebook (also J)'], [['I'], 'inventory'], [['Esc'], 'pause · close a panel'],
      [['1', '–', '5'], 'pick a dialogue choice (or Up / Down and E)'],
    ];
    rows.forEach(([keys, desc], i) => {
      const y = 54 + i * 12;
      let x = 70;
      for (const k of keys) {
        if (k === '–') { font(ctx, 5); text(ctx, '–', x + 1, y, UI.dim); x += 6; continue; }
        x += keycap(ctx, k, x, y, UI.amber) + 2;
      }
      font(ctx, 5.4); text(ctx, desc, 116, y, UI.dim);
    });
    font(ctx, 4.6, { italic: true });
    text(ctx, 'No mouse needed. There is no jump and no combat in this chapter.', 160, 142, UI.faint, 'center');
    text(ctx, 'Press E or Esc to return', 160, 151, UI.faint, 'center');
  }
}

// ---------------- Confirm ----------------
export class Confirm {
  constructor(game, question, yes, no = 'back') { this.game = game; this.q = question; this.yes = yes; this.no = no; this.sel = 1; }
  update(input) {
    if (input.pressed('pause') || input.pressed('back')) return this.no;
    if (input.pressed('up') || input.pressed('down') || input.pressed('left') || input.pressed('right')) { this.sel = 1 - this.sel; this.game.audio.sfx('tick'); }
    if (input.pressed('confirm')) return this.sel === 0 ? this.yes : this.no;
    return null;
  }
  draw(ctx) {
    ctx.fillStyle = 'rgba(5,7,12,0.8)'; ctx.fillRect(0, 0, 320, 180);
    panel(ctx, 70, 62, 180, 54, UI.panel, UI.edgeHi);
    font(ctx, 5.8);
    wrap(ctx, this.q, 160).forEach((l, i) => text(ctx, l, 160, 78 + i * 7, UI.bone, 'center'));
    drawMenu(ctx, [{ label: 'Yes' }, { label: 'No' }], this.sel, 160, 98, { align: 'center', size: 5.8, gap: 8 });
  }
}

// ---------------- Inventory ----------------
export class Inventory {
  constructor(game) { this.game = game; this.sel = 0; }
  update(input) {
    const items = this.game.state.items;
    if (input.pressed('pause') || input.pressed('inventory') || input.pressed('back')) return 'close';
    menuNav(this, input, items.length, this.game.audio);
    if (input.pressed('interact')) {
      const it = ITEMS[items[this.sel]];
      if (it && it.doc) return 'doc:' + it.doc;
    }
    return null;
  }
  draw(ctx) {
    const s = this.game.state;
    ctx.fillStyle = 'rgba(5,7,12,0.72)'; ctx.fillRect(0, 0, 320, 180);
    panel(ctx, 40, 28, 240, 120, UI.panel, UI.edgeHi);
    font(ctx, 6.2); spaced(ctx, 'WHAT I CARRY', 160, 42, UI.bone, 2, 'center');
    s.items.forEach((id, i) => {
      const it = ITEMS[id];
      const y = 58 + i * 10;
      const sel = i === this.sel;
      if (sel) { ctx.fillStyle = UI.amber; ctx.fillRect(50, y - 3, 3, 1.2); }
      font(ctx, 5.6); text(ctx, it ? it.name : id, 56, y, sel ? UI.bone : UI.dim);
    });
    ctx.fillStyle = UI.edge; ctx.fillRect(140, 52, 0.6, 88);
    const it = ITEMS[s.items[this.sel]];
    if (it) {
      font(ctx, 5.4, { italic: true });
      const desc = it.revolver ? revolverDescription(s) : it.text;
      wrap(ctx, desc, 128).forEach((l, i) => text(ctx, l, 146, 58 + i * 7, UI.dim));
      if (it.doc) { font(ctx, 4.6, { italic: true }); text(ctx, 'E — read it', 146, 136, UI.amber); }
    }
    font(ctx, 4.3, { italic: true });
    text(ctx, 'I / Esc close', 160, 145, UI.faint, 'center');
  }
}

// ---------------- Document (telegram) ----------------
export class DocumentView {
  constructor(game, id) { this.game = game; this.id = id; this.t = 0; }
  update(input) {
    this.t += 1 / 60;
    if (this.t > 0.6 && (input.pressed('confirm') || input.pressed('pause') || input.pressed('back') || input.pressed('inventory'))) return 'close';
    return null;
  }
  draw(ctx) {
    const a = Math.min(1, this.t / 0.5);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(5,7,12,0.55)'; ctx.fillRect(0, 0, 320, 180);
    const x = 70, y = 40, w = 180, h = 92;
    ctx.fillStyle = '#e4dcc4'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#cfc4a6'; ctx.fillRect(x, y + h - 2, w, 2); ctx.fillRect(x + w - 2, y, 2, h);
    ctx.fillStyle = 'rgba(120,100,60,0.18)'; ctx.fillRect(x, y + 30, w, 0.6); ctx.fillRect(x + 60, y, 0.6, h);
    font(ctx, 5.2, { bold: true });
    spaced(ctx, 'TELEGRAM', x + w / 2, y + 11, '#3b2f22', 2, 'center');
    ctx.fillStyle = '#3b2f22'; ctx.fillRect(x + 10, y + 14, w - 20, 0.6);
    font(ctx, 5, { family: "'Courier New', Courier, monospace" });
    let yy = y + 24;
    for (const l of TELEGRAM_TEXT) for (const ln of wrap(ctx, l, w - 20)) { text(ctx, ln, x + 10, yy, '#2a2118'); yy += 6.6; }
    ctx.globalAlpha = 1;
    if (this.t > 0.6) { font(ctx, 4.6, { italic: true }); text(ctx, 'E — fold it away', 160, 146, UI.dim, 'center'); }
  }
}

// ---------------- End of the slice ----------------
export class EndCard {
  constructor(game) { this.game = game; this.t = 0; this.sel = 0; this.items = [{ label: 'Keep investigating at the mill', act: 'continue' }, { label: 'Return to the title', act: 'title' }]; }
  update(input) {
    this.t += 1 / 60;
    if (this.t < 2) return null;
    menuNav(this, input, this.items.length, this.game.audio);
    if (input.pressed('confirm')) return this.items[this.sel].act;
    return null;
  }
  draw(ctx) {
    const s = this.game.state;
    ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, 320, 180);
    const a = Math.min(1, this.t / 1.5);
    ctx.globalAlpha = a;
    font(ctx, 13); spaced(ctx, 'THE WHITE TRAIL', 160, 34, UI.bone, 3, 'center');
    font(ctx, 5.2, { italic: true });
    text(ctx, 'The first night ends here. The storm does not.', 160, 45, UI.dim, 'center');
    const total = Object.keys(EVIDENCE).filter((id) => EVIDENCE[id].location === 'SAWMILL').length;
    const found = countAt(s, 'SAWMILL');
    const statements = Object.keys(s.evidence).filter((id) => EVIDENCE[id].category === 'TESTIMONY').length;
    font(ctx, 5.4);
    const lines = [
      `Details recorded at the mill: ${found} of ${total}`,
      `Statements taken: ${statements}`,
      `Deductions: ${s.deductions.length ? s.deductions.map((d) => DEDUCTIONS[d].title).join('; ') : 'none yet'}`,
    ];
    let y = 62;
    for (const l of lines) for (const ln of wrap(ctx, l, 250)) { text(ctx, ln, 160, y, UI.bone, 'center'); y += 7.5; }
    y += 3;
    font(ctx, 4.8, { bold: true }); spaced(ctx, 'STILL OPEN', 160, y, UI.amber, 1.2, 'center'); y += 7;
    font(ctx, 5, { italic: true });
    const all = LEADS.map((l) => l.variants.find((v) => test(v.if, s))).filter(Boolean);
    // the newest questions (the ridge, the ledger) matter most at this point; keep them visible
    const open = all.length > 8 ? [...all.slice(0, 4), ...all.slice(-4)] : all;
    for (const v of open) { text(ctx, v.text, 160, y, UI.dim, 'center'); y += 6.1; }
    ctx.globalAlpha = 1;
    if (this.t >= 2) drawMenu(ctx, this.items, this.sel, 160, 156, { align: 'center', size: 5.6, gap: 8.5 });
  }
}
