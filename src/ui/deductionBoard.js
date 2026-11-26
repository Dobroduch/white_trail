// The deduction board: the notebook's Deductions page for one question, laid out as a page Silas has pinned his
// clues to, in the manner of a detective's evidence board.
//
//   top row      the accounts the readings could add up to (the case's conclusions, once they are on the table).
//                Each shows one mark per reading it rests on, filled while Silas reads it that way; an account whose
//                marks are all filled can be committed to from here (E / a second tap), with confirmation.
//   middle row   what the clues raise and settle: an open question ("?", dashed) or an established deduction, with
//                its reading under it (E / a second tap reads it the other way).
//   clue rows    every clue bearing on the question.
//   note strip   what the selected card says, or what the last attempt came to.
//
// Linking is the player's own: pick up a clue (E, or tap / press it) and put it to another clue, or to an open
// question (E on it, or tap it, or drag one onto the other). Two clues that settle something make a deduction; any
// other pair is refused without a hint and costs nothing. Strings join each deduction to the clues it rests on.
// The board never says which account is true; that only shows in what follows.
//
// Keys: arrows move between cards (Left / Right past the end of a row turn the notebook page); E picks up, links,
// reads or commits; Esc puts a held clue down. Data and rules: data/caseData.js, systems/caseSystem.js.
import { UI, font, text, wrap, spaced } from './text.js';
import { STATEMENTS, DEDUCTIONS, CONCLUSIONS } from '../data/caseData.js';
import {
  question, knownStatements, statementText, threadsFor, threadClues, threadAnswerable, connect, supportOf, readingOf,
  cycleReading, hasReadings, readingsOffered, conclusionsFor, committed, caseOfQuestion, markRead, unread, statementKnown,
} from '../systems/caseSystem.js';
import { Confirm } from './menus.js';
import { touchify } from './touchText.js';

export const NOT_AN_ANSWER = 'That does not answer it.';
export const NO_LINK = 'Those two do not connect. Not that I can see.';
const CARD = '#e9dfc4', CARD_DED = '#efe6cd', CARD_OPEN = '#ddd1b3', STRING = 'rgba(127,29,29,', SHADOW = 'rgba(40,28,16,0.28)';

export class DeductionBoard {
  constructor(nb) {
    this.nb = nb;
    this.held = null; // the card id picked up ('S:x' or 'T:did'), waiting to be put to another
    this.hover = -1;
    this.press = null; // { id, wasHeld }: the card a pointer went down on, this gesture
    this.cards = []; // laid out by layout(): { id, x, y, w, h, row, col }
  }
  get game() { return this.nb.game; }
  get s() { return this.game.state; }
  get q() { return this.nb.q; }

  reset() { this.held = null; this.press = null; this.nb.result = null; }

  // ---------------- what is on the board ----------------
  accounts() { return this.q ? conclusionsFor(this.s, this.q).filter((r) => r.available) : []; }
  hasAccounts() { return !!this.q && Object.values(CONCLUSIONS).some((c) => c.q === this.q); }
  ids() {
    const s = this.s;
    if (!this.q) return [];
    const acc = this.accounts().map((r) => 'A:' + r.id);
    const ded = threadsFor(s, this.q).map((d) => (s.deductions.includes(d) ? 'D:' : 'T:') + d);
    const clues = knownStatements(s, this.q).map((x) => 'S:' + x);
    return [...acc, ...ded, ...clues];
  }

