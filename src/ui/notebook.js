// Silas's case file. Tabs: Case · Evidence · Statements · Leads · Deductions · Mind map · People.
// Evidence entries separate OBSERVED (what he saw) from INTERPRETATION (his tentative reading); all of it stays here.
// The Deductions page works only with the short key statements of ONE question at a time (data/caseData.js): mark
// two to compare, choose a reading for each deduction, and press C to review the possible conclusions and commit.
// The Mind map draws the same deductions as nodes joined to the statements and deductions that support them.
import { UI, font, text, panel, wrap, spaced, UI_CX, UI_LEFT, UI_RIGHT, UI_TOP, UI_BOTTOM } from './text.js';
import { EVIDENCE, PLACE_NAMES, PEOPLE_NAMES } from '../data/evidence.js';
import { LEADS, PEOPLE, TELEGRAM_TEXT } from '../data/notebookData.js';
import { STATEMENTS, DEDUCTIONS, DEDUCTION_REFUSAL, CONCLUSIONS, STATEMENT_MAP } from '../data/caseData.js';
import { test, timeString } from '../systems/storyState.js';
import {
  questions, question, knownStatements, statementText, statementSources, deductionsFor, tryPair, supportOf, detailsOf,
  readingOf, cycleReading, hasReadings, conclusionsFor, committed, caseOfQuestion,
} from '../systems/caseSystem.js';
import { getSprite } from '../engine/assets.js';
import { CaseReview } from './caseReview.js';
import { touchify } from './touchText.js';

export const TABS = ['CASE', 'EVIDENCE', 'STATEMENTS', 'LEADS', 'DEDUCTIONS', 'MIND MAP', 'PEOPLE'];
const ROWS = 14;
const CAT = { PHYSICAL: 'Physical trace', DOCUMENT: 'Document', PERSONAL: 'Personal object', ENVIRONMENT: 'Environment', TESTIMONY: 'Statement' };
// Mind-map area (UI units) and node sizes.
const MM = { x: 14, y: 42, w: 188, h: 121, dw: 50, sw: 40 };

export class Notebook {
  constructor(game) { this.game = game; this.tab = 1; this.sel = 0; this.scroll = 0; this.marked = []; this.result = null; this.q = null; }

  tabName() { return TABS[this.tab]; }
  resultText() { return this.game.touchUI() ? touchify(this.result.text) : this.result.text; }

  open(tabName) {
    if (tabName) this.tab = TABS.indexOf(tabName);
    this.sel = 0; this.scroll = 0; this.marked = []; this.result = null;
    this.pickQuestion();
    this.game.audio.sfx('page');
  }

  // The current question: keep the player's choice while it is available; otherwise the first open case.
  pickQuestion() {
    const s = this.game.state;
    const qs = questions(s);
    if (this.q && qs.some((q) => q.id === this.q)) return;
    const open = qs.find((q) => q.case && !committed(s, q.case));
    this.q = (open || qs[0] || {}).id || null;
  }
  cycleQuestion() {
    const qs = questions(this.game.state);
    if (qs.length < 2) return;
    const i = qs.findIndex((q) => q.id === this.q);
    this.q = qs[(i + 1) % qs.length].id;
    this.sel = 0; this.scroll = 0; this.marked = []; this.result = null;
    this.game.audio.sfx('page');
  }

  records(kind) {
    const s = this.game.state;
    return Object.keys(s.evidence)
      .filter((id) => EVIDENCE[id] && (kind === 'ALL' || (kind === 'TESTIMONY') === (EVIDENCE[id].category === 'TESTIMONY')))
      .sort((a, b) => s.evidence[a].n - s.evidence[b].n);
  }
  people() { const s = this.game.state; return PEOPLE.filter((p) => test(p.if, s)).map((p) => p.id); }

  // Deductions page rows: the current question's header, its statements and deductions, then the other questions.
  deductionRows() {
    const s = this.game.state;
    const out = [];
    for (const q of questions(s)) {
      out.push('Q:' + q.id);
      if (q.id !== this.q) continue;
      for (const id of knownStatements(s, q.id)) out.push('S:' + id);
      for (const id of deductionsFor(s, q.id)) out.push('D:' + id);
    }
    return out;
  }
  // Mind-map nodes for the current question, in reading order (top to bottom, left to right).
  mapNodes() {
    const s = this.game.state;
    if (!this.q) return [];
    const ds = deductionsFor(s, this.q);
    const ss = [];
    for (const d of ds) for (const x of supportOf(s, d)) if (!ss.includes(x)) ss.push(x);
    const nodes = [...ds.map((d) => 'D:' + d), ...ss.map((x) => 'S:' + x)];
    const pos = (n) => this.nodePos(n);
    return nodes.sort((a, b) => (pos(a).y - pos(b).y) || (pos(a).x - pos(b).x));
  }
  nodePos(n) {
    const [k, id] = n.split(':');
    const m = k === 'D' ? DEDUCTIONS[id].map : STATEMENT_MAP[id] || { x: 0.5, y: 0.5 };
    const half = k === 'D' ? MM.dw / 2 : MM.sw / 2;
    return { x: MM.x + half + m.x * (MM.w - half * 2), y: MM.y + 6 + m.y * (MM.h - 14) };
  }

