// Silas's notebook: a detective's journal, not a database. Five pages:
//   CASE        the mystery in a few lines, what Silas is after now, a few open questions, what happened lately
//   CLUES       one short entry per meaningful discovery, filed under the question it bears on. A clue can be opened
//               to read the notes behind it (what was seen, the closer look, Silas's reading of it).
//   DEDUCTIONS  a board for one question at a time. A clue raises a question (an open thread, "?"); answer it by
//               choosing the clue that does. An answered thread is an established fact, which can be read more than
//               one way (some readings only come to mind once the evidence for them has been found). C reviews the
//               case: the readings add up to an account of what happened, which Silas may commit to.
//   PEOPLE      a portrait, a line, and what Silas has learned about each person, contradictions included.
//   MAP         opens the hand-drawn map (it keeps its own panel and button).
// Data: data/caseData.js (clues, threads, readings), data/evidence.js (the notes), data/notebookData.js.
import { UI, font, text, panel, wrap, spaced, UI_CX, UI_LEFT, UI_RIGHT, UI_TOP, UI_BOTTOM } from './text.js';
import { EVIDENCE, PLACE_NAMES } from '../data/evidence.js';
import { LEADS, PEOPLE, TELEGRAM_TEXT, CASE_SUMMARY } from '../data/notebookData.js';
import { STATEMENTS, DEDUCTIONS, CONCLUSIONS, STATEMENT_MAP } from '../data/caseData.js';
import { test, timeString } from '../systems/storyState.js';
import {
  questions, question, knownStatements, statementText, clueRecords, clueUnexamined, filedUnder, deductionsFor,
  threadsFor, threadClues, connect, supportOf, readingOf, cycleReading, hasReadings, readingsOffered, readingUnlocked,
  conclusionsFor, committed, caseOfQuestion, unread, markRead,
} from '../systems/caseSystem.js';
import { objectiveFor } from '../systems/hints.js';
import { getSprite } from '../engine/assets.js';
import { CaseReview } from './caseReview.js';
import { touchify } from './touchText.js';

export const TABS = ['CASE', 'CLUES', 'DEDUCTIONS', 'PEOPLE', 'MAP'];
const KEY_TABS = 4; // Left / Right cycle the first four; MAP is opened by tapping its tab (or M)
const ROWS = 14;
const CAT = { PHYSICAL: 'Physical trace', DOCUMENT: 'Document', PERSONAL: 'Personal object', ENVIRONMENT: 'Environment', TESTIMONY: 'Said to me' };
// Deductions board (UI units) and node sizes.
const MM = { x: 14, y: 42, w: 190, h: 120, dw: 52, sw: 40 };
export const NOT_AN_ANSWER = 'That does not answer it.';
// A question that can be settled now (Room 4 becomes one only on the third day: `caseIf`).
const isCase = (s, q) => !!(q && q.case && test(q.caseIf, s));

export class Notebook {
  constructor(game) {
    this.game = game; this.tab = 0; this.sel = 0; this.scroll = 0; this.result = null; this.q = null;
    this.inspect = null; // { sid, i }: reading the notes behind one clue
    this.pick = null; // deduction id: choosing the clue that answers an open thread
    this.fresh = null; // { id, t }: a deduction just formed (inked in)
  }

  tabName() { return TABS[this.tab]; }
  get s() { return this.game.state; }
  resultText() { return this.game.touchUI() ? touchify(this.result.text) : this.result.text; }

  open(tabName) {
    if (tabName) this.tab = TABS.indexOf(tabName);
    if (this.tab === TABS.indexOf('MAP')) this.tab = 0;
    // something new waiting: open on it
    if (!tabName) {
      const u = unread(this.s);
      if (u.some((k) => STATEMENTS[k])) this.tab = 1;
      else if (u.length) this.tab = 2;
    }
    this.sel = 0; this.scroll = 0; this.result = null; this.inspect = null; this.pick = null;
    this.pickQuestion();
    this.fixSel(1);
    this.game.audio.sfx('page');
  }

  // The current question: keep the player's choice while it is available; otherwise the first open case, or the
  // question with something new on it.
  pickQuestion() {
    const s = this.s;
    const qs = questions(s);
    const fresh = unread(s).find((k) => k.startsWith('T_') || DEDUCTIONS[k]);
    if (fresh) { const did = fresh.replace(/^T_/, ''); if (DEDUCTIONS[did]) { this.q = DEDUCTIONS[did].q; return; } }
    if (this.q && qs.some((q) => q.id === this.q)) return;
    const open = qs.find((q) => q.case && !committed(s, q.case));
    this.q = (open || qs[0] || {}).id || null;
  }
  cycleQuestion() {
    const qs = questions(this.s);
    if (qs.length < 2) return;
    const i = qs.findIndex((q) => q.id === this.q);
    this.q = qs[(i + 1) % qs.length].id;
    this.sel = 0; this.scroll = 0; this.result = null; this.pick = null;
    this.game.audio.sfx('page');
  }