  // Card rectangles (UI units). Rows: accounts, deductions, then the clues in rows of up to six.
  layout() {
    const touch = this.game.touchUI();
    const bottom = touch ? 150 : 163;
    const ids = this.ids();
    const acc = ids.filter((i) => i.startsWith('A:')), ded = ids.filter((i) => /^[TD]:/.test(i)), clues = ids.filter((i) => i.startsWith('S:'));
    const cards = [];
    const row = (list, y, h, maxW, r) => {
      if (!list.length) return;
      const gap = 4, w = Math.min(maxW, (292 - (list.length - 1) * gap) / list.length);
      const x0 = 160 - (list.length * w + (list.length - 1) * gap) / 2;
      list.forEach((id, c) => cards.push({ id, x: x0 + c * (w + gap), y, w, h, row: r, col: c }));
    };
    row(acc, 37, 14, 96, 0);
    row(ded, 56, 24, 70, 1);
    const per = clues.length <= 6 ? clues.length : Math.ceil(clues.length / Math.ceil(clues.length / 6));
    const nRows = per ? Math.ceil(clues.length / per) : 0;
    const noteY = bottom - 14, top = touch ? 88 : 92, room = noteY - 8 - top;
    const h = nRows ? Math.min(22, (room - (nRows - 1) * 4) / nRows) : 0;
    for (let r = 0; r < nRows; r++) row(clues.slice(r * per, (r + 1) * per), top + r * (h + 4), h, 60, 2 + r);
    this.cards = cards;
    this.noteY = noteY;
    return cards;
  }
  card(id) { return this.cards.find((c) => c.id === id) || null; }

  // ---------------- input ----------------
  // Called by the notebook with the tap it found (a card index), after its own keys. Returns 'tabLeft' / 'tabRight'
  // when Left / Right run off the end of a row.
  update(input, tap) {
    const nb = this.nb;
    this.layout();
    const ids = this.cards.map((c) => c.id);
    if (!ids.length) return null;
    nb.sel = Math.max(0, Math.min(nb.sel, ids.length - 1));
    // the pointer: hover, a press on a card, and the release that ends a drag
    const disp = this.game.display;
    const at = (pt) => { const u = pt && disp.clientToUI(pt.x, pt.y); return u ? this.cards.findIndex((c) => u.x >= c.x && u.x <= c.x + c.w && u.y >= c.y && u.y <= c.y + c.h) : -1; };
    this.hover = input.pointer ? at(input.pointer) : -1;
    this.dragAt = input.drag && this.press ? disp.clientToUI(input.drag.x, input.drag.y) : null;
    if (tap && tap.i != null && tap.i < ids.length) this.pressCard(ids[tap.i], tap.i);
    for (const r of input.releases || []) this.release(at(r) >= 0 ? ids[at(r)] : null);
    // keys
    const cur = this.cards[nb.sel];
    const h = (input.pressed('right') ? 1 : 0) - (input.pressed('left') ? 1 : 0);
    if (h) {
      const sameRow = this.cards.filter((c) => c.row === cur.row);
      const next = sameRow.find((c) => c.col === cur.col + h);
      if (!next) return h > 0 ? 'tabRight' : 'tabLeft';
      this.select(this.cards.indexOf(next));
    }
    const v = (input.pressed('down') ? 1 : 0) - (input.pressed('up') ? 1 : 0);
    if (v) {
      const rows = [...new Set(this.cards.map((c) => c.row))].sort((a, b) => a - b);
      const r = rows[rows.indexOf(cur.row) + v];
      if (r != null) {
        const mid = cur.x + cur.w / 2;
        const best = this.cards.filter((c) => c.row === r).sort((a, b) => Math.abs(a.x + a.w / 2 - mid) - Math.abs(b.x + b.w / 2 - mid))[0];
        this.select(this.cards.indexOf(best));
      }
    }
    if (input.pressed('interact')) this.use(this.cards[nb.sel].id, false);
    return null;
  }

  select(i) {
    if (i === this.nb.sel) return;
    this.nb.sel = i; this.nb.result = null;
    this.game.audio.sfx('tick');
  }