  listFor(tab) {
    const s = this.game.state;
    switch (TABS[tab]) {
      case 'CASE': return ['telegram', 'timeline', ...questions(s).filter((q) => q.case).map((q) => 'Q:' + q.id)];
      case 'EVIDENCE': return this.records('PHYSICAL');
      case 'STATEMENTS': return this.records('TESTIMONY');
      case 'LEADS': return LEADS.map((l) => ({ id: l.id, v: l.variants.find((v) => test(v.if, s)) })).filter((l) => l.v);
      case 'DEDUCTIONS': return this.deductionRows();
      case 'MIND MAP': return this.mapNodes();
      case 'PEOPLE': return this.people();
      default: return [];
    }
  }

  update(input) {
    const name = TABS[this.tab];
    if (input.pressed('pause') || input.pressed('notebook')) { this.game.audio.sfx('page'); return 'close'; }
    const tabTo = (t) => { this.tab = (t + TABS.length) % TABS.length; this.sel = 0; this.scroll = 0; this.result = null; this.marked = []; this.game.audio.sfx('page'); };
    if (input.pressed('left')) { tabTo(this.tab - 1); return null; }
    if (input.pressed('right')) { tabTo(this.tab + 1); return null; }
    if (input.pressed('question') && (name === 'DEDUCTIONS' || name === 'MIND MAP')) this.cycleQuestion();
    if (input.pressed('caseReview')) { this.openReview(this.q); return null; }
    // mouse / touch: tap a tab to open it; tap a line (or a mind-map node) to select it, tap it again to use it (like E)
    const tap = this.tapAt(input);
    if (tap && tap.tab != null) { if (tap.tab !== this.tab) tabTo(tap.tab); return null; }
    const list = this.listFor(this.tab);
    if (tap && tap.i != null && tap.i < list.length) {
      if (tap.i !== this.sel) {
        this.sel = tap.i; this.game.audio.sfx('tick');
        // tapping the first / last visible line scrolls the list on by one, so a finger can page through it
        if (name !== 'MIND MAP') { if (tap.i >= this.scroll + ROWS - 1 && tap.i < list.length - 1) this.scroll++; else if (tap.i <= this.scroll && this.scroll > 0) this.scroll--; }
        return null;
      }
      const id = list[this.sel];
      if (typeof id === 'string') this.act(name, id);
      return null;
    }
    if (list.length) {
      if (input.pressed('up')) { this.sel = (this.sel + list.length - 1) % list.length; this.game.audio.sfx('tick'); }
      if (input.pressed('down')) { this.sel = (this.sel + 1) % list.length; this.game.audio.sfx('tick'); }
      this.sel = Math.min(this.sel, list.length - 1);
      if (this.sel < this.scroll) this.scroll = this.sel;
      if (this.sel >= this.scroll + ROWS) this.scroll = this.sel - ROWS + 1;
    }
    if (input.pressed('interact')) {
      const id = list[this.sel];
      if (typeof id === 'string') this.act(name, id);
    }
    return null;
  }

  // The tab or list line under this step's click / tap (consumed), from the rects recorded by draw().
  tapAt(input) {
    if (!input.clicks || !input.clicks.length) return null;
    const disp = this.game.display;
    let hit = null;
    const inR = (u, r) => u.x >= r.x && u.x <= r.x + r.w && u.y >= r.y && u.y <= r.y + r.h;
    input.clicks = input.clicks.filter((c) => {
      if (hit) return true;
      const u = disp.clientToUI(c.x, c.y);
      if (!u) return true;
      const t = (this.tabRects || []).findIndex((r) => inR(u, r));
      if (t >= 0) { hit = { tab: t }; return false; }
      const row = (this.rowRects || []).find((r) => inR(u, r));
      if (row) { hit = { i: row.i }; return false; }
      return true;
    });
    return hit;
  }

  act(tab, id) {
    const [k, rest] = id.includes(':') ? id.split(':') : [null, id];
    if (k === 'S' && tab === 'DEDUCTIONS') return this.toggleMark(rest);
    if (k === 'D') return this.flipReading(rest);
    if (k === 'Q') {
      if (rest !== this.q && tab === 'DEDUCTIONS') { this.q = rest; this.marked = []; this.result = null; this.sel = this.deductionRows().indexOf(id); this.game.audio.sfx('page'); return; }
      return this.openReview(rest);
    }
  }