  people() { return PEOPLE.filter((p) => test(p.if, this.s)).map((p) => p.id); }
  openQuestions(max = 3) {
    const s = this.s;
    const all = LEADS.map((l) => ({ id: l.id, chapter: l.chapter || 1, v: l.variants.find((v) => test(v.if, s)) })).filter((l) => l.v);
    const ch = s.flags.ch2Started ? 2 : 1;
    // the current chapter's questions first, the most recently raised (last in the list) first
    return all.sort((a, b) => (b.chapter === ch) - (a.chapter === ch) || all.indexOf(b) - all.indexOf(a)).slice(0, max).map((l) => l.v.text);
  }

  // ---------------- rows ----------------
  clueRows() {
    const s = this.s;
    const out = [];
    for (const q of questions(s)) {
      const ids = knownStatements(s, q.id).filter((id) => filedUnder(s, id) === q.id);
      if (!ids.length) continue;
      out.push('H:' + q.id);
      for (const id of ids) out.push('S:' + id);
    }
    return out;
  }
  // Board nodes for the current question, in reading order (top to bottom, left to right).
  boardNodes() {
    const s = this.s;
    if (!this.q) return [];
    const ts = threadsFor(s, this.q);
    const nodes = [];
    for (const d of ts) {
      const formed = s.deductions.includes(d);
      nodes.push((formed ? 'D:' : 'T:') + d);
      const cl = formed ? supportOf(s, d) : threadClues(s, d).slice(0, 1); // an open thread shows only the clue that raised it
      for (const x of cl) if (!nodes.includes('S:' + x)) nodes.push('S:' + x);
    }
    const pos = (n) => this.nodePos(n);
    return nodes.sort((a, b) => (pos(a).y - pos(b).y) || (pos(a).x - pos(b).x));
  }
  nodePos(n) {
    const [k, id] = n.split(':');
    let m;
    if (k === 'S') { const sm = STATEMENT_MAP[id] || { x: 0.5, y: 0.5 }; m = sm[this.q] || sm; } else m = DEDUCTIONS[id].map;
    const half = k === 'S' ? MM.sw / 2 : MM.dw / 2;
    return { x: MM.x + half + m.x * (MM.w - half * 2), y: MM.y + 7 + m.y * (MM.h - 16) };
  }
  pickRows() {
    const s = this.s;
    const shown = threadClues(s, this.pick).slice(0, 1);
    return knownStatements(s, this.q).filter((x) => !shown.includes(x)).map((x) => 'P:' + x);
  }
  caseRows() { return ['overview', 'telegram', ...questions(this.s).filter((q) => isCase(this.s, q)).map((q) => 'Q:' + q.id), 'timeline']; }

  listFor(tab) {
    switch (TABS[tab]) {
      case 'CASE': return this.caseRows();
      case 'CLUES': return this.clueRows();
      case 'DEDUCTIONS': return this.pick ? this.pickRows() : this.boardNodes();
      case 'PEOPLE': return this.people();
      default: return [];
    }
  }
  selectable(id) { return typeof id === 'string' && !id.startsWith('H:'); }
  fixSel(dir) {
    const list = this.listFor(this.tab);
    if (!list.length) { this.sel = 0; return; }
    this.sel = Math.max(0, Math.min(this.sel, list.length - 1));
    for (let k = 0; k < list.length && !this.selectable(list[this.sel]); k++) this.sel = (this.sel + dir + list.length) % list.length;
  }