  // A pointer went down on a card: a first touch selects it (and picks up a clue or a question at once); a second
  // touch uses it, as E does.
  pressCard(id, i) {
    const wasSel = this.nb.sel === i, wasHeld = this.held === id;
    this.press = { id, wasHeld };
    if (this.held && this.held !== id) { this.nb.sel = i; return this.use(id, true); }
    if (/^[ST]:/.test(id)) {
      if (!this.held) { this.nb.sel = i; this.nb.result = null; this.pickUp(id); }
      return;
    }
    if (!wasSel) { this.select(i); return; }
    this.use(id, true);
  }
  // The pointer came up: over another card after a drag, link; on the held card, without having moved off it, put
  // it down (a tap on a held clue lets go of it).
  release(id) {
    const p = this.press;
    this.press = null;
    if (!p || !this.held) return;
    if (id && id !== this.held && p.id === this.held) { this.nb.sel = this.cards.findIndex((c) => c.id === id); this.use(id, true); return; }
    if (id === this.held && p.wasHeld) this.putDown();
  }

  pickUp(id) {
    this.held = id;
    this.nb.result = null;
    this.game.audio.sfx('page');
  }
  putDown() { if (this.held) { this.held = null; this.game.audio.sfx('page'); } }

  // E (or a second tap) on a card.
  use(id, byPointer) {
    const [k, rest] = id.split(':');
    if (this.held) {
      if (this.held === id) { if (!byPointer) this.putDown(); return; }
      return this.link(this.held, id);
    }
    if (k === 'S' || k === 'T') return this.pickUp(id);
    if (k === 'D') return this.flip(rest);
    if (k === 'A') return this.decide(rest);
  }

  // Put one card to another. Clue to clue: the deduction they settle, if any. Clue to open question (either way
  // round): the question answered, if the clue does. Anything else is refused, at no cost.
  link(a, b) {
    const s = this.s;
    const [ka, ia] = a.split(':'), [kb, ib] = b.split(':');
    let r = { ok: false }, msg = NO_LINK;
    if (ka === 'S' && kb === 'S') {
      const did = Object.keys(DEDUCTIONS).find((d) => DEDUCTIONS[d].q === this.q && DEDUCTIONS[d].pairs.some((p) => p.includes(ia) && p.includes(ib) && ia !== ib));
      if (did && statementKnown(s, ia) && statementKnown(s, ib)) {
        if (s.deductions.includes(did)) r = { ok: true, id: did, fresh: false };
        else { s.deductions.push(did); r = { ok: true, id: did, fresh: true }; }
      }
    } else if ((ka === 'T' && kb === 'S') || (ka === 'S' && kb === 'T')) {
      r = connect(s, ka === 'T' ? ia : ib, ka === 'S' ? ia : ib);
      msg = NOT_AN_ANSWER;
    } else if (ka === 'T' && kb === 'T') msg = 'Two questions do not make an answer.';
    else if (kb === 'D' || kb === 'A') msg = 'That is already settled. I put clues to clues, or to what is still open.';
    if (!r.ok) {
      this.nb.result = { ok: false, text: msg };
      this.game.audio.sfx('refuse');
      return false; // the clue stays in hand, to try against another
    }
    this.held = null;
    const did = r.id, d = DEDUCTIONS[did];
    markRead(s, 'T_' + did);
    this.nb.sel = Math.max(0, this.layout().findIndex((c) => c.id === 'D:' + did));
    if (!r.fresh) { this.nb.result = { ok: true, text: `Already established: ${d.title.toLowerCase()}.` }; return true; }
    const n = readingsOffered(s, did).length;
    this.nb.result = { ok: true, text: `${d.title}.${hasReadings(did) ? (n > 1 ? ' It can be read more than one way; E on it to choose.' : ' E on it to say how I read it.') : ''}`, id: did };
    this.nb.fresh = { id: did, t: 0 };
    this.game.audio.sfx('pen');
    this.game.checkpoint();
    return true;
  }

