// Title, pause, settings, controls help, confirmation, inventory, document and end-card overlays.
// All keyboard-driven. Each overlay: update(input) -> action | null, draw(ctx).
import { UI, font, text, spaced, panel, wrap, keycap, UI_W, UI_H, UI_CX, UI_LEFT, UI_RIGHT, UI_TOP, UI_BOTTOM } from './text.js';
import { ITEMS, TELEGRAM_TEXT, LEADS } from '../data/notebookData.js';
import { EVIDENCE } from '../data/evidence.js';
import { DEDUCTIONS } from '../data/notebookData.js';
import { revolverDescription } from '../systems/survival.js';
import { isFullscreen, toggleFullscreen } from '../engine/display.js';
import { test, countAt } from '../systems/storyState.js';
import { drawItemIcon } from './itemIcons.js';

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
    spaced(ctx, 'THE WHITE TRAIL', UI_CX, 62, UI.bone, 3.6, 'center');
    ctx.fillStyle = UI.amberDim; ctx.fillRect(140, 69, 40, 0.7);
    font(ctx, 5.2, { italic: true });
    text(ctx, 'Crow\'s Hollow, in the Rocky Mountains. Winter, 1892.', UI_CX, 79, UI.dim, 'center');
    ctx.globalAlpha = 1;
    if (!this.pressed) {
      if (this.t > 1.2 && Math.floor(this.t * 1.4) % 2 === 0) { font(ctx, 5.4); text(ctx, 'Press any key', UI_CX, 130, UI.dim, 'center'); }
      ctx.fillStyle = 'rgba(5,7,12,0.75)'; ctx.fillRect(UI_LEFT, UI_H - 18, UI_RIGHT - UI_LEFT, 18);
      font(ctx, 4.5, { italic: true });
      text(ctx, 'Sound is part of this game. Headphones recommended.', UI_CX, 172, UI.dim, 'center');
      return;
    }
    drawMenu(ctx, this.items, this.sel, UI_CX, 110, { align: 'center', size: 6.2, gap: 10 });
    ctx.fillStyle = 'rgba(5,7,12,0.75)'; ctx.fillRect(UI_LEFT, UI_H - 18, UI_RIGHT - UI_LEFT, 18);
    font(ctx, 4.5, { italic: true });
    text(ctx, 'Up / Down  choose    E / Enter confirm', UI_CX, 172, UI.dim, 'center');
  }
}

