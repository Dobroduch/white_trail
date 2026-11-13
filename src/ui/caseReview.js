// Case review: the deliberate decision. Left, every deduction of the question with its two readings (Left/Right
// changes the reading). Right, the conclusions those deductions put on the table, each with what it rests on and
// whether Silas's current readings support it. E on a supported conclusion asks for confirmation, then commits.
// It never says which conclusion is true; that only shows in what follows (systems/caseSystem.js, the aftermath).
//
// `prompt` mode is used by the end of the night (SLICE_END): it adds "Leave it open for now".
import { UI, font, text, panel, wrap, spaced, UI_CX, UI_LEFT, UI_RIGHT, UI_TOP, UI_BOTTOM } from './text.js';
import { DEDUCTIONS, CONCLUSIONS } from '../data/caseData.js';
import { question, deductionsFor, readingOf, setReading, hasReadings, conclusionsFor, committed } from '../systems/caseSystem.js';
import { Confirm } from './menus.js';

export class CaseReview {
  constructor(game, qid, { prompt = false } = {}) {
    this.game = game; this.qid = qid; this.prompt = prompt; this.sel = 0; this.t = 0; this.msg = null;
    this.q = question(qid);
    const rows = this.rows();
    const firstConc = rows.findIndex((r) => r.kind === 'c');
    if (committed(game.state, this.q.case) && firstConc >= 0) this.sel = firstConc;
  }
  get locked() { return !!committed(this.game.state, this.q.case); }

  rows() {
    const s = this.game.state;
    const out = [];
    for (const d of deductionsFor(s, this.qid)) if (hasReadings(d)) out.push({ kind: 'd', id: d });
    for (const c of conclusionsFor(s, this.qid)) if (c.available) out.push({ kind: 'c', id: c.id, row: c });
    if (this.prompt && !this.locked) out.push({ kind: 'leave' });
    if (this.prompt && this.locked) out.push({ kind: 'go' });
    return out;
  }

  update(input) {
    this.t += 1 / 60;
    const s = this.game.state;
    const rows = this.rows();
    if (input.pressed('pause') || input.pressed('back') || input.pressed('caseReview')) {
      if (this.prompt && !this.locked) return this.askLeave();
      return 'close';
    }
    if (!rows.length) return null;
    if (input.pressed('up')) { this.sel = (this.sel + rows.length - 1) % rows.length; this.msg = null; this.game.audio.sfx('tick'); }
    if (input.pressed('down')) { this.sel = (this.sel + 1) % rows.length; this.msg = null; this.game.audio.sfx('tick'); }
    this.sel = Math.min(this.sel, rows.length - 1);
    const r = rows[this.sel];
    const dir = (input.pressed('right') ? 1 : 0) - (input.pressed('left') ? 1 : 0);
    if (r.kind === 'd' && (dir || input.pressed('interact'))) {
      if (this.locked) { this.msg = 'I have already acted on what I believe.'; this.game.audio.sfx('refuse'); return null; }
      const keys = Object.keys(DEDUCTIONS[r.id].readings);
      const cur = readingOf(s, r.id);
      const next = cur ? keys[(keys.indexOf(cur) + (dir || 1) + keys.length) % keys.length] : keys[dir < 0 ? 1 : 0];
      if (setReading(s, r.id, next)) { this.game.audio.sfx('pen'); this.game.checkpointSoon = true; }
      return null;
    }
    if (r.kind === 'c' && input.pressed('interact') && this.t > 0.2) {
      if (this.locked) { this.msg = committed(s, this.q.case).conclusion === r.id ? 'This is what I acted on.' : 'I have already settled on another account.'; return null; }
      if (!r.row.supported) { this.msg = 'My readings do not add up to that. I would have to read the evidence differently.'; this.game.audio.sfx('refuse'); return null; }
      this.game.pushOverlay(new Confirm(this.game, `Commit to "${CONCLUSIONS[r.id].title}"? I will act on it, and it cannot be taken back.`, 'commit:' + r.id));
      return null;
    }
    if (r.kind === 'leave' && input.pressed('interact')) return this.askLeave();
    if (r.kind === 'go' && input.pressed('interact')) return 'close';
    return null;
  }
  askLeave() {
    this.game.pushOverlay(new Confirm(this.game, 'Go back up without deciding? Finch will ask what I make of it.', 'leaveCase'));
    return null;
  }
  // called by the game after a confirmed commitment
  onCommitted() {
    this.msg = this.prompt ? 'Then that is what I will tell Finch.' : 'Then that is what I will tell Finch, when I go back up.';
    const rows = this.rows();
    this.sel = Math.max(0, rows.findIndex((r) => r.kind === 'c' && r.id === committed(this.game.state, this.q.case).conclusion));
  }