  flip(did) {
    const s = this.s, nb = this.nb;
    if (!hasReadings(did)) { nb.result = { ok: true, text: 'That much is settled; there is only one way to read it.' }; return; }
    const caseId = caseOfQuestion(DEDUCTIONS[did].q);
    if (caseId && committed(s, caseId)) { nb.result = { ok: false, text: 'I have already acted on my reading of this.' }; this.game.audio.sfx('refuse'); return; }
    const offered = readingsOffered(s, did);
    if (offered.length === 1 && readingOf(s, did) === offered[0]) { nb.result = { ok: true, text: 'No other way of reading it comes to mind. Not yet.' }; return; }
    if (cycleReading(s, did)) {
      nb.result = { ok: true, text: `I read it as: ${DEDUCTIONS[did].readings[readingOf(s, did)].label.toLowerCase()}.` };
      this.game.audio.sfx('pen');
      this.game.checkpointSoon = true;
    }
  }

  decide(cid) {
    const s = this.s, nb = this.nb;
    const c = CONCLUSIONS[cid];
    const k = committed(s, caseOfQuestion(c.q));
    if (k) { nb.result = { ok: true, text: k.conclusion === cid ? 'This is what I acted on.' : 'I have already settled on another account.' }; return; }
    const q = question(c.q);
    if (q && !this.nb.canDecide(q)) { nb.result = { ok: false, text: 'Not yet. There is more to this before I can settle it.' }; this.game.audio.sfx('refuse'); return; }
    const row = this.accounts().find((r) => r.id === cid);
    if (!row || !row.supported) { nb.result = { ok: false, text: 'My readings do not add up to that. I would have to read the evidence differently.' }; this.game.audio.sfx('refuse'); return; }
    this.game.pushOverlay(new Confirm(this.game, `Commit to "${c.title}"? I will act on it, and it cannot be taken back.`, 'commit:' + cid));
  }

  // ---------------- drawing ----------------
  draw(ctx) {
    const s = this.s, nb = this.nb;
    const cards = this.layout();
    if (!this.q) { font(ctx, 5.2, { italic: true }); text(ctx, 'Nothing raises a question yet. What I find will.', 160, 80, UI.inkDim, 'center'); return; }
    nb.rowRects = cards.map((c, i) => ({ x: c.x, y: c.y, w: c.w, h: c.h, i }));
    const q = question(this.q);
    const sel = cards[nb.sel];
    const u = new Set(unread(s));
    // header: the question, and (with more than one) which of them
    font(ctx, 4.4, { bold: true });
    spaced(ctx, q.short.toUpperCase(), 16, 33.5, UI.inkRed, 0.5);
    const qs = nb.orderedCount();
    if (qs.n > 1) { font(ctx, 4.2, { italic: true }); text(ctx, `${qs.i + 1} of ${qs.n}  ▸`, 304, 33.5, UI.inkDim, 'right'); nb.qRect = { x: 250, y: 28, w: 56, h: 8 }; } else nb.qRect = null;
    if (!cards.some((c) => c.row === 0)) {
      font(ctx, 4.6, { italic: true });
      const msg = this.hasAccounts() ? 'No account of it yet. More must be established first.' : q.title;
      text(ctx, msg, 160, 45, UI.inkDim, 'center');
    }
    if (!cards.some((c) => c.row === 1)) { font(ctx, 4.6, { italic: true }); text(ctx, 'Nothing raised or settled yet.', 160, 68, UI.inkDim, 'center'); }
    // strings first, under the cards
    this.drawStrings(ctx, sel);
    for (let i = 0; i < cards.length; i++) this.drawCard(ctx, cards[i], i === nb.sel, i === this.hover, u);
    // the held clue's string, to the pointer or the selected card
    if (this.held) {
      const h = this.card(this.held);
      const to = this.dragAt || (sel && sel.id !== this.held ? { x: sel.x + sel.w / 2, y: sel.y + 0.6 } : null) || (this.hover >= 0 && cards[this.hover].id !== this.held ? { x: cards[this.hover].x + cards[this.hover].w / 2, y: cards[this.hover].y + 0.6 } : null);
      if (h && to) { const y1 = h.y - 0.4; this.string(ctx, h.x + h.w / 2, y1, to.x, to.y, 0.95, 0.75, false, 1, Math.min(y1, to.y) - 7); }
    }
    this.drawNote(ctx, sel);
  }

