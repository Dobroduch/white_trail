// Silas's notebook: a detective's journal, not a database. It works on ONE question at a time (Q turns to the next),
// so a page never holds more than that question needs. Pages:
//   CASE        where things stand: one line of story, the one thing Silas is after now, this chapter's open leads,
//               and the questions he can decide.
//   CLUES       the clues bearing on the current question, one short line each. A clue says which open question it
//               raises, and can be opened to read the notes behind it (what was seen, the closer look, his reading).
//   DEDUCTIONS  the deduction board for the current question (ui/deductionBoard.js): the clues pinned to the page,
//               what they raise and settle, and the accounts the readings add up to. Silas links clues himself,
//               reads each deduction one way or the other, and can commit to an account from the board. C still
//               opens the formal review.
//   PEOPLE      a portrait, a line, and what Silas has learned about each person, contradictions included.
//   MAP         opens the hand-drawn map (it keeps its own panel and button).
// Data: data/caseData.js (clues, threads, readings), data/evidence.js (the notes), data/notebookData.js.
import { UI, font, text, panel, wrap, spaced, UI_CX, UI_LEFT, UI_RIGHT, UI_TOP, UI_BOTTOM } from './text.js';
import { EVIDENCE, PLACE_NAMES } from '../data/evidence.js';
import { LEADS, PEOPLE, TELEGRAM_TEXT, CASE_SUMMARY } from '../data/notebookData.js';
import { STATEMENTS, DEDUCTIONS, CONCLUSIONS } from '../data/caseData.js';
import { test, timeString } from '../systems/storyState.js';
import {
  questions, question, knownStatements, statementText, clueRecords, clueUnexamined, filedUnder, deductionsFor,
  threadsFor, threadClues, conclusionsFor, committed, unread, markRead,
} from '../systems/caseSystem.js';
import { objectiveFor, chapterOf } from '../systems/hints.js';
import { getSprite } from '../engine/assets.js';
import { CaseReview } from './caseReview.js';
import { touchify } from './touchText.js';
import { DeductionBoard, NOT_AN_ANSWER } from './deductionBoard.js';
export { NOT_AN_ANSWER };

export const TABS = ['CASE', 'CLUES', 'DEDUCTIONS', 'PEOPLE', 'MAP'];
const KEY_TABS = 4; // Left / Right cycle the first four; MAP is opened by tapping its tab (or M)
const ROWS = 14;
const CAT = { PHYSICAL: 'Physical trace', DOCUMENT: 'Document', PERSONAL: 'Personal object', ENVIRONMENT: 'Environment', TESTIMONY: 'Said to me' };
// Where the left-hand list ends and the right-hand page begins, per page (UI units).
const SPLIT = { CASE: 122, CLUES: 122, PEOPLE: 122 };
// The questions in working order: the ones Silas can decide now, newest (this chapter's) first; then the ones still
// open that cannot be decided yet; the decided ones last.
export function orderedQuestions(s) {
  const qs = questions(s);
  const rank = (q) => (q.case && committed(s, q.case) ? 2 : isCase(s, q) ? 0 : 1);
  return qs.slice().sort((a, b) => rank(a) - rank(b) || qs.indexOf(b) - qs.indexOf(a));
}
// A question that can be settled now (Room 4 becomes one only on the third day: `caseIf`).
const isCase = (s, q) => !!(q && q.case && test(q.caseIf, s));