  openReview(qid) {
    const q = question(qid);
    if (!q) return;
    if (!q.case) { this.result = { ok: false, text: 'There is not enough here yet to decide anything. This question stays open.' }; this.game.audio.sfx('refuse'); return; }
    this.game.pushOverlay(new CaseReview(this.game, qid));
    this.game.audio.sfx('page');
  }

  flipReading(did) {
    const s = this.game.state;
    if (!hasReadings(did)) { this.result = { ok: true, text: 'That much is settled; there is only one way to read it.' }; return; }
    const caseId = caseOfQuestion(DEDUCTIONS[did].q);
    if (caseId && committed(s, caseId)) { this.result = { ok: false, text: 'I have already acted on my reading of this.' }; this.game.audio.sfx('refuse'); return; }
    if (cycleReading(s, did)) {
      this.result = { ok: true, text: `I read it as: ${DEDUCTIONS[did].readings[readingOf(s, did)].label.toLowerCase()}.` };
      this.game.audio.sfx('pen');
      this.game.checkpointSoon = true;
    }
  }

  toggleMark(id) {
    const i = this.marked.indexOf(id);
    if (i >= 0) { this.marked.splice(i, 1); this.game.audio.sfx('tick'); return; }
    this.marked.push(id);
    this.game.audio.sfx('tick');
    if (this.marked.length < 2) return;
    const [a, b] = this.marked;
    const s = this.game.state;
    const r = tryPair(s, a, b);
    if (!r.ok) { this.result = { ok: false, text: DEDUCTION_REFUSAL }; this.game.audio.sfx('refuse'); }
    else if (!r.fresh) this.result = { ok: true, text: `Already worked out: "${DEDUCTIONS[r.id].title}".` };
    else {
      this.result = { ok: true, text: `Deduction: ${DEDUCTIONS[r.id].title}.${hasReadings(r.id) ? ' It can be read two ways; E on it to choose.' : ''}`, id: r.id };
      this.game.audio.sfx('pen');
      this.game.checkpoint();
      this.sel = this.deductionRows().indexOf('D:' + r.id);
    }
    this.marked = [];
  }