  string(ctx, x1, y1, x2, y2, alpha, width, dashed, f = 1, sag = null) {
    ctx.save();
    ctx.strokeStyle = STRING + alpha + ')';
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([1.6, 1.4]);
    const mx = (x1 + x2) / 2, my = sag != null ? sag : (y1 + y2) / 2 + 2.5; // a little slack in the string
    ctx.beginPath(); ctx.moveTo(x1, y1);
    if (f >= 1) ctx.quadraticCurveTo(mx, my, x2, y2);
    else { const t = f, ax = x1 + (mx - x1) * t, ay = y1 + (my - y1) * t, bx = mx + (x2 - mx) * t, by = my + (y2 - my) * t; ctx.quadraticCurveTo(ax, ay, ax + (bx - ax) * t, ay + (by - ay) * t); }
    ctx.stroke();
    ctx.restore();
  }

  drawStrings(ctx, sel) {
    const s = this.s;
    const focus = sel ? sel.id : null;
    for (const c of this.cards) {
      const [k, id] = c.id.split(':');
      if (k === 'D') {
        const f = this.nb.fresh && this.nb.fresh.id === id ? Math.min(1, this.nb.fresh.t / 0.9) : 1;
        for (const x of supportOf(s, id)) {
          const t = this.card('S:' + x);
          if (!t) continue;
          const lit = focus === c.id || focus === t.id;
          this.string(ctx, c.x + c.w / 2, c.y + c.h, t.x + t.w / 2, t.y + 1.5, lit ? 0.9 : 0.5, lit ? 0.75 : 0.5, false, f);
        }
      } else if (k === 'T') {
        const x = threadClues(s, id)[0];
        const t = x && this.card('S:' + x);
        if (t) { const lit = focus === c.id || focus === t.id; this.string(ctx, c.x + c.w / 2, c.y + c.h, t.x + t.w / 2, t.y + 1.5, lit ? 0.7 : 0.35, 0.5, true); }
      } else if (k === 'A' && focus === c.id) {
        // the account's threads down to what it rests on: firm where the reading agrees, dashed where it does not
        const row = this.accounts().find((r) => r.id === id);
        for (const rr of row ? row.rows : []) {
          const t = this.card('D:' + rr.did);
          if (t) this.string(ctx, c.x + c.w / 2, c.y + c.h, t.x + t.w / 2, t.y + 1, rr.match ? 0.9 : 0.35, rr.match ? 0.7 : 0.45, !rr.match);
        }
      }
    }
  }