  // ---------------- input ----------------
  update(input) {
    if (this.fresh) { this.fresh.t += 1 / 60; if (this.fresh.t > 2) this.fresh = null; }
    const name = TABS[this.tab];
    if (input.pressed('notebook')) { this.game.audio.sfx('page'); return 'close'; }
    if (input.pressed('pause') || input.pressed('back')) {
      if (this.inspect) { this.inspect = null; this.game.audio.sfx('page'); return null; }
      if (this.pick) { this.pick = null; this.sel = Math.max(0, this.boardNodes().indexOf("T:" + this.pickFrom)); this.game.audio.sfx("page"); return null; }
      this.game.audio.sfx('page');
      return 'close';
    }
    const tabTo = (t) => {
      if (TABS[t] === 'MAP') { this.game.openPanel('map'); return; }
      this.tab = t; this.sel = 0; this.scroll = 0; this.result = null; this.inspect = null; this.pick = null;
      this.fixSel(1); this.game.audio.sfx('page');
    };
    const tap = this.tapAt(input);
    if (tap && tap.tab != null) { if (tap.tab !== this.tab || this.inspect || this.pick) tabTo(tap.tab); return null; }
    if (this.inspect) return this.updateInspect(input, tap);
    if (input.pressed('left')) { tabTo((this.tab + KEY_TABS - 1) % KEY_TABS); return null; }
    if (input.pressed('right')) { tabTo((Math.min(this.tab, KEY_TABS - 1) + 1) % KEY_TABS); return null; }
    if (input.pressed('question') && name === 'DEDUCTIONS' && !this.pick) this.cycleQuestion();
    if (input.pressed('caseReview')) { this.openReview(this.q); return null; }
    const list = this.listFor(this.tab);
    // mouse / touch: tap a line (or a board node) to select it, tap it again to use it (like E)
    if (tap && tap.i != null && tap.i < list.length) {
      if (!this.selectable(list[tap.i])) return null;
      if (tap.i !== this.sel) {
        this.sel = tap.i; this.game.audio.sfx('tick');
        // tapping the first / last visible line scrolls the list on by one, so a finger can page through it
        if (!this.isBoard()) { if (tap.i >= this.scroll + ROWS - 1 && tap.i < list.length - 1) this.scroll++; else if (tap.i <= this.scroll && this.scroll > 0) this.scroll--; }
        return null;
      }
      this.act(name, list[this.sel]);
      return null;
    }
    if (list.length) {
      if (input.pressed('up')) { this.sel = (this.sel + list.length - 1) % list.length; this.fixSel(-1); this.game.audio.sfx('tick'); }
      if (input.pressed('down')) { this.sel = (this.sel + 1) % list.length; this.fixSel(1); this.game.audio.sfx('tick'); }
      this.sel = Math.min(this.sel, list.length - 1);
      if (this.sel < this.scroll) this.scroll = this.sel;
      if (this.sel >= this.scroll + ROWS) this.scroll = this.sel - ROWS + 1;
    }
    if (input.pressed('interact') && list.length) this.act(name, list[this.sel]);
    return null;
  }
  isBoard() { return TABS[this.tab] === 'DEDUCTIONS' && !this.pick; }

  updateInspect(input, tap) {
    const n = clueRecords(this.s, this.inspect.sid).length;
    const go = (d) => { const i = Math.max(0, Math.min(n - 1, this.inspect.i + d)); if (i !== this.inspect.i) { this.inspect.i = i; this.game.audio.sfx('page'); } };
    if (tap && tap.btn) {
      if (tap.btn === 'prev') go(-1); else if (tap.btn === 'next') go(1); else this.inspect = null;
      return null;
    }
    if (input.pressed('left') || input.pressed('up')) go(-1);
    if (input.pressed('right') || input.pressed('down')) go(1);
    if (input.pressed('interact')) { this.inspect = null; this.game.audio.sfx('page'); }
    return null;
  }