  // ---------------- drawing ----------------
  draw(ctx) {
    const s = this.game.state;
    Detail.touch = this.game.touchUI();
    Detail.maxY = Detail.touch ? 150 : 164;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    panel(ctx, 8, 6, 304, 168, UI.paper, '#3b2f22');
    ctx.fillStyle = 'rgba(90,70,40,0.07)';
    for (let y = 30; y < 166; y += 7) ctx.fillRect(14, y, 292, 0.4);
    font(ctx, 5, { italic: true });
    // left-aligned: the panel buttons sit over the top-right corner
    text(ctx, `Case file — S. Vance   ·   ${this.game.scene.name.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())}, ${timeString(s.time)}`, 16, 15, UI.inkDim);
    font(ctx, 4.7, { bold: true });
    let tx = 16;
    this.tabRects = [];
    this.rowRects = [];
    TABS.forEach((t, i) => {
      const w = spaced(ctx, t, tx, 25, i === this.tab ? UI.inkRed : UI.inkDim, 0.45);
      this.tabRects.push({ x: tx - 3, y: 17, w: w + 7, h: 12 });
      if (i === this.tab) { ctx.fillStyle = UI.inkRed; ctx.fillRect(tx, 27, w, 0.7); }
      tx += w + 7.5;
    });
    ctx.fillStyle = UI.rule; ctx.fillRect(14, 30, 292, 0.6);
    const name = TABS[this.tab];
    if (name === 'LEADS') this.drawLeads(ctx);
    else if (name === 'MIND MAP') this.drawMindMap(ctx);
    else this.drawListAndDetail(ctx, name);
    font(ctx, 4.3, { italic: true });
    const foot = {
      DEDUCTIONS: 'Left/Right tabs   Up/Down choose   E mark a statement · choose a reading   Q question   C review the case   N close',
      'MIND MAP': 'Left/Right tabs   Up/Down choose a node   E choose a reading   Q question   C review the case   N close',
      CASE: 'Left/Right tabs   Up/Down choose   E review the case   N / Esc close',
    }[name] || 'Left / Right  tabs    Up / Down  choose    N / Esc close';
    const touchFoot = {
      DEDUCTIONS: 'Tap a tab   tap a line, tap again to mark it or choose a reading   Next question   Review case',
      'MIND MAP': 'Tap a node, tap again to choose a reading   Next question   Review case',
      CASE: 'Tap a tab   tap a line, tap again to review the case   Back closes',
    }[name] || 'Tap a tab   tap a line to read it   Back closes';
    if (!this.game.touchUI()) text(ctx, foot, UI_CX, 170, UI.inkDim, 'center'); // touch: the button bar sits here
    void touchFoot;
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

  label(name, id) {
    const s = this.game.state;
    if (name === 'CASE') {
      if (id.startsWith('Q:')) { const q = question(id.slice(2)); return (committed(s, q.case) ? '✓ ' : '? ') + q.short; }
      return { telegram: 'The telegram', timeline: 'Timeline' }[id];
    }
    if (name === 'PEOPLE') return PEOPLE.find((p) => p.id === id).name;
    if (id.startsWith('Q:')) return question(id.slice(2)).title;
    if (id.startsWith('S:')) return STATEMENTS[id.slice(2)].label;
    if (id.startsWith('D:')) { const d = id.slice(2); const r = readingOf(s, d); return '◆ ' + DEDUCTIONS[d].title + (hasReadings(d) ? (r ? '' : ' ?') : ''); }
    return EVIDENCE[id].title;
  }

  drawListAndDetail(ctx, name) {
    const s = this.game.state;
    const list = this.listFor(this.tab);
    ctx.fillStyle = UI.rule; ctx.fillRect(122, 34, 0.6, 128);
    if (!list.length) {
      font(ctx, 5.4, { italic: true });
      const empty = { STATEMENTS: 'No one has told me anything worth writing down.', DEDUCTIONS: 'Nothing to work on yet. The questions come with what I find.', PEOPLE: 'No one yet.' }[name] || 'Nothing recorded yet.';
      text(ctx, empty, 18, 44, UI.inkDim);
      return;
    }
    for (let i = this.scroll; i < Math.min(list.length, this.scroll + ROWS); i++) {
      const id = list[i];
      const y = 41 + (i - this.scroll) * 8.6;
      const sel = i === this.sel;
      this.rowRects.push({ x: 14, y: y - 6.4, w: 106, h: 8.6, i });
      const label = this.label(name, id);
      const isQ = id.startsWith('Q:'), isD = id.startsWith('D:'), isS = id.startsWith('S:');
      const current = isQ && id.slice(2) === this.q;
      if (sel) { ctx.fillStyle = 'rgba(127,29,29,0.13)'; ctx.fillRect(14, y - 6, 106, 8); }
      let x = 18;
      if (name === 'DEDUCTIONS' && isS) {
        const m = this.marked.includes(id.slice(2));
        ctx.strokeStyle = UI.inkDim; ctx.lineWidth = 0.5; ctx.strokeRect(20, y - 4.6, 4, 4);
        if (m) { ctx.fillStyle = UI.inkRed; ctx.fillRect(21, y - 3.6, 2, 2); }
        x = 27;
      } else if (name === 'DEDUCTIONS' && isD) x = 21;
      else if (name === 'DEDUCTIONS' && isQ) { font(ctx, 4.6); text(ctx, current ? '▾' : '▸', 16, y, UI.inkRed); x = 21; }
      font(ctx, isQ && name === 'DEDUCTIONS' ? 4.9 : 5.2, { bold: isD || current, italic: isQ && !current && name === 'DEDUCTIONS' });
      let lab = label;
      while (ctx.measureText(lab).width > 118 - x && lab.length > 4) lab = lab.slice(0, -2);
      if (lab !== label) lab = lab.trimEnd() + '…';
      text(ctx, lab, x, y, sel || current ? UI.ink : UI.inkDim);
      if ((name === 'EVIDENCE' || name === 'STATEMENTS') && EVIDENCE[id] && EVIDENCE[id].category !== 'TESTIMONY' && !s.evidence[id].examined) {
        ctx.fillStyle = UI.inkDim; ctx.fillRect(116, y - 2.5, 1.2, 1.2);
      }
    }
    if (list.length > ROWS) { font(ctx, 4.4, { italic: true }); text(ctx, `${this.sel + 1} / ${list.length}`, 118, 162, UI.inkDim, 'right'); }
    const id = list[this.sel];
    const d = new Detail(ctx, 128, 40, 176);
    if (name === 'CASE') return this.detailCase(d, id);
    if (name === 'PEOPLE') return this.detailPerson(d, id);
    if (name === 'DEDUCTIONS') return this.detailDeductions(d, id);
    this.detailRecord(d, id);
  }

  detailRecord(d, id) {
    const s = this.game.state;
    const ev = EVIDENCE[id];
    const rec = s.evidence[id];
    d.title(ev.title);
    d.meta(`${CAT[ev.category]} · ${ev.speaker ? ev.speaker + ', ' : ''}${PLACE_NAMES[ev.location] || ev.location}`);
    d.heading(ev.category === 'TESTIMONY' ? 'SAID' : 'OBSERVED');
    d.para(ev.observed);
    if (ev.detail) {
      d.heading('CLOSER LOOK');
      if (rec.examined) d.para(ev.detail); else d.para('Not yet examined closely.', { italic: true, col: UI.inkDim });
    }
    d.heading(ev.category === 'TESTIMONY' ? 'MY READING' : 'INTERPRETATION');
    d.para(ev.interpretation, { italic: true, col: '#4a3020' });
    const people = (ev.related.people || []).map((p) => PEOPLE_NAMES[p]).filter(Boolean);
    if (people.length && d.y < 158) d.foot('Bears on: ' + people.join(', '));
  }

  detailCase(d, id) {
    const s = this.game.state;
    if (id === 'telegram') {
      d.heading('THE TELEGRAM');
      d.mono(TELEGRAM_TEXT);
      d.para('It is the reason I am here. I have nothing yet but this paper and a name.', { italic: true, col: UI.inkDim });
    } else if (id === 'timeline') {
      d.heading('TIMELINE');
      for (const e of s.timeline.slice(-13)) d.stamp(e.t, e.text);
    } else {
      const q = question(id.slice(2));
      d.heading('THE QUESTION');
      d.title(q.title);
      const k = committed(s, q.case);
      if (k) {
        d.heading(`WHAT I DECIDED, AT ${k.t}`);
        d.para(CONCLUSIONS[k.conclusion].title + '.', { bold: true });
        d.para(CONCLUSIONS[k.conclusion].text, { italic: true, col: '#4a3020' });
        if (s.flags.aftermath_HALE) { d.heading('WHAT CAME OF IT'); d.para(CONCLUSIONS[k.conclusion].outcome.epilogue, { italic: true }); }
      } else {
        const on = conclusionsFor(s, q.id).filter((r) => r.available).length;
        d.para(`${deductionsFor(s, q.id).length} deduction(s) so far. ${on ? `${on} possible account(s) of it on the table.` : 'Not enough yet to account for it.'}`, { italic: true, col: UI.inkDim });
        d.para('E (or C anywhere in the notebook) to review the case and decide.', { italic: true, col: UI.inkDim });
      }
    }
  }

  detailDeductions(d, id) {
    const s = this.game.state;
    const [k, ref] = id.split(':');
    if (k === 'Q') {
      const q = question(ref);
      d.heading(ref === this.q ? 'THE QUESTION I AM WORKING ON' : 'ANOTHER QUESTION');
      d.title(q.title);
      if (ref !== this.q) { d.para('E to work on this question instead. (Q also switches.)', { italic: true, col: UI.inkDim }); return; }
      d.para(`${knownStatements(s, ref).length} statement(s) bear on it; ${deductionsFor(s, ref).length} deduction(s) so far.`, { italic: true, col: UI.inkDim });
      if (q.case) {
        const k2 = committed(s, q.case);
        d.para(k2 ? `Decided: ${CONCLUSIONS[k2.conclusion].title}.` : 'Mark two statements below that bear on each other. When I have read my deductions, C reviews the case.', { italic: true, col: UI.inkDim });
      } else d.para('Nothing here can be decided yet. The question stays open.', { italic: true, col: UI.inkDim });
    } else if (k === 'S') {
      d.heading('STATEMENT');
      d.title(STATEMENTS[ref].label);
      d.para(statementText(s, ref));
      const src = statementSources(s, ref);
      if (src.length) { d.heading('FROM MY NOTES'); for (const e of src) d.bullet(EVIDENCE[e].title); }
    } else if (k === 'D') this.detailDeduction(d, ref);
    if (d.y < 140) {
      if (this.result) { d.heading('COMPARISON'); d.para(this.resultText(), { italic: true, col: this.result.ok ? UI.ink : UI.inkRed }); }
      else if (k === 'S') d.hintLine(this.marked.length ? 'Marked one. Choose a second statement to compare.' : 'E marks it. Mark two that bear on each other.');
    }
  }

  detailDeduction(d, did) {
    const s = this.game.state;
    const dd = DEDUCTIONS[did];
    d.heading('DEDUCTION');
    d.title(dd.title);
    d.para(dd.text, { size: 5 });
    if (dd.readings) {
      d.heading('HOW I READ IT');
      const cur = readingOf(s, did);
      for (const [key, r] of Object.entries(dd.readings)) d.choice(key === cur, r.label, r.text);
      if (!cur) d.hintLine('E to choose a reading. It can be changed until I act on it.');
    }
    const det = detailsOf(s, did);
    if (det.length && d.y < 150) { d.heading('WHAT BEARS ON IT'); for (const e of det) d.bullet(EVIDENCE[e].title); }
  }

  detailPerson(d, id) {
    const s = this.game.state;
    const p = PEOPLE.find((x) => x.id === id);
    const ctx = d.ctx;
    const PX = 128, PY = 37, PW = 38, PH = 38;
    drawPortrait(ctx, p, s, PX, PY, PW, PH);
    font(ctx, 6, { bold: true });
    const nl = wrap(ctx, p.name, 132);
    nl.forEach((ln, i) => text(ctx, ln, PX + PW + 6, PY + 8 + i * 7, UI.ink));
    font(ctx, 4.7, { italic: true });
    text(ctx, p.role, PX + PW + 6, PY + 9 + nl.length * 7, UI.inkDim);
    const v = p.variants.find((vv) => test(vv.if, s));
    font(ctx, 5.1, { italic: true });
    let y = PY + 18 + nl.length * 7;
    for (const ln of wrap(ctx, v.text, 132)) { text(ctx, ln, PX + PW + 6, y, '#4a3020'); y += 6.2; }
    d.y = Math.max(PY + PH + 8, y + 3);
    const notes = (p.notes || []).filter((n) => test(n.if, s));
    if (notes.length) { d.heading('WHAT I KNOW'); for (const n of notes) d.bullet(n.text, 5); }
  }

  // ---------------- mind map ----------------
  drawMindMap(ctx) {
    const s = this.game.state;
    const q = question(this.q);
    ctx.fillStyle = UI.rule; ctx.fillRect(206, 34, 0.6, 128);
    if (!q) { font(ctx, 5.4, { italic: true }); text(ctx, 'Nothing to work on yet.', 18, 44, UI.inkDim); return; }
    font(ctx, 4.6, { bold: true });
    const qw = spaced(ctx, q.short.toUpperCase(), MM.x + 2, 37, UI.inkRed, 0.5);
    font(ctx, 4.4, { italic: true });
    text(ctx, q.title, MM.x + 8 + qw, 37, UI.inkDim);
    const nodes = this.mapNodes();
    if (!nodes.length) {
      font(ctx, 5.2, { italic: true });
      wrap(ctx, 'No deductions yet. On the Deductions page, mark two statements that bear on each other; what I work out is drawn here.', 180).forEach((ln, i) => text(ctx, ln, MM.x + 4, 60 + i * 7, UI.inkDim));
      return;
    }
    this.sel = Math.min(this.sel, nodes.length - 1);
    const selId = nodes[this.sel];
    const ds = deductionsFor(s, this.q);
    const P = (n) => this.nodePos(n);
    const hot = new Set([selId]);
    if (selId.startsWith('D:')) { for (const x of supportOf(s, selId.slice(2))) hot.add('S:' + x); for (const l of DEDUCTIONS[selId.slice(2)].links || []) hot.add('D:' + l); }
    else for (const d of ds) if (supportOf(s, d).includes(selId.slice(2))) hot.add('D:' + d);
    // edges: statement -> deduction (solid), deduction -> deduction (dashed)
    ctx.lineWidth = 0.55;
    for (const d of ds) {
      const a = P('D:' + d);
      for (const x of supportOf(s, d)) {
        const b = P('S:' + x);
        const on = hot.has('D:' + d) && hot.has('S:' + x) && (selId === 'D:' + d || selId === 'S:' + x);
        ctx.strokeStyle = on ? UI.inkRed : 'rgba(90,74,56,0.55)';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (const l of DEDUCTIONS[d].links || []) {
        if (!ds.includes(l)) continue;
        const b = P('D:' + l);
        ctx.setLineDash([1.6, 1.4]);
        ctx.strokeStyle = (selId === 'D:' + d || selId === 'D:' + l) ? UI.inkRed : 'rgba(127,29,29,0.45)';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    // statement nodes
    for (const n of nodes.filter((x) => x.startsWith('S:'))) {
      const p = P(n), id = n.slice(2), sel = n === selId;
      font(ctx, 3.9, { italic: true });
      const lines = wrap(ctx, STATEMENTS[id].label, MM.sw - 4);
      const h = lines.length * 4.6 + 2.6, w = MM.sw;
      this.rowRects.push({ x: p.x - w / 2, y: p.y - h / 2, w, h, i: nodes.indexOf(n) });
      panel(ctx, p.x - w / 2, p.y - h / 2, w, h, sel ? '#efe4c8' : UI.paperDark, sel ? UI.inkRed : hot.has(n) ? '#7a5a3e' : '#a08f6c');
      lines.forEach((ln, i) => text(ctx, ln, p.x, p.y - h / 2 + 4.3 + i * 4.6, UI.ink, 'center'));
    }
    // deduction nodes
    for (const n of nodes.filter((x) => x.startsWith('D:'))) {
      const p = P(n), id = n.slice(2), sel = n === selId, dd = DEDUCTIONS[id];
      font(ctx, 4.2, { bold: true });
      const lines = wrap(ctx, dd.title, MM.dw - 5);
      const r = readingOf(s, id);
      const sub = dd.readings ? (r ? dd.readings[r].label : 'reading?') : 'settled';
      const h = lines.length * 4.9 + 7.4, w = MM.dw;
      this.rowRects.push({ x: p.x - w / 2, y: p.y - h / 2, w, h, i: nodes.indexOf(n) });
      panel(ctx, p.x - w / 2, p.y - h / 2, w, h, sel ? '#f3e9cf' : '#e4d8b9', sel ? UI.inkRed : hot.has(n) ? UI.inkRed : '#5a4a38');
      ctx.fillStyle = UI.inkRed; ctx.fillRect(p.x - w / 2 + 2, p.y - h / 2 + 2, 1.2, 1.2);
      lines.forEach((ln, i) => text(ctx, ln, p.x, p.y - h / 2 + 5 + i * 4.9, UI.ink, 'center'));
      font(ctx, 3.8, { italic: true });
      text(ctx, sub, p.x, p.y + h / 2 - 2, r ? UI.inkRed : UI.inkDim, 'center');
    }
    // detail pane
    const d = new Detail(ctx, 211, 40, 94);
    const [k, id] = selId.split(':');
    if (k === 'D') {
      const dd = DEDUCTIONS[id];
      d.heading('DEDUCTION');
      d.title(dd.title, 5.4);
      if (dd.readings) { const r = readingOf(s, id); d.para(r ? `Read as: ${dd.readings[r].label}. ${dd.readings[r].text}` : 'Not yet read either way. E to choose.', { italic: true, size: 4.6, col: r ? UI.ink : UI.inkDim }); }
      d.heading('SUPPORTED BY');
      for (const x of supportOf(s, id)) d.bullet(STATEMENTS[x].label, 4.6);
      const links = (dd.links || []).filter((l) => ds.includes(l));
      if (links.length) { d.heading('CONNECTS TO'); for (const l of links) d.bullet(DEDUCTIONS[l].title, 4.6); }
      const det = detailsOf(s, id);
      if (det.length && d.y < 150) { d.heading('WHAT BEARS ON IT'); for (const e of det) d.bullet(EVIDENCE[e].title, 4.6); }
    } else {
      d.heading('STATEMENT');
      d.title(STATEMENTS[id].label, 5.4);
      d.para(statementText(s, id), { size: 4.7 });
      const src = statementSources(s, id);
      if (src.length) {
        d.heading('THE EVIDENCE');
        for (const e of src) { d.bullet(EVIDENCE[e].title, 4.6); if (d.y < 140) d.para(EVIDENCE[e].category === 'TESTIMONY' ? EVIDENCE[e].observed : (s.evidence[e].examined && EVIDENCE[e].detail) || EVIDENCE[e].observed, { italic: true, size: 4.2, col: UI.inkDim }); }
      }
    }
    if (this.result && d.y < 152) d.para(this.resultText(), { italic: true, size: 4.4, col: this.result.ok ? UI.ink : UI.inkRed });
  }
}

// A small text-layout cursor for the detail panes. In touch mode the text stops above the button bar and names
// the on-screen buttons instead of keys.
class Detail {
  static touch = false;
  static maxY = 164;
  constructor(ctx, x, y, w) { this.ctx = ctx; this.x = x; this.y = y; this.w = w; }
  heading(str) { font(this.ctx, 4.5, { bold: true }); spaced(this.ctx, str, this.x, this.y, UI.inkRed, 0.6); this.y += 6.5; }
  title(str, size = 6) { font(this.ctx, size, { bold: true }); for (const ln of wrap(this.ctx, str, this.w)) { text(this.ctx, ln, this.x, this.y, UI.ink); this.y += size + 1; } this.y += 1.5; }
  meta(str) { font(this.ctx, 4.6, { italic: true }); text(this.ctx, str, this.x, this.y, UI.inkDim); this.y += 8; }
  para(str, opt = {}) {
    const size = opt.size || 5.3;
    font(this.ctx, size, opt);
    if (Detail.touch) str = touchify(str);
    for (const ln of wrap(this.ctx, str, this.w)) { if (this.y > Detail.maxY) return; text(this.ctx, ln, this.x, this.y, opt.col || UI.ink); this.y += size * 1.22; }
    this.y += 3;
  }
  bullet(str, size = 4.9) {
    font(this.ctx, size);
    const lines = wrap(this.ctx, str, this.w - 5);
    this.ctx.fillStyle = UI.inkRed; this.ctx.fillRect(this.x + 0.5, this.y - size * 0.45, 1.3, 1.3);
    for (const ln of lines) { if (this.y > Detail.maxY) return; text(this.ctx, ln, this.x + 4, this.y, UI.ink); this.y += size * 1.2; }
    this.y += 1;
  }
  choice(on, label, str) {
    const c = this.ctx;
    c.strokeStyle = on ? UI.inkRed : UI.inkDim; c.lineWidth = 0.5;
    c.beginPath(); c.arc(this.x + 2, this.y - 1.8, 1.8, 0, Math.PI * 2); c.stroke();
    if (on) { c.fillStyle = UI.inkRed; c.beginPath(); c.arc(this.x + 2, this.y - 1.8, 0.9, 0, Math.PI * 2); c.fill(); }
    font(c, 5, { bold: on });
    text(c, label, this.x + 6, this.y, on ? UI.inkRed : UI.inkDim);
    this.y += 5.8;
    font(c, 4.7, { italic: true });
    for (const ln of wrap(c, str, this.w - 6)) { text(c, ln, this.x + 6, this.y, on ? UI.ink : UI.inkDim); this.y += 5.6; }
    this.y += 1.5;
  }
  hintLine(str) { font(this.ctx, 4.7, { italic: true }); for (const ln of wrap(this.ctx, str, this.w)) { text(this.ctx, ln, this.x, Math.max(this.y, 0), UI.inkDim); this.y += 5.8; } }
  mono(lines) {
    font(this.ctx, 4.9, { family: "'Courier New', Courier, monospace" });
    for (const l of lines) for (const ln of wrap(this.ctx, l, this.w)) { text(this.ctx, ln, this.x, this.y, UI.ink); this.y += 6.2; }
    this.y += 3;
  }
  stamp(t, str) {
    font(this.ctx, 5.1, { bold: true }); text(this.ctx, t, this.x, this.y, UI.inkRed);
    font(this.ctx, 5.2);
    const lines = wrap(this.ctx, str, this.w - 22);
    lines.forEach((ln, i) => text(this.ctx, ln, this.x + 22, this.y + i * 6.3, UI.ink));
    this.y += lines.length * 6.3 + 2.5;
  }
  foot(str) { font(this.ctx, 4.5, { italic: true }); text(this.ctx, str, this.x, Math.min(this.y + 1, 162), UI.inkDim); }
}

// A portrait cut from the character's own sprite, enlarged with hard pixels, in a plain card frame. Until Silas has seen
// the face (portrait.if), or for someone he has never seen, the frame stays empty but for a pencilled outline.
export function drawPortrait(ctx, p, s, x, y, w, h) {
  const spec = p.portrait || {};
  panel(ctx, x - 1, y - 1, w + 2, h + 2, '#3b2f22', null);
  ctx.fillStyle = '#c9bb98'; ctx.fillRect(x, y, w, h);
  const seen = spec.sprite && test(spec.if, s);
  if (seen) {
    const spr = getSprite(spec.sprite);
    const img = spr && spr.frames && spr.frames[0];
    if (img) {
      const [cx, cy, cw, ch] = spec.crop;
      const k = Math.min(w / cw, h / ch);
      const dw = cw * k, dh = ch * k;
      const smooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = '#4e3826'; ctx.fillRect(x, y, w, h); // a dark studio ground, so the coat and hat read
      if (spec.flipV) { ctx.translate(x + (w - dw) / 2, y + (h - dh) / 2 + dh); ctx.scale(1, -1); ctx.drawImage(img, cx, cy, cw, ch, 0, 0, dw, dh); }
      else ctx.drawImage(img, cx, cy, cw, ch, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      ctx.restore();
      ctx.imageSmoothingEnabled = smooth;
      return true;
    }
  }
  // empty frame: a pencilled head-and-shoulders outline
  ctx.strokeStyle = 'rgba(90,74,56,0.55)'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.4, w * 0.16, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w * 0.2, y + h); ctx.quadraticCurveTo(x + w / 2, y + h * 0.5, x + w * 0.8, y + h); ctx.stroke();
  font(ctx, 3.9, { italic: true });
  const msg = spec.none || 'Not yet seen.';
  wrap(ctx, msg, w - 4).forEach((ln, i) => text(ctx, ln, x + w / 2, y + h - 7 + i * 4.4 - (wrap(ctx, msg, w - 4).length - 1) * 4.4, UI.inkDim, 'center'));
  return false;
}