  drawCard(ctx, c, on, hover, u) {
    const s = this.s;
    const [k, id] = c.id.split(':');
    const held = this.held === c.id;
    const lift = held ? 2 : on ? 1 : 0;
    const x = c.x, y = c.y - lift, w = c.w, h = c.h;
    const fresh = this.nb.fresh && this.nb.fresh.id === id ? Math.min(1, this.nb.fresh.t / 0.9) : 1;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * fresh;
    // shadow, card, edge
    ctx.fillStyle = SHADOW; ctx.fillRect(x + 0.8 + lift * 0.4, y + 0.9 + lift * 0.6, w, h);
    ctx.fillStyle = k === 'T' ? CARD_OPEN : k === 'D' ? CARD_DED : CARD; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = on || held ? UI.inkRed : hover ? UI.inkDim : UI.rule;
    ctx.lineWidth = on || held ? 0.7 : 0.45;
    if (k === 'T') ctx.setLineDash([1.5, 1.2]);
    ctx.strokeRect(x + 0.25, y + 0.25, w - 0.5, h - 0.5);
    ctx.setLineDash([]);
    // the pin
    if (k !== 'A') { ctx.fillStyle = held ? '#b91c1c' : UI.inkRed; ctx.beginPath(); ctx.arc(x + w / 2, y + 1.6, 1, 0, Math.PI * 2); ctx.fill(); }
    const lines = (str, size, opt, maxLines, y0, col, lh = size * 1.12, inner = w - 4) => {
      font(ctx, size, opt);
      let ls = wrap(ctx, str, inner);
      if (ls.length > maxLines) { ls = ls.slice(0, maxLines); let last = ls[maxLines - 1]; while (ctx.measureText(last + '…').width > inner && last.length > 2) last = last.slice(0, -1); ls[maxLines - 1] = last.trimEnd() + '…'; }
      ls.forEach((l, i) => text(ctx, l, x + w / 2, y0 + i * lh, col, 'center'));
      return ls.length;
    };
    if (k === 'S') {
      const n = Math.max(1, Math.min(3, Math.floor((h - 4) / 4.4)));
      const size = 3.9, lh = 4.4;
      font(ctx, size);
      const cnt = Math.min(n, wrap(ctx, STATEMENTS[id].label, w - 4).length);
      lines(STATEMENTS[id].label, size, {}, n, y + h / 2 - ((cnt - 1) * lh) / 2 + 1.6, UI.ink, lh);
      if (u.has(id)) { ctx.fillStyle = UI.inkRed; ctx.fillRect(x + 1.5, y + 1.5, 1.5, 1.5); }
    } else if (k === 'T') {
      font(ctx, 5, { bold: true }); text(ctx, '?', x + 2.5, y + 6.5, UI.inkRed);
      lines(DEDUCTIONS[id].ask, 3.8, { italic: true }, 4, y + 7.5, UI.ink, 4.3, w - 13); // clear of the "?"
      if (u.has('T_' + id)) { ctx.fillStyle = UI.inkRed; ctx.fillRect(x + w - 3, y + 1.5, 1.5, 1.5); }
    } else if (k === 'D') {
      lines(DEDUCTIONS[id].title, 3.9, { bold: true }, 2, y + 7.2, UI.ink, 4.4);
      const d = DEDUCTIONS[id];
      const cur = readingOf(s, id);
      let lab, col = UI.inkDim, it = true;
      if (!d.readings) lab = 'settled';
      else if (cur) { lab = d.readings[cur].label; col = UI.inkRed; it = false; }
      else lab = 'how do I read it?';
      const many = d.readings && readingsOffered(s, id).length > 1 && !committed(s, caseOfQuestion(d.q));
      font(ctx, 3.8, { italic: it, bold: !it });
      while (ctx.measureText((many ? '◂ ' : '') + lab + (many ? ' ▸' : '')).width > w - 3 && lab.length > 3) lab = lab.slice(0, -2).trimEnd() + '…';
      text(ctx, (many ? '◂ ' : '') + lab + (many ? ' ▸' : ''), x + w / 2, y + h - 3.2, col, 'center');
      if (u.has(id)) { ctx.fillStyle = UI.inkRed; ctx.fillRect(x + 1.5, y + 1.5, 1.5, 1.5); }
    } else if (k === 'A') {
      const row = this.accounts().find((r) => r.id === id);
      const mine = (committed(s, caseOfQuestion(CONCLUSIONS[id].q)) || {}).conclusion === id;
      if (row && row.supported) { ctx.strokeStyle = UI.inkRed; ctx.lineWidth = 0.4; ctx.strokeRect(x + 1.1, y + 1.1, w - 2.2, h - 2.2); }
      lines((mine ? '✓ ' : '') + CONCLUSIONS[id].title, 4.1, { bold: true }, 1, y + 6, UI.ink);
      // one mark per reading it rests on: filled while Silas reads it that way
      const rows = row ? row.rows : [];
      const mw = rows.length * 3.6;
      rows.forEach((r, i) => {
        const cx = x + w / 2 - mw / 2 + i * 3.6 + 1.8, cy = y + h - 4;
        ctx.strokeStyle = UI.inkRed; ctx.lineWidth = 0.4;
        ctx.beginPath(); ctx.arc(cx, cy, 1.1, 0, Math.PI * 2); ctx.stroke();
        if (r.match) { ctx.fillStyle = UI.inkRed; ctx.fill(); }
      });
    }
    ctx.restore();
  }