  // The tab, button or line under this step's click / tap (consumed), from the rects recorded by draw().
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
      const b = (this.btnRects || []).find((r) => inR(u, r));
      if (b) { hit = { btn: b.act }; return false; }
      const row = (this.rowRects || []).find((r) => inR(u, r));
      if (row) { hit = { i: row.i }; return false; }
      return true;
    });
    return hit;
  }

  act(tab, id) {
    if (!this.selectable(id)) return;
    const [k, rest] = id.includes(':') ? id.split(':') : [null, id];
    if (tab === 'CASE') {
      if (k === 'Q') return this.openReview(rest);
      if (id === 'telegram') { this.game.openDocument('TELEGRAM'); return; }
      return;
    }
    if (tab === 'CLUES' && k === 'S') { this.inspect = { sid: rest, i: 0 }; this.game.audio.sfx('page'); return; }
    if (tab === 'DEDUCTIONS') {
      if (k === 'T') { this.pickFrom = rest; this.pick = rest; this.sel = 0; this.result = null; this.game.audio.sfx('page'); return; }
      if (k === 'D') return this.flipReading(rest);
      if (k === 'S') { this.tab = 1; this.inspect = { sid: rest, i: 0 }; this.game.audio.sfx('page'); return; }
      if (k === 'P') return this.tryAnswer(rest);
    }
  }

  tryAnswer(sid) {
    const s = this.s;
    const did = this.pick;
    const r = connect(s, did, sid);
    if (!r.ok) { this.result = { ok: false, text: NOT_AN_ANSWER }; this.game.audio.sfx('refuse'); return; }
    this.pick = null;
    markRead(s, 'T_' + did);
    this.sel = Math.max(0, this.boardNodes().indexOf('D:' + did));
    if (r.fresh) {
      const n = readingsOffered(s, did).length;
      this.result = { ok: true, text: `${DEDUCTIONS[did].title}.${hasReadings(did) ? (n > 1 ? ' It can be read more than one way; E on it to choose.' : ' E on it to say how I read it.') : ''}`, id: did };
      this.fresh = { id: did, t: 0 };
      this.game.audio.sfx('pen');
      this.game.checkpoint();
    }
  }

  openReview(qid) {
    const q = question(qid);
    if (!q) return;
    if (!isCase(this.s, q)) { this.result = { ok: false, text: 'There is nothing here to decide yet. This question stays open.' }; this.game.audio.sfx('refuse'); return; }
    this.game.pushOverlay(new CaseReview(this.game, qid));
    this.game.audio.sfx('page');
  }

  flipReading(did) {
    const s = this.s;
    if (!hasReadings(did)) { this.result = { ok: true, text: 'That much is settled; there is only one way to read it.' }; return; }
    const caseId = caseOfQuestion(DEDUCTIONS[did].q);
    if (caseId && committed(s, caseId)) { this.result = { ok: false, text: 'I have already acted on my reading of this.' }; this.game.audio.sfx('refuse'); return; }
    const offered = readingsOffered(s, did);
    if (offered.length === 1 && readingOf(s, did) === offered[0]) { this.result = { ok: true, text: 'No other way of reading it comes to mind. Not yet.' }; return; }
    if (cycleReading(s, did)) {
      this.result = { ok: true, text: `I read it as: ${DEDUCTIONS[did].readings[readingOf(s, did)].label.toLowerCase()}.` };
      this.game.audio.sfx('pen');
      this.game.checkpointSoon = true;
    }
  }

  // ---------------- drawing ----------------
  draw(ctx) {
    const s = this.s;
    Detail.touch = this.game.touchUI();
    Detail.maxY = Detail.touch ? 150 : 162;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    panel(ctx, 8, 6, 304, 168, UI.paper, '#3b2f22');
    ctx.fillStyle = 'rgba(90,70,40,0.07)';
    for (let y = 30; y < 166; y += 7) ctx.fillRect(14, y, 292, 0.4);
    font(ctx, 5, { italic: true });
    // left-aligned: the panel buttons sit over the top-right corner
    text(ctx, `S. Vance — ${this.game.scene.name.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())}, ${timeString(s.time)}`, 16, 15, UI.inkDim);
    font(ctx, 5.2, { bold: true });
    let tx = 16;
    this.tabRects = []; this.rowRects = []; this.btnRects = [];
    const u = unread(s);
    const dot = { CLUES: u.some((k) => STATEMENTS[k]), DEDUCTIONS: u.some((k) => !STATEMENTS[k]) };
    TABS.forEach((t, i) => {
      const label = t === 'MAP' ? 'MAP ›' : t;
      const w = spaced(ctx, label, tx, 25, i === this.tab ? UI.inkRed : UI.inkDim, 0.5);
      this.tabRects.push({ x: tx - 4, y: 16, w: w + 9, h: 13 });
      if (i === this.tab) { ctx.fillStyle = UI.inkRed; ctx.fillRect(tx, 27, w, 0.7); }
      if (dot[t]) { ctx.fillStyle = UI.inkRed; ctx.fillRect(tx + w + 1.2, 20.5, 1.6, 1.6); }
      tx += w + 11;
    });
    ctx.fillStyle = UI.rule; ctx.fillRect(14, 30, 292, 0.6);
    const name = TABS[this.tab];
    if (this.inspect) this.drawInspect(ctx);
    else if (name === 'DEDUCTIONS') this.drawBoard(ctx);
    else this.drawListAndDetail(ctx, name);
    if (!this.game.touchUI()) { // touch: the button bar sits here
      font(ctx, 4.3, { italic: true });
      const foot = this.inspect ? 'Left / Right  turn the page    E / Esc  back to the clues'
        : this.pick ? 'Up / Down  choose a clue    E  try it    Esc  back to the board'
          : {
            CASE: 'Left / Right  pages    Up / Down  choose    E  open    C  review the case    N  close',
            CLUES: 'Left / Right  pages    Up / Down  choose    E  read my notes on it    N  close',
            DEDUCTIONS: 'Up / Down  choose    E  answer a question · choose a reading    Q  next question    C  review the case',
            PEOPLE: 'Left / Right  pages    Up / Down  choose    N  close',
          }[name] || '';
      text(ctx, foot, UI_CX, 170, UI.inkDim, 'center');
    }
  }

  label(name, id) {
    const s = this.s;
    if (name === 'CASE') {
      if (id.startsWith('Q:')) { const q = question(id.slice(2)); return (committed(s, q.case) ? '✓ ' : '? ') + q.short; }
      return { overview: 'Where things stand', telegram: 'The telegram', timeline: 'What has happened' }[id];
    }
    if (name === 'PEOPLE') return PEOPLE.find((p) => p.id === id).name;
    if (id.startsWith('H:')) return question(id.slice(2)).short.toUpperCase();
    if (id.startsWith('S:')) return STATEMENTS[id.slice(2)].label;
    return id;
  }

  drawListAndDetail(ctx, name) {
    const s = this.s;
    const list = this.listFor(this.tab);
    ctx.fillStyle = UI.rule; ctx.fillRect(122, 34, 0.6, 128);
    if (!list.length) {
      font(ctx, 5.4, { italic: true });
      const empty = { CLUES: 'Nothing yet that means anything.', PEOPLE: 'No one yet.' }[name] || 'Nothing recorded yet.';
      text(ctx, empty, 18, 44, UI.inkDim);
      return;
    }
    const u = new Set(unread(s));
    for (let i = this.scroll; i < Math.min(list.length, this.scroll + ROWS); i++) {
      const id = list[i];
      const y = 41 + (i - this.scroll) * 8.6;
      const sel = i === this.sel;
      if (id.startsWith('H:')) {
        font(ctx, 4.3, { bold: true });
        spaced(ctx, this.label(name, id), 16, y + 0.5, UI.inkRed, 0.5);
        continue;
      }
      this.rowRects.push({ x: 14, y: y - 6.4, w: 106, h: 8.6, i });
      if (sel) { ctx.fillStyle = 'rgba(127,29,29,0.13)'; ctx.fillRect(14, y - 6, 106, 8); }
      const x = name === 'CLUES' ? 21 : 18;
      const isQ = id.startsWith('Q:');
      font(ctx, 5.2, { bold: isQ && sel });
      const label = this.label(name, id);
      let lab = label;
      while (ctx.measureText(lab).width > 112 - x && lab.length > 4) lab = lab.slice(0, -2);
      if (lab !== label) lab = lab.trimEnd() + '…';
      text(ctx, lab, x, y, sel ? UI.ink : UI.inkDim);
      if (name === 'CLUES') {
        const sid = id.slice(2);
        if (u.has(sid)) { ctx.fillStyle = UI.inkRed; ctx.fillRect(17, y - 3, 1.6, 1.6); }
        if (clueUnexamined(s, sid)) { font(ctx, 4.4); text(ctx, '…', 118, y, UI.inkDim, 'right'); }
      }
    }
    if (list.length > ROWS) { font(ctx, 4.4, { italic: true }); text(ctx, this.scroll + ROWS < list.length ? '▼ more' : '', 118, 162, UI.inkDim, 'right'); }
    const id = list[this.sel];
    const d = new Detail(ctx, 128, 40, 176);
    if (name === 'CASE') return this.detailCase(d, id);
    if (name === 'PEOPLE') return this.detailPerson(d, id);
    if (name === 'CLUES') return this.detailClue(d, id.slice(2));
  }

  detailCase(d, id) {
    const s = this.s;
    if (id === 'overview') {
      const sum = CASE_SUMMARY.find((v) => test(v.if, s));
      d.para(sum.text, { italic: true, col: '#4a3020', size: 5.2 });
      d.heading('WHAT I AM AFTER');
      d.para(objectiveFor(s), { bold: true, size: 5.2 });
      const qs = this.openQuestions(3);
      if (qs.length) { d.heading('STILL OPEN'); for (const t of qs) d.bullet(t, 4.9); }
      const last = s.timeline.slice(-2);
      if (last.length && d.y < 140) { d.heading('LATELY'); for (const e of last) { if (d.y > 152) break; d.stamp(e.t, e.text); } }
    } else if (id === 'telegram') {
      d.heading('THE TELEGRAM');
      d.mono(TELEGRAM_TEXT);
      d.para('The reason I am here. E to hold it up to the light again.', { italic: true, col: UI.inkDim });
    } else if (id === 'timeline') {
      d.heading('WHAT HAS HAPPENED');
      for (const e of s.timeline.slice(-12)) { if (d.y > Detail.maxY - 4) break; d.stamp(e.t, e.text); }
    } else {
      const q = question(id.slice(2));
      d.heading('THE QUESTION');
      d.title(q.title);
      const k = committed(s, q.case);
      if (k) {
        d.heading(`WHAT I DECIDED, AT ${k.t}`);
        d.para(CONCLUSIONS[k.conclusion].title + '.', { bold: true });
        d.para(CONCLUSIONS[k.conclusion].text, { italic: true, col: '#4a3020' });
        if (s.flags['aftermath_' + q.case]) { d.heading('WHAT CAME OF IT'); d.para(CONCLUSIONS[k.conclusion].outcome.epilogue, { italic: true }); }
      } else {
        const ts = threadsFor(s, q.id);
        const formed = deductionsFor(s, q.id).length;
        const on = conclusionsFor(s, q.id).filter((r) => r.available).length;
        d.para(`${formed} of ${ts.length} question(s) answered. ${on ? `${on} possible account(s) of it.` : 'Not enough yet to account for it.'}`, { italic: true, col: UI.inkDim });
        d.para('E (or C anywhere in the notebook) to review the case and decide.', { italic: true, col: UI.inkDim });
      }
    }
  }

  detailClue(d, sid) {
    const s = this.s;
    markRead(s, sid);
    const st = STATEMENTS[sid];
    d.heading('CLUE');
    d.title(st.label);
    d.para(statementText(s, sid));
    const recs = clueRecords(s, sid);
    const last = recs.slice().sort((a, b) => s.evidence[b].n - s.evidence[a].n)[0];
    if (last) { d.heading('MY READING'); d.para(EVIDENCE[last].interpretation, { italic: true, col: '#4a3020' }); }
    if (clueUnexamined(s, sid) && d.y < 150) d.hintLine('There is something there I have not looked at closely.');
    if (recs.length && d.y < 156) d.hintLine(`E: read my notes on it (${recs.length}).`);
  }

  drawInspect(ctx) {
    const s = this.s;
    const sid = this.inspect.sid;
    const recs = clueRecords(s, sid);
    if (!recs.length) { this.inspect = null; return; }
    const i = Math.min(this.inspect.i, recs.length - 1);
    const id = recs[i], ev = EVIDENCE[id], rec = s.evidence[id];
    const d = new Detail(ctx, 18, 40, 282);
    font(ctx, 4.5, { bold: true }); spaced(ctx, 'MY NOTES ON  ·  ' + STATEMENTS[sid].label.toUpperCase(), 18, 39, UI.inkRed, 0.5);
    d.y = 48;
    d.title(ev.title, 6);
    d.meta(`${CAT[ev.category]} · ${ev.speaker ? ev.speaker + ', ' : ''}${PLACE_NAMES[ev.location] || ev.location}`);
    d.heading(ev.category === 'TESTIMONY' ? 'SAID' : 'WHAT I SAW');
    d.para(ev.observed);
    if (ev.detail) {
      d.heading('CLOSER LOOK');
      if (rec.examined) d.para(ev.detail); else d.para('Not yet looked at closely.', { italic: true, col: UI.inkDim });
    }
    if (d.y < 150) { d.heading('MY READING'); d.para(ev.interpretation, { italic: true, col: '#4a3020' }); }
    // page controls (tappable)
    const by = Detail.touch ? 152 : 164;
    font(ctx, 4.8, { italic: true });
    const btn = (act, label, x, align) => {
      const w = ctx.measureText(label).width;
      const x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
      text(ctx, label, x, by, UI.inkRed, align);
      this.btnRects.push({ act, x: x0 - 3, y: by - 7, w: w + 6, h: 10 });
    };
    if (i > 0) btn('prev', '◂ previous', 18, 'left');
    btn('back', `back to the clues  (${i + 1} of ${recs.length})`, UI_CX, 'center');
    if (i < recs.length - 1) btn('next', 'next ▸', 302, 'right');
  }

  detailPerson(d, id) {
    const s = this.s;
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
    if (notes.length) { d.heading('WHAT I KNOW'); for (const n of notes.slice(-6)) d.bullet(n.text, 4.9); }
  }

  // ---------------- the deductions board ----------------
  drawBoard(ctx) {
    const s = this.s;
    const q = question(this.q);
    ctx.fillStyle = UI.rule; ctx.fillRect(208, 34, 0.6, 128);
    if (!q) { font(ctx, 5.4, { italic: true }); text(ctx, 'Nothing to work on yet.', 18, 44, UI.inkDim); return; }
    font(ctx, 4.6, { bold: true });
    const qw = spaced(ctx, q.short.toUpperCase(), MM.x + 2, 37.5, UI.inkRed, 0.5);
    font(ctx, 4.4, { italic: true });
    let qt = q.title;
    while (ctx.measureText(qt).width > 184 - qw && qt.length > 6) qt = qt.slice(0, -2);
    text(ctx, qt + (qt !== q.title ? '…' : ''), MM.x + 7 + qw, 37.5, UI.inkDim);
    if (questions(s).length > 1 && !this.game.touchUI()) { font(ctx, 4); text(ctx, 'Q: next question', 304, 37.5, UI.inkDim, 'right'); }
    const nodes = this.boardNodes();
    if (!nodes.length) {
      font(ctx, 5.2, { italic: true });
      wrap(ctx, 'Nothing here raises a question yet. What I find will.', 180).forEach((ln, i) => text(ctx, ln, MM.x + 4, 60 + i * 7, UI.inkDim));
      return;
    }
    const pickingFrom = this.pick ? 'T:' + this.pick : null;
    const selId = this.pick ? pickingFrom : nodes[Math.min(this.sel, nodes.length - 1)];
    const ts = threadsFor(s, this.q);
    const P = (n) => this.nodePos(n);
    const u = new Set(unread(s));
    // edges: clue -> thread (solid when answered, dotted while open), thread -> thread links (dashed, red)
    ctx.lineWidth = 0.55;
    for (const d of ts) {
      const formed = s.deductions.includes(d);
      const a = P((formed ? 'D:' : 'T:') + d);
      const cl = formed ? supportOf(s, d) : threadClues(s, d).slice(0, 1);
      for (const x of cl) {
        const b = P('S:' + x);
        const on = selId === (formed ? 'D:' : 'T:') + d || selId === 'S:' + x;
        ctx.strokeStyle = on ? UI.inkRed : 'rgba(90,74,56,0.55)';
        if (!formed) ctx.setLineDash([0.8, 1.2]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (!formed) continue;
      for (const l of DEDUCTIONS[d].links || []) {
        if (!s.deductions.includes(l)) continue;
        const b = P('D:' + l);
        ctx.setLineDash([1.6, 1.4]);
        ctx.strokeStyle = (selId === 'D:' + d || selId === 'D:' + l) ? UI.inkRed : 'rgba(127,29,29,0.45)';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    // clue nodes
    for (const n of nodes.filter((x) => x.startsWith('S:'))) {
      const p = P(n), id = n.slice(2), sel = n === selId;
      font(ctx, 3.9, { italic: true });
      const lines = wrap(ctx, STATEMENTS[id].label, MM.sw - 4).slice(0, 3);
      const h = lines.length * 4.6 + 2.6, w = MM.sw;
      if (!this.pick) this.rowRects.push({ x: p.x - w / 2, y: p.y - h / 2, w, h, i: nodes.indexOf(n) });
      panel(ctx, p.x - w / 2, p.y - h / 2, w, h, sel ? '#efe4c8' : UI.paperDark, sel ? UI.inkRed : '#a08f6c');
      lines.forEach((ln, i) => text(ctx, ln, p.x, p.y - h / 2 + 4.3 + i * 4.6, UI.ink, 'center'));
    }
    // thread / deduction nodes
    for (const n of nodes.filter((x) => !x.startsWith('S:'))) {
      const p = P(n), id = n.slice(2), sel = n === selId, dd = DEDUCTIONS[id];
      const open = n.startsWith('T:');
      const fresh = this.fresh && this.fresh.id === id ? Math.min(1, this.fresh.t / 0.9) : 1;
      font(ctx, open ? 4 : 4.2, { bold: !open, italic: open });
      const lines = wrap(ctx, open ? dd.ask : dd.title, MM.dw - 6).slice(0, 4);
      const r = readingOf(s, id);
      const sub = open ? '' : dd.readings ? (r ? dd.readings[r].label : 'how to read it?') : 'settled';
      const h = lines.length * 4.7 + (open ? 3.5 : 7.4), w = MM.dw;
      if (!this.pick) this.rowRects.push({ x: p.x - w / 2, y: p.y - h / 2, w, h, i: nodes.indexOf(n) });
      if (open) {
        ctx.fillStyle = sel ? '#f3e9cf' : 'rgba(216,204,176,0.9)'; ctx.fillRect(p.x - w / 2, p.y - h / 2, w, h);
        ctx.strokeStyle = sel ? UI.inkRed : '#7a5a3e'; ctx.lineWidth = 0.5; ctx.setLineDash([1.2, 1]);
        ctx.strokeRect(p.x - w / 2, p.y - h / 2, w, h); ctx.setLineDash([]);
        font(ctx, 5, { bold: true }); text(ctx, '?', p.x - w / 2 + 2.2, p.y - h / 2 + 5, UI.inkRed);
      } else {
        panel(ctx, p.x - w / 2, p.y - h / 2, w, h, sel ? '#f3e9cf' : '#e4d8b9', sel ? UI.inkRed : '#5a4a38');
        ctx.fillStyle = UI.inkRed; ctx.fillRect(p.x - w / 2 + 2, p.y - h / 2 + 2, 1.2, 1.2);
      }
      if (u.has(open ? 'T_' + id : id)) { ctx.fillStyle = UI.inkRed; ctx.fillRect(p.x + w / 2 - 3, p.y - h / 2 + 1.5, 1.6, 1.6); }
      ctx.globalAlpha = fresh;
      font(ctx, open ? 4 : 4.2, { bold: !open, italic: open });
      lines.forEach((ln, i) => text(ctx, ln, p.x + (open ? 1.5 : 0), p.y - h / 2 + 5 + i * 4.7, UI.ink, 'center'));
      if (sub) { font(ctx, 3.8, { italic: true }); text(ctx, sub, p.x, p.y + h / 2 - 2, r ? UI.inkRed : UI.inkDim, 'center'); }
      ctx.globalAlpha = 1;
      if (fresh < 1) { ctx.fillStyle = UI.inkRed; ctx.fillRect(p.x - w / 2 + 3, p.y + h / 2 - 0.9, (w - 6) * fresh, 0.5); } // the pen stroke under it
    }
    // the right-hand page
    const d = new Detail(ctx, 213, 40, 92);
    if (this.pick) return this.drawPicker(ctx, d);
    const [k, id] = selId.split(':');
    if (k === 'T') {
      markRead(s, 'T_' + id);
      d.heading('A QUESTION');
      d.title(DEDUCTIONS[id].ask, 5.4);
      d.heading('IT CAME FROM');
      for (const x of threadClues(s, id).slice(0, 1)) d.bullet(STATEMENTS[x].label, 4.6);
      d.hintLine(this.game.touchUI() ? 'Tap it again to choose the clue that answers it.' : 'E: choose the clue that answers it.');
    } else if (k === 'D') {
      markRead(s, id);
      const dd = DEDUCTIONS[id];
      d.heading('ESTABLISHED');
      d.title(dd.title, 5.2);
      d.para(dd.text, { size: 4.5 });
      if (dd.readings) {
        d.heading('HOW I READ IT');
        const cur = readingOf(s, id);
        for (const key of Object.keys(dd.readings)) if (readingUnlocked(s, id, key)) d.choice(key === cur, dd.readings[key].label, null);
        const locked = Object.keys(dd.readings).length - readingsOffered(s, id).length;
        if (locked && d.y < 150) d.hintLine('Another reading may come to mind, if I find more.');
        if (cur && d.y < 150) d.para(dd.readings[cur].text, { italic: true, size: 4.4, col: '#4a3020' });
      }
      if (dd.limits && d.y < 146) { d.heading('STILL OPEN'); d.para(dd.limits, { italic: true, size: 4.4, col: UI.inkDim }); }
    } else {
      d.heading('CLUE');
      d.title(STATEMENTS[id].label, 5.2);
      d.para(statementText(s, id), { size: 4.6 });
      d.hintLine(this.game.touchUI() ? 'Tap it again to read my notes.' : 'E: read my notes on it.');
    }
    if (this.result && d.y < 152) d.para(this.resultText(), { italic: true, size: 4.5, col: this.result.ok ? UI.ink : UI.inkRed });
  }

  // Choosing the clue that answers an open thread: the question's known clues, listed on the right-hand page.
  drawPicker(ctx, d) {
    const s = this.s;
    const dd = DEDUCTIONS[this.pick];
    d.heading('WHAT ANSWERS IT?');
    d.para(dd.ask, { italic: true, size: 4.6 });
    const rows = this.pickRows();
    this.sel = Math.min(this.sel, Math.max(0, rows.length - 1));
    const top = Math.max(0, Math.min(this.sel - 6, rows.length - 9));
    let y = d.y + 1;
    rows.slice(top, top + 9).forEach((r, k) => {
      const i = top + k, sel = i === this.sel;
      this.rowRects.push({ x: 211, y: y - 6, w: 95, h: 8.2, i });
      if (sel) { ctx.fillStyle = 'rgba(127,29,29,0.13)'; ctx.fillRect(211, y - 5.8, 95, 7.8); }
      font(ctx, 4.7, { bold: sel });
      let lab = STATEMENTS[r.slice(2)].label;
      while (ctx.measureText(lab).width > 90 && lab.length > 4) lab = lab.slice(0, -2) + '…';
      text(ctx, lab, 214, y, sel ? UI.ink : UI.inkDim);
      y += 8.2;
    });
    if (!rows.length) { font(ctx, 4.6, { italic: true }); text(ctx, 'Nothing else I know bears on it.', 214, y, UI.inkDim); y += 7; }
    d.y = y + 2;
    if (this.result && !this.result.ok) d.para(this.resultText(), { italic: true, size: 4.5, col: UI.inkRed });
    void s;
  }
}

// A small text-layout cursor for the detail panes. In touch mode the text stops above the button bar and names
// the on-screen buttons instead of keys.
class Detail {
  static touch = false;
  static maxY = 162;
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
    font(c, 4.8, { bold: on });
    text(c, label, this.x + 6, this.y, on ? UI.inkRed : UI.inkDim);
    this.y += 6;
    if (str) {
      font(c, 4.6, { italic: true });
      for (const ln of wrap(c, str, this.w - 6)) { text(c, ln, this.x + 6, this.y, on ? UI.ink : UI.inkDim); this.y += 5.4; }
      this.y += 1.5;
    }
  }
  hintLine(str) { font(this.ctx, 4.6, { italic: true }); if (Detail.touch) str = touchify(str); for (const ln of wrap(this.ctx, str, this.w)) { if (this.y > Detail.maxY + 4) return; text(this.ctx, ln, this.x, Math.max(this.y, 0), UI.inkDim); this.y += 5.8; } }
  mono(lines) {
    font(this.ctx, 4.9, { family: "'Courier New', Courier, monospace" });
    for (const l of lines) for (const ln of wrap(this.ctx, l, this.w)) { text(this.ctx, ln, this.x, this.y, UI.ink); this.y += 6.2; }
    this.y += 3;
  }
  stamp(t, str) {
    font(this.ctx, 5, { bold: true }); text(this.ctx, t, this.x, this.y, UI.inkRed);
    font(this.ctx, 5);
    const lines = wrap(this.ctx, str, this.w - 22);
    lines.forEach((ln, i) => text(this.ctx, ln, this.x + 22, this.y + i * 6.1, UI.ink));
    this.y += lines.length * 6.1 + 2.5;
  }
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