// ---------------- Pause ----------------
export class PauseMenu {
  constructor(game) {
    this.game = game; this.sel = 0;
    this.items = [
      { label: 'Resume', act: 'resume' }, { label: 'Notebook', act: 'notebook' }, { label: 'Inventory', act: 'inventory' }, { label: 'Map', act: 'map' },
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
    ctx.fillStyle = 'rgba(5,7,12,0.72)'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    panel(ctx, 96, 30, 128, 114, UI.panel, UI.edgeHi);
    font(ctx, 6.4); spaced(ctx, 'PAUSED', UI_CX, 50, UI.bone, 2, 'center');
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
      { key: 'footsteps', label: '   Footsteps', val: pct(s.footsteps), kind: 'vol' },
      { key: 'interaction', label: '   Interaction sounds', val: pct(s.interaction), kind: 'vol' },
      { key: 'music', label: 'Music volume', val: pct(s.music), kind: 'vol' },
      { key: 'textSpeed', label: 'Text speed', val: s.textSpeed, kind: 'enum', opts: ['slow', 'normal', 'fast', 'instant'] },
      { key: 'reducedMotion', label: 'Reduce camera motion', val: s.reducedMotion ? 'on' : 'off', kind: 'bool' },
      { key: 'vignette', label: 'Vignette', val: s.vignette ? 'on' : 'off', kind: 'bool' },
      { key: 'scanlines', label: 'Scanlines', val: s.scanlines ? 'on' : 'off', kind: 'bool' },
      { key: 'scaling', label: 'Display scaling', val: s.scaling === 'integer' ? 'whole pixels' : 'fill window', kind: 'enum', opts: ['auto', 'integer'] },
      { key: 'fullscreen', label: 'Fullscreen  (Alt+Enter)', val: isFullscreen() ? 'on' : 'off', kind: 'action' },
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
    if (r.kind === 'action') { toggleFullscreen(); this.game.audio.sfx('tick'); return null; }
    if (r.kind === 'vol') s[r.key] = Math.max(0, Math.min(1, Math.round((s[r.key] + d * 0.1) * 10) / 10));
    if (r.kind === 'bool') s[r.key] = !s[r.key];
    if (r.kind === 'enum') { const i = r.opts.indexOf(s[r.key]); s[r.key] = r.opts[(i + d + r.opts.length) % r.opts.length]; }
    this.game.applySettings();
    this.game.audio.sfx('tick');
    return null;
  }
  draw(ctx) {
    ctx.fillStyle = 'rgba(5,7,12,0.78)'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    panel(ctx, 66, 16, 188, 152, UI.panel, UI.edgeHi);
    font(ctx, 6.4); spaced(ctx, 'SETTINGS', UI_CX, 30, UI.bone, 2, 'center');
    this.rows().forEach((r, i) => {
      const y = 42 + i * 9; // 13 rows fit above the footer
      const sel = i === this.sel;
      font(ctx, 5.6);
      if (sel) { ctx.fillStyle = UI.amber; ctx.fillRect(76, y - 3, 3, 1.2); }
      text(ctx, r.label, 83, y, sel ? UI.bone : UI.dim);
      if (r.val) text(ctx, (sel && r.kind !== 'back' ? '‹ ' : '') + r.val + (sel ? ' ›' : ''), 246, y, sel ? UI.amber : UI.dim, 'right');
    });
    font(ctx, 4.3, { italic: true });
    text(ctx, 'Up / Down  choose    Left / Right  change    Esc back', UI_CX, 163, UI.faint, 'center');
  }
}

// ---------------- Controls help ----------------
export class ControlsHelp {
  constructor(game) { this.game = game; }
  update(input) { if (input.pressed('pause') || input.pressed('confirm') || input.pressed('back')) return 'back'; return null; }
  draw(ctx) {
    ctx.fillStyle = 'rgba(5,7,12,0.8)'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    panel(ctx, 56, 22, 208, 136, UI.panel, UI.edgeHi);
    font(ctx, 6.4); spaced(ctx, 'CONTROLS', UI_CX, 37, UI.bone, 2, 'center');
    const rows = [
      [['A', 'D'], 'or arrow keys — walk'], [['E'], 'examine · speak · open · continue'], [['F'], 'light or shutter the lantern'],
      [['N'], 'notebook (also Tab)'], [['I'], 'inventory'], [['M'], 'map'], [['Esc'], 'pause · close a panel'],
      [['1', '–', '5'], 'pick a dialogue choice (or Up / Down and E)'],
      [['Alt', 'Enter'], 'toggle fullscreen'],
    ];
    rows.forEach(([keys, desc], i) => {
      const y = 50 + i * 11;
      let x = 66;
      for (const k of keys) {
        if (k === '–') { font(ctx, 5); text(ctx, '–', x + 1, y, UI.dim); x += 6; continue; }
        x += keycap(ctx, k, x, y, UI.amber) + 2;
      }
      font(ctx, 5.4); text(ctx, desc, 120, y, UI.dim);
    });
    font(ctx, 4.6, { italic: true });
    text(ctx, 'Mouse is optional: click something to walk to it and use it; click to continue dialogue.', UI_CX, 140, UI.faint, 'center');
    text(ctx, 'There is no jump and no combat in this chapter.', UI_CX, 146.5, UI.faint, 'center');
    text(ctx, 'Press E or Esc to return', UI_CX, 153, UI.faint, 'center');
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
    ctx.fillStyle = 'rgba(5,7,12,0.8)'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    panel(ctx, 70, 62, 180, 54, UI.panel, UI.edgeHi);
    font(ctx, 5.8);
    wrap(ctx, this.q, 160).forEach((l, i) => text(ctx, l, UI_CX, 78 + i * 7, UI.bone, 'center'));
    drawMenu(ctx, [{ label: 'Yes' }, { label: 'No' }], this.sel, UI_CX, 98, { align: 'center', size: 5.8, gap: 8 });
  }
}

// ---------------- Inventory ----------------
// A grid of the objects Silas carries, each shown by its own illustration (ITEMS[id].icon, see
// ui/itemIcons.js), with the selected one drawn large beside its name and description.
const INV = { x: 22, y: 26, w: 276, h: 138, cols: 3, rows: 2, gx: 32, gy: 47, sw: 40, sh: 34, nameH: 13, divX: 166 };
export class Inventory {
  constructor(game) { this.game = game; this.sel = 0; this.top = 0; this.hover = -1; }
  slotRect(i) {
    const k = i - this.top * INV.cols;
    const c = k % INV.cols, r = Math.floor(k / INV.cols);
    return { x: INV.gx + c * (INV.sw + 3), y: INV.gy + r * (INV.sh + INV.nameH + 3), w: INV.sw, h: INV.sh };
  }
  slotAt(ux, uy, n) {
    for (let i = this.top * INV.cols; i < Math.min(n, (this.top + INV.rows) * INV.cols); i++) {
      const r = this.slotRect(i);
      if (ux >= r.x && ux <= r.x + r.w && uy >= r.y && uy <= r.y + r.h + INV.nameH) return i;
    }
    return -1;
  }
  update(input) {
    const items = this.game.state.items;
    const n = items.length;
    if (input.pressed('pause') || input.pressed('inventory') || input.pressed('back')) return 'close';
    if (!n) return null;
    const prev = this.sel;
    if (input.pressed('left')) this.sel = (this.sel + n - 1) % n;
    if (input.pressed('right')) this.sel = (this.sel + 1) % n;
    if (input.pressed('up') && this.sel - INV.cols >= 0) this.sel -= INV.cols;
    if (input.pressed('down') && this.sel + INV.cols < n) this.sel += INV.cols;
    else if (input.pressed('down') && Math.floor(this.sel / INV.cols) < Math.floor((n - 1) / INV.cols)) this.sel = n - 1;
    // mouse: hover highlights, a click selects (a second click on a readable item opens it)
    const disp = this.game.display;
    const l = input.pointer && disp.clientToUI(input.pointer.x, input.pointer.y);
    this.hover = l ? this.slotAt(l.x, l.y, n) : -1;
    let open = false;
    if (input.clicks && input.clicks.length) {
      input.clicks = input.clicks.filter((c) => {
        const u = disp.clientToUI(c.x, c.y);
        const i = u ? this.slotAt(u.x, u.y, n) : -1;
        if (i < 0) return true;
        if (i === this.sel) open = true; else this.sel = i;
        return false;
      });
    }
    if (this.sel !== prev) this.game.audio.sfx('tick');
    // keep the selected row in view when there are more items than slots
    const row = Math.floor(this.sel / INV.cols);
    if (row < this.top) this.top = row;
    if (row >= this.top + INV.rows) this.top = row - INV.rows + 1;
    if (input.pressed('interact') || open) {
      const it = ITEMS[items[this.sel]];
      if (it && it.doc) return 'doc:' + it.doc;
    }
    return null;
  }
  draw(ctx) {
    const s = this.game.state;
    ctx.fillStyle = 'rgba(5,7,12,0.72)'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    panel(ctx, INV.x, INV.y, INV.w, INV.h, UI.panel, UI.edgeHi);
    font(ctx, 6.2); spaced(ctx, 'WHAT I CARRY', UI_CX, INV.y + 12, UI.bone, 2, 'center');
    ctx.fillStyle = UI.edge; ctx.fillRect(INV.x + 10, INV.y + 17, INV.w - 20, 0.6);
    const n = s.items.length;
    const first = this.top * INV.cols, last = Math.min(n, first + INV.rows * INV.cols);
    for (let i = first; i < first + INV.rows * INV.cols; i++) {
      const r = this.slotRect(i);
      if (i >= last) { panel(ctx, r.x, r.y, r.w, r.h, 'rgba(15,20,32,0.45)', 'rgba(51,65,85,0.5)'); continue; }
      const id = s.items[i];
      const it = ITEMS[id];
      const sel = i === this.sel, hov = i === this.hover && !sel;
      panel(ctx, r.x, r.y, r.w, r.h, sel ? 'rgba(40,30,18,0.92)' : 'rgba(15,20,32,0.85)', sel ? UI.amber : hov ? UI.dim : UI.edge);
      // the pictures carry ~3px of transparent margin, so they may fill the box edge to edge
      drawItemIcon(ctx, id, r.x + r.w / 2, r.y + r.h / 2, r.h + 2);
      font(ctx, 4.2, { italic: !sel });
      const lines = wrap(ctx, it ? it.name : id, r.w + 2).slice(0, 2);
      lines.forEach((ln, k) => text(ctx, ln, r.x + r.w / 2, r.y + r.h + 5 + k * 4.6, sel ? UI.bone : UI.dim, 'center'));
    }
    if (first > 0) { font(ctx, 4.4); text(ctx, '▲', INV.gx + 64, INV.gy - 3, UI.faint, 'center'); }
    if (last < n) { font(ctx, 4.4); text(ctx, '▼', INV.gx + 64, INV.y + INV.h - 10, UI.faint, 'center'); }
    ctx.fillStyle = UI.edge; ctx.fillRect(INV.divX, INV.y + 24, 0.6, INV.h - 40);
    const id = s.items[this.sel];
    const it = ITEMS[id];
    const rx = INV.divX + 8, rw = INV.x + INV.w - 10 - rx, rcx = rx + rw / 2;
    if (it) {
      // the selected object, large
      drawItemIcon(ctx, id, rcx, INV.y + 50, 56);
      font(ctx, 6); text(ctx, it.name, rcx, INV.y + 86, UI.bone, 'center');
      font(ctx, 5, { italic: true });
      const desc = it.revolver ? revolverDescription(s) : it.text;
      wrap(ctx, desc, rw).slice(0, 7).forEach((l, i) => text(ctx, l, rx, INV.y + 95 + i * 6.2, UI.dim));
      if (it.doc) { font(ctx, 4.6, { italic: true }); text(ctx, 'E — read it', rx, INV.y + INV.h - 6, UI.amber); }
    } else {
      font(ctx, 5.4, { italic: true }); text(ctx, 'Empty pockets.', rcx, INV.y + 60, UI.faint, 'center');
    }
    font(ctx, 4.3, { italic: true });
    text(ctx, 'Arrows choose · I / Esc close', INV.gx, INV.y + INV.h - 6, UI.faint);
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
    ctx.fillStyle = 'rgba(5,7,12,0.55)'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
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
    if (this.t > 0.6) { font(ctx, 4.6, { italic: true }); text(ctx, 'E — fold it away', UI_CX, 146, UI.dim, 'center'); }
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
    ctx.fillStyle = '#05070c'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    const a = Math.min(1, this.t / 1.5);
    ctx.globalAlpha = a;
    font(ctx, 13); spaced(ctx, 'THE WHITE TRAIL', UI_CX, 34, UI.bone, 3, 'center');
    font(ctx, 5.2, { italic: true });
    text(ctx, 'The first night ends here. The storm does not.', UI_CX, 45, UI.dim, 'center');
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
    for (const l of lines) for (const ln of wrap(ctx, l, 250)) { text(ctx, ln, UI_CX, y, UI.bone, 'center'); y += 7.5; }
    y += 3;
    font(ctx, 4.8, { bold: true }); spaced(ctx, 'STILL OPEN', UI_CX, y, UI.amber, 1.2, 'center'); y += 7;
    font(ctx, 5, { italic: true });
    const all = LEADS.map((l) => l.variants.find((v) => test(v.if, s))).filter(Boolean);
    // the newest questions (the ridge, the ledger) matter most at this point; keep them visible
    const open = all.length > 8 ? [...all.slice(0, 4), ...all.slice(-4)] : all;
    for (const v of open) { text(ctx, v.text, UI_CX, y, UI.dim, 'center'); y += 6.1; }
    ctx.globalAlpha = 1;
    if (this.t >= 2) drawMenu(ctx, this.items, this.sel, UI_CX, 156, { align: 'center', size: 5.6, gap: 8.5 });
  }
}