  // The strip under the board: what the selected card says, or what the last attempt came to.
  drawNote(ctx, sel) {
    const s = this.s, nb = this.nb;
    const touch = this.game.touchUI();
    const t = (str) => (touch ? touchify(str) : str);
    const y = this.noteY;
    ctx.fillStyle = UI.rule; ctx.fillRect(14, y - 5.5, 292, 0.5);
    let head = '', body = '', hint = '';
    if (sel) {
      const [k, id] = sel.id.split(':');
      if (k === 'S') {
        markRead(s, id);
        head = STATEMENTS[id].label; body = statementText(s, id);
        hint = this.held === sel.id ? 'In hand. E on another clue, or on an open question, to put them together. Esc to put it down.' : this.held ? 'E: put the two together.' : 'E: pick it up, to put it to another.';
      } else if (k === 'T') {
        markRead(s, 'T_' + id);
        head = DEDUCTIONS[id].ask;
        body = threadAnswerable(s, id) ? 'I may already have what answers it.' : 'Nothing I have found answers it yet. Somewhere out there, something will.';
        hint = this.held && this.held !== sel.id ? 'E: does that answer it?' : this.held ? 'E on the clue that answers it. Esc to put it down.' : 'E: take it up, and find the clue that answers it.';
      } else if (k === 'D') {
        markRead(s, id);
        const d = DEDUCTIONS[id], cur = readingOf(s, id);
        head = d.title + (cur ? `: ${d.readings[cur].label.toLowerCase()}` : '');
        body = cur ? d.readings[cur].text : d.text;
        hint = !d.readings ? '' : readingsOffered(s, id).length > 1 ? 'E: read it the other way.' : readingsOffered(s, id).length < Object.keys(d.readings).length ? 'Another reading may come to mind, if I find more.' : '';
      } else if (k === 'A') {
        const c = CONCLUSIONS[id], row = this.accounts().find((r) => r.id === id);
        head = c.title; body = c.text;
        const k2 = committed(s, caseOfQuestion(c.q));
        hint = k2 ? (k2.conclusion === id ? 'What I acted on.' : '') : row && row.supported ? 'My readings support this. E: commit to it.' : 'Not what my readings say.';
      }
    }
    if (nb.result) { hint = nb.result.text; }
    font(ctx, 4.4, { bold: true });
    let hd = head; while (ctx.measureText(hd).width > 286 && hd.length > 4) hd = hd.slice(0, -2).trimEnd() + '…';
    text(ctx, hd, 16, y, UI.ink);
    font(ctx, 4.1);
    const bl = wrap(ctx, body, 288).slice(0, 2);
    if (wrap(ctx, body, 288).length > 2) { let l = bl[1]; while (ctx.measureText(l + '…').width > 288 && l.length > 2) l = l.slice(0, -1); bl[1] = l.trimEnd() + '…'; }
    // room: two lines of body, and the hint on the last line (the hint wins the second line when it has something to say)
    const lines = hint ? bl.slice(0, 1) : bl;
    lines.forEach((l, i) => text(ctx, l, 16, y + 5 + i * 4.8, '#4a3020'));
    if (hint) {
      font(ctx, 4.1, { italic: true });
      let hl = t(hint); while (ctx.measureText(hl).width > 288 && hl.length > 4) hl = hl.slice(0, -2).trimEnd() + '…';
      text(ctx, hl, 16, y + 9.8, nb.result ? (nb.result.ok ? UI.ink : UI.inkRed) : UI.inkDim);
    }
  }
}