  draw(ctx) {
    const s = this.game.state;
    ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    panel(ctx, 8, 6, 304, 168, UI.paper, '#3b2f22');
    font(ctx, 4.8, { bold: true });
    spaced(ctx, 'REVIEWING THE CASE', 16, 15, UI.inkRed, 0.8);
    font(ctx, 6.2, { bold: true });
    text(ctx, this.q.title, 16, 24.5, UI.ink);
    const k = committed(s, this.q.case);
    if (k) { font(ctx, 4.6, { italic: true }); text(ctx, `Decided at ${k.t}.`, 304, 15, UI.inkDim, 'right'); }
    ctx.fillStyle = UI.rule; ctx.fillRect(14, 28.5, 292, 0.6); ctx.fillRect(156, 32, 0.6, 128);
    const rows = this.rows();
    const sel = rows[this.sel];
    // ---- readings ----
    font(ctx, 4.5, { bold: true }); spaced(ctx, 'HOW I READ WHAT I HAVE', 16, 37, UI.inkRed, 0.6);
    let y = 45;
    const ds = rows.filter((r) => r.kind === 'd');
    if (!ds.length) { font(ctx, 5, { italic: true }); wrap(ctx, 'No deduction here can be read two ways yet.', 134).forEach((l, i) => text(ctx, l, 18, y + i * 6, UI.inkDim)); }
    for (const r of ds) {
      const d = DEDUCTIONS[r.id];
      const on = sel === r;
      if (on) { ctx.fillStyle = 'rgba(127,29,29,0.12)'; ctx.fillRect(14, y - 6, 140, 16.5); }
      font(ctx, 5.2, { bold: true }); text(ctx, d.title, 18, y, UI.ink);
      const cur = readingOf(s, r.id);
      let x = 22;
      font(ctx, 4.9);
      for (const [key, rd] of Object.entries(d.readings)) {
        const chosen = key === cur;
        font(ctx, 4.9, { bold: chosen, italic: !chosen });
        const w = ctx.measureText(rd.label).width;
        text(ctx, rd.label, x, y + 7.2, chosen ? UI.inkRed : UI.inkDim);
        if (chosen) { ctx.fillStyle = UI.inkRed; ctx.fillRect(x, y + 8.4, w, 0.6); }
        x += w + 9;
      }
      if (!cur) { font(ctx, 4.4, { italic: true }); text(ctx, 'undecided', x, y + 7.2, UI.inkDim); }
      if (on && !this.locked) { font(ctx, 4.4); text(ctx, '◂ ▸', 150, y + 7.2, UI.inkRed, 'right'); }
      y += 18;
    }
    const settled = deductionsFor(s, this.qid).filter((d) => !hasReadings(d));
    if (settled.length && y < 140) {
      font(ctx, 4.5, { bold: true }); spaced(ctx, 'AND WHAT IS SETTLED', 16, y + 1, UI.inkRed, 0.6); y += 8;
      font(ctx, 4.9); for (const d of settled) { text(ctx, '◆ ' + DEDUCTIONS[d].title, 18, y, UI.ink); y += 6.5; }
    }
    // reading text for the selected deduction
    if (sel && sel.kind === 'd' && y < 146) {
      const cur = readingOf(s, sel.id);
      font(ctx, 4.7, { italic: true });
      const str = cur ? DEDUCTIONS[sel.id].readings[cur].text : 'Left / Right to choose how I read it.';
      wrap(ctx, str, 136).slice(0, 3).forEach((l, i) => text(ctx, l, 18, Math.max(y + 2, 140) + i * 5.6, cur ? '#4a3020' : UI.inkDim));
    }
    // ---- conclusions ----
    font(ctx, 4.5, { bold: true }); spaced(ctx, 'WHAT HAPPENED, THEN?', 162, 37, UI.inkRed, 0.6);
    let cy = 45;
    const cs = rows.filter((r) => r.kind === 'c');
    if (!cs.length) { font(ctx, 5, { italic: true }); wrap(ctx, 'I cannot yet put together any account of it. More deductions first.', 138).forEach((l, i) => text(ctx, l, 164, cy + i * 6, UI.inkDim)); }
    for (const r of cs) {
      const on = sel === r;
      const mine = k && k.conclusion === r.id;
      if (on) { ctx.fillStyle = 'rgba(127,29,29,0.12)'; ctx.fillRect(160, cy - 6, 146, 14); }
      font(ctx, 5.3, { bold: true }); text(ctx, (mine ? '✓ ' : '') + CONCLUSIONS[r.id].title, 164, cy, UI.ink);
      font(ctx, 4.5, { italic: true });
      const st = mine ? 'What I acted on.' : r.row.supported ? 'My readings support this.' : 'Not what my readings say.';
      text(ctx, st, 168, cy + 5.8, r.row.supported || mine ? UI.inkRed : UI.inkDim);
      cy += 14.5;
    }
    if (sel && sel.kind === 'c') {
      const c = CONCLUSIONS[sel.id];
      let yy = Math.max(cy + 2, 92);
      font(ctx, 4.8, { italic: true });
      for (const l of wrap(ctx, c.text, 140)) { if (yy > 138) break; text(ctx, l, 164, yy, '#4a3020'); yy += 5.7; }
      yy += 1.5;
      font(ctx, 4.3, { bold: true }); spaced(ctx, 'IT RESTS ON', 164, yy, UI.inkRed, 0.5); yy += 5.8;
      for (const row of sel.row.rows) {
        if (yy > 160) break;
        const d = DEDUCTIONS[row.did];
        font(ctx, 4.5);
        text(ctx, `${row.match ? '✓' : row.chosen ? '✗' : '·'}  ${d.title}: ${d.readings[row.key].label.toLowerCase()}`, 166, yy, row.match ? UI.ink : UI.inkDim);
        yy += 5.4;
      }
    }
    const leave = rows.find((r) => r.kind === 'leave' || r.kind === 'go');
    if (leave) {
      const on = sel === leave;
      font(ctx, 5.2, { bold: on, italic: !on });
      text(ctx, leave.kind === 'go' ? 'Go back up' : 'Leave it open for now', 304, 162, on ? UI.inkRed : UI.inkDim, 'right');
    }
    if (this.msg) { font(ctx, 4.8, { italic: true }); text(ctx, this.msg, 160, 155, UI.inkRed, 'center'); }
    font(ctx, 4.3, { italic: true });
    text(ctx, this.locked ? 'Up/Down review   Esc back' : 'Up/Down choose   Left/Right change a reading   E commit to a supported account   Esc back', UI_CX, 170, UI.inkDim, 'center');
  }
}
