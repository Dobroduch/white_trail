// Silas's case file. Tabs: Case · Evidence · Statements · Leads · Deductions.
// Evidence entries separate OBSERVED (what he saw) from INTERPRETATION (his tentative reading).
// Deductions are formed only from authored pairs of records the player has actually found.
import { UI, font, text, panel, wrap, spaced, UI_W, UI_H, UI_CX } from './text.js';
import { EVIDENCE, PLACE_NAMES, PEOPLE_NAMES } from '../data/evidence.js';
import { DEDUCTIONS, DEDUCTION_REFUSAL, LEADS, PEOPLE, TELEGRAM_TEXT } from '../data/notebookData.js';
import { test, timeString } from '../systems/storyState.js';

const TABS = ['CASE', 'EVIDENCE', 'STATEMENTS', 'LEADS', 'DEDUCTIONS'];
const ROWS = 14;
const CAT = { PHYSICAL: 'Physical trace', DOCUMENT: 'Document', PERSONAL: 'Personal object', ENVIRONMENT: 'Environment', TESTIMONY: 'Statement' };

export class Notebook {
  constructor(game) { this.game = game; this.tab = 1; this.sel = 0; this.scroll = 0; this.marked = []; this.result = null; }

  open(tabName) {
    if (tabName) this.tab = TABS.indexOf(tabName);
    this.sel = 0; this.scroll = 0; this.marked = []; this.result = null;
    this.game.audio.sfx('page');
  }

  records(kind) {
    const s = this.game.state;
    return Object.keys(s.evidence)
      .filter((id) => EVIDENCE[id] && (kind === 'ALL' || (kind === 'TESTIMONY') === (EVIDENCE[id].category === 'TESTIMONY')))
      .sort((a, b) => s.evidence[a].n - s.evidence[b].n);
  }

  listFor(tab) {
    const s = this.game.state;
    switch (TABS[tab]) {
      case 'CASE': return ['telegram', 'people', 'timeline'];
      case 'EVIDENCE': return this.records('PHYSICAL');
      case 'STATEMENTS': return this.records('TESTIMONY');
      case 'LEADS': return LEADS.map((l) => ({ id: l.id, v: l.variants.find((v) => test(v.if, s)) })).filter((l) => l.v);
      case 'DEDUCTIONS': return [...s.deductions.map((d) => 'D:' + d), ...this.records('ALL')];
      default: return [];
    }
  }

  update(input) {
    const list = this.listFor(this.tab);
    if (input.pressed('pause') || input.pressed('notebook')) { this.game.audio.sfx('page'); return 'close'; }
    if (input.pressed('left')) { this.tab = (this.tab + TABS.length - 1) % TABS.length; this.sel = 0; this.scroll = 0; this.result = null; this.marked = []; this.game.audio.sfx('page'); }
    if (input.pressed('right')) { this.tab = (this.tab + 1) % TABS.length; this.sel = 0; this.scroll = 0; this.result = null; this.marked = []; this.game.audio.sfx('page'); }
    if (list.length) {
      if (input.pressed('up')) { this.sel = (this.sel + list.length - 1) % list.length; this.game.audio.sfx('tick'); }
      if (input.pressed('down')) { this.sel = (this.sel + 1) % list.length; this.game.audio.sfx('tick'); }
      this.sel = Math.min(this.sel, list.length - 1);
      if (this.sel < this.scroll) this.scroll = this.sel;
      if (this.sel >= this.scroll + ROWS) this.scroll = this.sel - ROWS + 1;
    }
    if (TABS[this.tab] === 'DEDUCTIONS' && input.pressed('interact')) {
      const id = list[this.sel];
      if (id && !id.startsWith('D:')) this.toggleMark(id);
    }
    return null;
  }

  toggleMark(id) {
    const i = this.marked.indexOf(id);
    if (i >= 0) { this.marked.splice(i, 1); this.game.audio.sfx('tick'); return; }
    this.marked.push(id);
    this.game.audio.sfx('tick');
    if (this.marked.length === 2) {
      const [a, b] = this.marked;
      const s = this.game.state;
      let found = null;
      for (const [did, d] of Object.entries(DEDUCTIONS)) {
        if (d.pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) { found = did; break; }
      }
      if (!found) { this.result = { ok: false, text: DEDUCTION_REFUSAL }; this.game.audio.sfx('refuse'); }
      else if (s.deductions.includes(found)) { this.result = { ok: true, text: `Already worked out: "${DEDUCTIONS[found].title}".` }; }
      else {
        s.deductions.push(found);
        this.result = { ok: true, text: `Deduction: ${DEDUCTIONS[found].title}.`, id: found };
        this.game.audio.sfx('pen');
        this.game.checkpoint();
        this.sel = s.deductions.length - 1; this.scroll = 0;
      }
      this.marked = [];
    }
  }