export class Notebook {
  constructor(game) {
    this.game = game; this.tab = 0; this.sel = 0; this.scroll = 0; this.result = null; this.q = null;
    this.inspect = null; // { sid, i }: reading the notes behind one clue
    this.fresh = null; // { id, t }: a deduction just formed (inked in)
    this.board = new DeductionBoard(this);
  }
  get pick() { return this.board.held; } // (older tests and tools ask whether something is in hand)
  canDecide(q) { return isCase(this.s, q); }
  orderedCount() { const qs = orderedQuestions(this.s); return { n: qs.length, i: Math.max(0, qs.findIndex((q) => q.id === this.q)) }; }

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
    this.sel = 0; this.scroll = 0; this.result = null; this.inspect = null; this.board.reset();
    this.pickQuestion();
    this.fixSel(1);
    if (TABS[this.tab] === 'DEDUCTIONS') this.boardStart();
    this.game.audio.sfx('page');
  }

  // The current question: keep the player's choice while it is available; otherwise the first open case, or the
  // question with something new on it.
  pickQuestion() {
    const s = this.s;
    const qs = orderedQuestions(s);
    const u = unread(s);
    // something new: open on the question it belongs to (a fresh deduction or thread first, then a new clue)
    const fresh = u.find((k) => k.startsWith('T_') || DEDUCTIONS[k]);
    if (fresh) { const did = fresh.replace(/^T_/, ''); if (DEDUCTIONS[did]) { this.q = DEDUCTIONS[did].q; return; } }
    const clue = u.find((k) => STATEMENTS[k] && filedUnder(s, k));
    if (clue) { this.q = filedUnder(s, clue); return; }
    if (this.q && qs.some((q) => q.id === this.q)) return;
    this.q = (qs[0] || {}).id || null;
  }
  cycleQuestion() {
    const qs = orderedQuestions(this.s);
    if (qs.length < 2) return;
    const i = qs.findIndex((q) => q.id === this.q);
    this.q = qs[(i + 1) % qs.length].id;
    this.sel = 0; this.scroll = 0; this.result = null; this.board.reset();
    this.fixSel(1);
    if (TABS[this.tab] === 'DEDUCTIONS') this.boardStart();
    this.game.audio.sfx('page');
  }
  // On the board, start on what is new (an open question or a fresh deduction), else the first open question, else
  // the first clue.
  boardStart() {
    const ids = this.board.ids(), u = new Set(unread(this.s));
    const isNew = (id) => { const [k, x] = id.split(':'); return (k === 'T' && u.has('T_' + x)) || (k === 'D' && u.has(x)); };
    let i = ids.findIndex(isNew);
    if (i < 0) i = ids.findIndex((id) => id.startsWith('T:'));
    if (i < 0) i = ids.findIndex((id) => id.startsWith('S:'));
    this.sel = Math.max(0, i);
  }

  people() { return PEOPLE.filter((p) => test(p.if, this.s)).map((p) => p.id); }
  // This chapter's open leads, the most recently raised first (an earlier chapter's only while this one has none).
  openQuestions(max = 3) {
    const s = this.s;
    const all = LEADS.map((l) => ({ id: l.id, chapter: l.chapter || 1, v: l.variants.find((v) => test(v.if, s)) })).filter((l) => l.v);
    const ch = chapterOf(s);
    const now = all.filter((l) => l.chapter === ch);
    const pool = now.length ? now : all.filter((l) => l.chapter === Math.max(...all.map((x) => x.chapter)));
    return pool.reverse().slice(0, max).map((l) => l.v.text);
  }

  // ---------------- rows ----------------
  // Clues: the current question's, under one header naming it (tap the header, or Q, for the next question).
  clueRows() {
    const s = this.s;
    if (!this.q) return [];
    const ids = knownStatements(s, this.q).filter((id) => filedUnder(s, id) === this.q);
    return ['H:' + this.q, ...ids.map((id) => 'S:' + id)];
  }
  caseRows() {
    const s = this.s;
    return ['overview', ...orderedQuestions(s).filter((q) => isCase(s, q)).map((q) => 'Q:' + q.id), 'telegram', 'timeline'];
  }

  listFor(tab) {
    switch (TABS[tab]) {
      case 'CASE': return this.caseRows();
      case 'CLUES': return this.clueRows();
      case 'DEDUCTIONS': return this.board.ids();
      case 'PEOPLE': return this.people();
      default: return [];
    }
  }
  selectable(id) { return typeof id === 'string' && !id.startsWith('H:'); }
  fixSel(dir) {
    if (TABS[this.tab] === 'DEDUCTIONS') return;
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
      if (this.board.held && name === 'DEDUCTIONS') { this.board.putDown(); return null; }
      this.game.audio.sfx('page');
      return 'close';
    }
    const tabTo = (t) => {
      if (TABS[t] === 'MAP') { this.game.openPanel('map'); return; }
      this.tab = t; this.sel = 0; this.scroll = 0; this.result = null; this.inspect = null; this.board.reset();
      this.fixSel(1); if (TABS[t] === 'DEDUCTIONS') this.boardStart(); this.game.audio.sfx('page');
    };
    const tap = this.tapAt(input);
    if (tap && tap.tab != null) { if (tap.tab !== this.tab || this.inspect) tabTo(tap.tab); return null; }
    if (this.inspect) return this.updateInspect(input, tap);
    if (name === 'DEDUCTIONS') {
      if (tap && tap.btn === 'question') { this.cycleQuestion(); return null; }
      if (input.pressed('question') && !this.board.held) { this.cycleQuestion(); return null; }
      if (input.pressed('caseReview')) { this.board.putDown(); this.openReview(this.q); return null; }
      const r = this.board.update(input, tap);
      if (r === 'tabLeft') tabTo((this.tab + KEY_TABS - 1) % KEY_TABS);
      if (r === 'tabRight') tabTo((Math.min(this.tab, KEY_TABS - 1) + 1) % KEY_TABS);
      return null;
    }
    if (input.pressed('left')) { tabTo((this.tab + KEY_TABS - 1) % KEY_TABS); return null; }
    if (input.pressed('right')) { tabTo((Math.min(this.tab, KEY_TABS - 1) + 1) % KEY_TABS); return null; }
    if (input.pressed('question') && name === 'CLUES') this.cycleQuestion();
    if (input.pressed('caseReview')) { this.openReview(this.q); return null; }
    const list = this.listFor(this.tab);
    // mouse / touch: tap a line to select it, tap it again to use it (like E); tap the question's header for the next
    if (tap && tap.i != null && tap.i < list.length) {
      if (!this.selectable(list[tap.i])) { if (/^H:Q_/.test(list[tap.i])) this.cycleQuestion(); return null; }
      if (tap.i !== this.sel) {
        this.sel = tap.i; this.game.audio.sfx('tick');
        // tapping the first / last visible line scrolls the list on by one, so a finger can page through it
        if (tap.i >= this.scroll + ROWS - 1 && tap.i < list.length - 1) this.scroll++; else if (tap.i <= this.scroll && this.scroll > 0) this.scroll--;
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
      if (this.qRect && TABS[this.tab] === 'DEDUCTIONS' && !this.inspect && inR(u, this.qRect)) { hit = { btn: 'question' }; return false; }
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
  }

  openReview(qid) {
    const q = question(qid);
    if (!q) return;
    if (!isCase(this.s, q)) { this.result = { ok: false, text: 'There is nothing here to decide yet. This question stays open.' }; this.game.audio.sfx('refuse'); return; }
    this.game.pushOverlay(new CaseReview(this.game, qid));
    this.game.audio.sfx('page');
  }

  // The boxes text must stay inside (UI units): the page, and on the two-column pages each column. Used by the
  // layout audit (tools/harness.js auditText).
  textBox() {
    const page = { name: 'the notebook page', x: 8, y: 6, w: 304, h: 168 };
    const name = TABS[this.tab];
    if (name === 'DEDUCTIONS' && !this.inspect) return [page, { name: 'the board', x: 12, y: 29, w: 296, h: 136 }];
    if (this.inspect || !SPLIT[name]) return [page];
    const sp = SPLIT[name];
    return [page, { name: 'the list column', x: 12, y: 33, w: sp - 12, h: 132 }, { name: 'the right-hand page', x: sp + 1, y: 33, w: 307 - sp, h: 132 }];
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
    this.tabRects = []; this.rowRects = []; this.btnRects = []; this.qRect = null;
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
    else if (name === 'DEDUCTIONS') this.board.draw(ctx);
    else this.drawListAndDetail(ctx, name);
    if (!this.game.touchUI()) { // touch: the button bar sits here
      font(ctx, 4.3, { italic: true });
      const many = questions(s).length > 1 ? '    Q  next question' : '';
      const foot = this.inspect ? 'Left / Right  turn the page    E / Esc  back to the clues'
        : name === 'DEDUCTIONS' && this.board.held ? 'Arrows  choose    E  put them together    Esc  put it down'
          : {
            CASE: 'Up / Down  choose    E  open    Left / Right  pages    N  close',
            CLUES: `Up / Down  choose    E  read my notes${many}    Left / Right  pages`,
            DEDUCTIONS: `Arrows  move    E  pick up · link · read · decide${many}    C  review`,
            PEOPLE: 'Up / Down  choose    Left / Right  pages    N  close',
          }[name] || '';
      text(ctx, foot, UI_CX, 170, UI.inkDim, 'center');
    }
  }

  label(name, id) {
    const s = this.s;
    if (name === 'CASE') {
      if (id.startsWith('Q:')) { const q = question(id.slice(2)); return (committed(s, q.case) ? '✓ ' : 'Decide: ') + q.short; }
      return { overview: 'Where things stand', telegram: 'The telegram', timeline: 'What has happened' }[id];
    }
    if (name === 'PEOPLE') return PEOPLE.find((p) => p.id === id).name;
    if (id === 'H:open') return 'STILL OPEN';
    if (id === 'H:known') return 'ESTABLISHED';
    if (id.startsWith('H:')) return question(id.slice(2)).short.toUpperCase();
    if (id.startsWith('S:') || id.startsWith('P:')) return STATEMENTS[id.slice(2)].label;
    if (id.startsWith('T:')) return DEDUCTIONS[id.slice(2)].ask;
    if (id.startsWith('D:')) return DEDUCTIONS[id.slice(2)].title;
    return id;
  }

  // The left-hand list and the right-hand page, for every page but a clue's notes.
  drawListAndDetail(ctx, name) {
    const s = this.s;
    const list = this.listFor(this.tab);
    const split = SPLIT[name] || 122;
    const lw = split - 16; // the list's row width
    ctx.fillStyle = UI.rule; ctx.fillRect(split, 34, 0.6, 128);
    const real = list.filter((x) => this.selectable(x));
    if (!real.length) {
      if (list[0] && list[0].startsWith('H:Q_')) this.drawQuestionHeader(ctx, list[0], 41, lw);
      font(ctx, 5.2, { italic: true });
      const empty = { CLUES: 'Nothing yet that bears on it.', PEOPLE: 'No one yet.', DEDUCTIONS: 'Nothing raises a question here yet. What I find will.' }[name] || 'Nothing recorded yet.';
      wrap(ctx, empty, lw).forEach((ln, i) => text(ctx, ln, 18, 54 + i * 6.5, UI.inkDim));
      return;
    }
    const u = new Set(unread(s));
    for (let i = this.scroll; i < Math.min(list.length, this.scroll + ROWS); i++) {
      const id = list[i];
      const y = 41 + (i - this.scroll) * 8.6;
      const sel = i === this.sel;
      if (id.startsWith('H:Q_')) { this.rowRects.push({ x: 14, y: y - 6.4, w: lw, h: 8.6, i }); this.drawQuestionHeader(ctx, id, y, lw); continue; }
      if (id.startsWith('H:')) { font(ctx, 4.2, { bold: true }); spaced(ctx, this.label(name, id), 16, y + 0.5, UI.inkDim, 0.5); continue; }
      this.rowRects.push({ x: 14, y: y - 6.4, w: lw, h: 8.6, i });
      if (sel) { ctx.fillStyle = 'rgba(127,29,29,0.13)'; ctx.fillRect(14, y - 6, lw, 8); }
      const [k, rid] = id.includes(':') ? id.split(':') : [null, id];
      const x = name === 'CASE' || name === 'PEOPLE' ? 18 : 22;
      font(ctx, 5.1, { bold: (k === 'Q' || k === 'T') && sel, italic: k === 'T' });
      const label = this.label(name, id);
      let lab = label;
      while (ctx.measureText(lab).width > lw - (x - 14) - 4 && lab.length > 4) lab = lab.slice(0, -2);
      if (lab !== label) lab = lab.trimEnd() + '…';
      text(ctx, lab, x, y, sel ? UI.ink : k === 'D' ? UI.inkDim : UI.ink);
      // the mark before a row: new (red dot), an open question (?), an established fact (a ruled tick)
      if (k === 'T') { font(ctx, 5, { bold: true }); text(ctx, '?', 17, y, UI.inkRed); }
      if (k === 'D') { font(ctx, 4.6); text(ctx, '✓', 16.5, y, UI.inkDim); }
      const isNew = (k === 'S' && u.has(rid)) || (k === 'T' && u.has('T_' + rid)) || (k === 'D' && u.has(rid));
      if (isNew && k !== 'T') { ctx.fillStyle = UI.inkRed; ctx.fillRect(18, y - 3, 1.6, 1.6); }
      if (isNew && k === 'T') { ctx.fillStyle = UI.inkRed; ctx.fillRect(split - 4, y - 3, 1.6, 1.6); }
      if (k === 'S' && clueUnexamined(s, rid)) { font(ctx, 4.4); text(ctx, '…', split - 4, y, UI.inkDim, 'right'); }
      if (this.fresh && this.fresh.id === rid) { const f = Math.min(1, this.fresh.t / 0.9); ctx.fillStyle = UI.inkRed; ctx.fillRect(x, y + 1.2, (lw - (x - 14) - 6) * f, 0.5); } // the pen stroke
    }
    if (list.length > ROWS) { font(ctx, 4.4, { italic: true }); text(ctx, this.scroll + ROWS < list.length ? '▼ more' : '', split - 4, 162, UI.inkDim, 'right'); }
    const id = list[this.sel];
    const d = new Detail(ctx, split + 6, 40, 304 - split - 6);
    if (name === 'CASE') return this.detailCase(d, id);
    if (name === 'PEOPLE') return this.detailPerson(d, id);
    if (name === 'CLUES') return id && id.startsWith('S:') ? this.detailClue(d, id.slice(2)) : null;
  }
  // The current question at the head of the Clues and Deductions lists: its short name, and (with more than one) the
  // way to turn to the next.
  drawQuestionHeader(ctx, id, y, lw) {
    const q = question(id.slice(2));
    const n = questions(this.s).length;
    font(ctx, 4.6, { bold: true });
    const w = spaced(ctx, q.short.toUpperCase(), 16, y + 0.5, UI.inkRed, 0.5);
    if (n > 1) {
      const i = orderedQuestions(this.s).findIndex((x) => x.id === q.id);
      font(ctx, 4.2, { italic: true });
      text(ctx, `${i + 1} of ${n}  ▸`, 14 + lw, y + 0.5, UI.inkDim, 'right');
    }
    void w;
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
        const open = threadsFor(s, q.id).filter((x) => !s.deductions.includes(x)).length;
        const formed = deductionsFor(s, q.id).length;
        const on = conclusionsFor(s, q.id).filter((r) => r.available).length;
        d.para(`${formed} established, ${open} still open.`, { italic: true, col: UI.inkDim });
        d.para(on ? 'Enough to decide, if I am ready to. E: decide.' : 'Not enough yet to account for it.', { italic: true, col: on ? UI.ink : UI.inkDim });
      }
    }
  }

  // A clue: what it is, and where it leads (the open question it raises, or what it has helped establish).
  detailClue(d, sid) {
    const s = this.s;
    markRead(s, sid);
    d.title(STATEMENTS[sid].label);
    d.para(statementText(s, sid));
    const ts = threadsFor(s, this.q).filter((x) => threadClues(s, x).includes(sid));
    const raises = ts.filter((x) => !s.deductions.includes(x)), shows = ts.filter((x) => s.deductions.includes(x));
    if (raises.length) { d.heading('IT RAISES'); for (const x of raises.slice(0, 2)) d.bullet(DEDUCTIONS[x].ask, 4.8); }
    else if (shows.length) { d.heading('IT HELPED ESTABLISH'); for (const x of shows.slice(0, 2)) d.bullet(DEDUCTIONS[x].title, 4.8); }
    if (clueUnexamined(s, sid) && d.y < 150) d.hintLine('There is something there I have not looked at closely.');
    const recs = clueRecords(s, sid);
    if (recs.length && d.y < 156) d.hintLine(this.game.touchUI() ? 'Tap it again to read my notes.' : 'E: read my notes on it.');
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