  draw(ctx) {
    const s = this.game.state;
    // paper
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, UI_W, UI_H);
    panel(ctx, 8, 6, 304, 168, UI.paper, '#3b2f22');
    ctx.fillStyle = 'rgba(90,70,40,0.07)';
    for (let y = 30; y < 166; y += 7) ctx.fillRect(14, y, 292, 0.4);
    font(ctx, 5, { italic: true });
    text(ctx, `Case file — S. Vance`, 16, 15, UI.inkDim);
    text(ctx, `${this.game.scene.name.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())} · ${timeString(s.time)}`, 304, 15, UI.inkDim, 'right');
    // tabs
    font(ctx, 4.9, { bold: true });
    let tx = 16;
    TABS.forEach((t, i) => {
      const w = spaced(ctx, t, tx, 25, i === this.tab ? UI.inkRed : UI.inkDim, 0.6);
      if (i === this.tab) { ctx.fillStyle = UI.inkRed; ctx.fillRect(tx, 27, w, 0.7); }
      tx += w + 10;
    });
    ctx.fillStyle = UI.rule; ctx.fillRect(14, 30, 292, 0.6);
    const name = TABS[this.tab];
    if (name === 'LEADS') this.drawLeads(ctx);
    else this.drawListAndDetail(ctx, name);
    // footer
    font(ctx, 4.3, { italic: true });
    const foot = name === 'DEDUCTIONS' ? 'Left / Right  tabs    Up / Down  choose    E mark two records to compare    Tab / Esc close'
      : 'Left / Right  tabs    Up / Down  choose    Tab / Esc close';
    text(ctx, foot, UI_CX, 170, UI.inkDim, 'center');
  }

  drawLeads(ctx) {
    const list = this.listFor(this.tab);
    font(ctx, 5.4, { italic: true });
    text(ctx, 'Open questions. Not answers.', 18, 40, UI.inkDim);
    let y = 50;
    font(ctx, 5.6);
    for (const l of list) {
      const lines = wrap(ctx, l.v.text, 270);
      ctx.fillStyle = UI.inkRed; ctx.fillRect(19, y - 2.6, 1.6, 1.6);
      lines.forEach((ln, i) => text(ctx, ln, 25, y + i * 6.8, UI.ink));
      y += lines.length * 6.8 + 3.5;
      if (y > 160) break;
    }
  }

  drawListAndDetail(ctx, name) {
    const s = this.game.state;
    const list = this.listFor(this.tab);
    ctx.fillStyle = UI.rule; ctx.fillRect(122, 34, 0.6, 128);
    if (!list.length) {
      font(ctx, 5.4, { italic: true });
      text(ctx, name === 'STATEMENTS' ? 'No one has told me anything worth writing down.' : 'Nothing recorded yet.', 18, 44, UI.inkDim);
      return;
    }
    // list
    font(ctx, 5.2);
    for (let i = this.scroll; i < Math.min(list.length, this.scroll + ROWS); i++) {
      const id = list[i];
      const y = 41 + (i - this.scroll) * 8.6;
      const sel = i === this.sel;
      let label;
      if (name === 'CASE') label = { telegram: 'The telegram', people: 'People', timeline: 'Timeline' }[id];
      else if (id.startsWith('D:')) label = '◆ ' + DEDUCTIONS[id.slice(2)].title;
      else label = EVIDENCE[id].title;
      if (sel) { ctx.fillStyle = 'rgba(127,29,29,0.13)'; ctx.fillRect(14, y - 6, 106, 8); }
      let x = 18;
      if (name === 'DEDUCTIONS' && !id.startsWith('D:')) {
        const m = this.marked.includes(id);
        ctx.strokeStyle = UI.inkDim; ctx.lineWidth = 0.5; ctx.strokeRect(17, y - 4.6, 4, 4);
        if (m) { ctx.fillStyle = UI.inkRed; ctx.fillRect(18, y - 3.6, 2, 2); }
        x = 24;
      }
      font(ctx, 5.2, { bold: id.startsWith('D:') });
      let lab = label;
      while (ctx.measureText(lab).width > 118 - x && lab.length > 4) lab = lab.slice(0, -2);
      if (lab !== label) lab = lab.trimEnd() + '…';
      text(ctx, lab, x, y, sel ? UI.ink : UI.inkDim);
      if (name !== 'CASE' && !id.startsWith('D:') && EVIDENCE[id].category !== 'TESTIMONY' && !s.evidence[id].examined) {
        ctx.fillStyle = UI.inkDim; ctx.fillRect(116, y - 2.5, 1.2, 1.2);
      }
    }
    if (list.length > ROWS) { font(ctx, 4.4, { italic: true }); text(ctx, `${this.sel + 1} / ${list.length}`, 118, 162, UI.inkDim, 'right'); }
    // detail
    const id = list[this.sel];
    const X = 128, MW = 176;
    let y = 40;
    const heading = (str) => { font(ctx, 4.5, { bold: true }); spaced(ctx, str, X, y, UI.inkRed, 0.6); y += 6.5; };
    const para = (str, opt = {}) => {
      font(ctx, 5.3, opt);
      for (const ln of wrap(ctx, str, MW)) { text(ctx, ln, X, y, opt.col || UI.ink); y += 6.5; }
      y += 3;
    };
    if (name === 'CASE') {
      if (id === 'telegram') {
        heading('THE TELEGRAM');
        font(ctx, 4.9, { family: "'Courier New', Courier, monospace" });
        for (const l of TELEGRAM_TEXT) for (const ln of wrap(ctx, l, MW)) { text(ctx, ln, X, y, UI.ink); y += 6.2; }
        y += 3;
        para('It is the reason I am here. I have nothing yet but this paper and a name.', { italic: true, col: UI.inkDim });
      } else if (id === 'people') {
        heading('PEOPLE');
        for (const p of PEOPLE) {
          if (p.if && !test(p.if, s)) continue;
          const v = p.variants.find((vv) => test(vv.if, s));
          font(ctx, 5.3, { bold: true }); text(ctx, p.name, X, y, UI.ink); y += 6.3;
          para(v.text, { italic: true, col: UI.inkDim });
        }
      } else {
        heading('TIMELINE');
        for (const e of s.timeline) {
          font(ctx, 5.1, { bold: true }); text(ctx, e.t, X, y, UI.inkRed);
          font(ctx, 5.2);
          const lines = wrap(ctx, e.text, MW - 22);
          lines.forEach((ln, i) => text(ctx, ln, X + 22, y + i * 6.3, UI.ink));
          y += lines.length * 6.3 + 2.5;
        }
      }
      return;
    }
    if (id.startsWith('D:')) {
      const d = DEDUCTIONS[id.slice(2)];
      heading('DEDUCTION');
      font(ctx, 6, { bold: true }); text(ctx, d.title, X, y + 1, UI.ink); y += 9;
      para(d.text);
      heading('WHAT IT DOES NOT TELL ME');
      para(d.limits, { italic: true, col: UI.inkDim });
      return;
    }
    const ev = EVIDENCE[id];
    const rec = s.evidence[id];
    font(ctx, 6, { bold: true });
    for (const ln of wrap(ctx, ev.title, MW)) { text(ctx, ln, X, y, UI.ink); y += 7; }
    font(ctx, 4.6, { italic: true });
    text(ctx, `${CAT[ev.category]} · ${ev.speaker ? ev.speaker + ', ' : ''}${PLACE_NAMES[ev.location] || ev.location}`, X, y, UI.inkDim);
    y += 8;
    if (name === 'DEDUCTIONS') {
      heading(ev.category === 'TESTIMONY' ? 'SAID' : 'OBSERVED');
      para(ev.observed);
      if (this.result) {
        heading('COMPARISON');
        para(this.result.text, { italic: true, col: this.result.ok ? UI.ink : UI.inkRed });
      } else {
        font(ctx, 4.8, { italic: true });
        text(ctx, this.marked.length ? 'Marked one. Choose a second record to compare.' : 'Mark two records that bear on each other.', X, Math.max(y, 150), UI.inkDim);
      }
      return;
    }
    heading(ev.category === 'TESTIMONY' ? 'SAID' : 'OBSERVED');
    para(ev.observed);
    if (ev.detail) {
      heading('CLOSER LOOK');
      if (rec.examined) para(ev.detail);
      else para('Not yet examined closely.', { italic: true, col: UI.inkDim });
    }
    heading(ev.category === 'TESTIMONY' ? 'MY READING' : 'INTERPRETATION');
    para(ev.interpretation, { italic: true, col: '#4a3020' });
    const people = (ev.related.people || []).map((p) => PEOPLE_NAMES[p]).filter(Boolean);
    if (people.length && y < 158) {
      font(ctx, 4.5, { italic: true });
      text(ctx, 'Bears on: ' + people.join(', '), X, Math.min(y + 1, 162), UI.inkDim);
    }
  }
}
