// Case-solving rules over the story state (no UI). Data: src/data/caseData.js.
//   state.deductions  formed deduction ids, in the order they were formed
//   state.readings    deduction id -> chosen reading key (only for deductions with readings)
//   state.cases       case id -> { conclusion, readings, t } once the player has committed
import { QUESTIONS, STATEMENTS, DEDUCTIONS, CONCLUSIONS, OPEN_OUTCOMES } from '../data/caseData.js';
import { EVIDENCE } from '../data/evidence.js';
import { test, apply, timeString, newState } from './storyState.js';

export function ensureCaseState(s) {
  if (!s.readings || typeof s.readings !== 'object') s.readings = {};
  if (!s.cases || typeof s.cases !== 'object') s.cases = {};
  if (!Array.isArray(s.deductions)) s.deductions = [];
  if (!s.notebookRead || typeof s.notebookRead !== 'object') s.notebookRead = {};
  return s;
}

// ---------------- what is new in the notebook ----------------
// state.notebookRead: 'S_x' (a clue) / 'T_D_x' (an open thread) / 'D_x' (a formed deduction) -> true once seen there.
export function notebookKeys(s) {
  const out = [];
  for (const q of questions(s)) {
    for (const id of knownStatements(s, q.id)) if (!out.includes(id)) out.push(id);
    for (const did of threadsFor(s, q.id)) out.push(s.deductions.includes(did) ? did : 'T_' + did);
  }
  return out;
}
export function unread(s) { ensureCaseState(s); return notebookKeys(s).filter((k) => !s.notebookRead[k]); }
export function markRead(s, key) { ensureCaseState(s); s.notebookRead[key] = true; }
export function markAllRead(s) { ensureCaseState(s); for (const k of notebookKeys(s)) s.notebookRead[k] = true; }

// ---------------- questions & statements ----------------
export function questions(s) { return QUESTIONS.filter((q) => test(q.if, s)); }
export function question(id) { return QUESTIONS.find((q) => q.id === id) || null; }

// The questions a statement (clue) belongs to: its own, plus any it is carried over to (`qs`).
export function qsOf(id) { const st = STATEMENTS[id]; return (st && (st.qs || [st.q])) || []; }
// The question a clue is filed under on the Clues page: the first of its questions that is open to the player.
export function filedUnder(s, id) { const shown = questions(s).map((q) => q.id); return qsOf(id).find((q) => shown.includes(q)) || null; }

export function statementKnown(s, id) {
  const st = STATEMENTS[id];
  if (!st) return false;
  if (st.if) return test(st.if, s);
  return (st.sources || []).some((e) => s.evidence[e]);
}
export function statementText(s, id) {
  const st = STATEMENTS[id];
  if (st.variants) { const v = st.variants.find((x) => test(x.if, s)); return v ? v.text : st.variants[0].text; }
  return st.text;
}
// The journal records behind a statement that Silas has actually recorded.
export function statementSources(s, id) { return (STATEMENTS[id].sources || []).filter((e) => s.evidence[e]); }
// Everything filed under a clue that Silas has recorded: its sources, then the related records (`also`).
export function clueRecords(s, id) {
  const st = STATEMENTS[id];
  return [...(st.sources || []), ...(st.also || [])].filter((e, i, a) => s.evidence[e] && EVIDENCE[e] && a.indexOf(e) === i);
}
// A clue has more to show: one of its physical records has a closer look not yet taken.
export function clueUnexamined(s, id) {
  return clueRecords(s, id).some((e) => EVIDENCE[e].detail && EVIDENCE[e].category !== 'TESTIMONY' && !s.evidence[e].examined);
}
export function knownStatements(s, qid) {
  return Object.keys(STATEMENTS).filter((id) => (!qid || qsOf(id).includes(qid)) && statementKnown(s, id));
}

// ---------------- threads (the Deductions board) ----------------
// A deduction is first an open question (`ask`) that one of its clues raises. It appears on the board as soon as any
// clue of its pairs is known, and is answered by connecting a clue: the connection holds when the chosen clue and
// some other known clue make one of its authored pairs. Only the current question's threads are ever shown.
// `raisedBy` (optional) names the clues that raise the question; by default any clue of its pairs does.
export function raisersOf(did) { const d = DEDUCTIONS[did]; return d.raisedBy || [...new Set(d.pairs.flat())]; }
export function threadOpen(s, did) {
  const d = DEDUCTIONS[did];
  return !!d && raisersOf(did).some((x) => statementKnown(s, x));
}
export function threadsFor(s, qid) {
  return Object.keys(DEDUCTIONS).filter((did) => DEDUCTIONS[did].q === qid && (s.deductions.includes(did) || threadOpen(s, did)));
}
// The known clues of a thread, the one that raised it first (an open thread shows only that one).
export function threadClues(s, did) {
  const out = raisersOf(did).filter((x) => statementKnown(s, x));
  for (const p of DEDUCTIONS[did].pairs) for (const x of p) if (statementKnown(s, x) && !out.includes(x)) out.push(x);
  return out;
}
// Can the thread be answered with what is known (two clues of one pair)? Used by hints and the board's cue.
export function threadAnswerable(s, did) { return DEDUCTIONS[did].pairs.some((p) => p.every((x) => statementKnown(s, x))); }
// Answer a thread with a clue. Returns { ok:false } | { ok:true, id, fresh }.
export function connect(s, did, sid) {
  const d = DEDUCTIONS[did];
  if (!d || !statementKnown(s, sid)) return { ok: false };
  if (s.deductions.includes(did)) return { ok: true, id: did, fresh: false };
  const hit = d.pairs.some((p) => p.includes(sid) && p.every((x) => statementKnown(s, x)));
  if (!hit) return { ok: false };
  s.deductions.push(did);
  return { ok: true, id: did, fresh: true };
}

// ---------------- deductions ----------------
export function deductionsFor(s, qid) { return s.deductions.filter((d) => DEDUCTIONS[d] && (!qid || DEDUCTIONS[d].q === qid)); }
export function hasReadings(did) { return !!(DEDUCTIONS[did] && DEDUCTIONS[did].readings); }

// Compare two statements. Returns { ok:false } | { ok:true, id, fresh }.
export function tryPair(s, a, b) {
  for (const [did, d] of Object.entries(DEDUCTIONS)) {
    if (!d.pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) continue;
    if (!statementKnown(s, a) || !statementKnown(s, b)) return { ok: false };
    if (s.deductions.includes(did)) return { ok: true, id: did, fresh: false };
    s.deductions.push(did);
    return { ok: true, id: did, fresh: true };
  }
  return { ok: false };
}

// The supporting statements of a formed deduction: every known statement in one of its pairs.
export function supportOf(s, did) {
  const out = [];
  for (const p of DEDUCTIONS[did].pairs) if (p.every((x) => statementKnown(s, x))) for (const x of p) if (!out.includes(x)) out.push(x);
  return out;
}
// Recorded journal entries that bear on the deduction's readings (never ranked or marked).
export function detailsOf(s, did) { return (DEDUCTIONS[did].details || []).filter((e) => s.evidence[e] && EVIDENCE[e]); }

export function caseOfQuestion(qid) { const q = question(qid); return q && q.case; }
export function committed(s, caseId) { return (s.cases && s.cases[caseId]) || null; }
function lockedDeduction(s, did) { const c = caseOfQuestion(DEDUCTIONS[did].q); return !!(c && committed(s, c)); }

// Readings: null until the player picks one. Cycling goes unset -> first -> second -> first ...
// A reading with an `if` is not offered until the evidence that suggests it has been found (the interpretation
// "comes to mind"); a reading already chosen stays available whatever happens.
export function readingOf(s, did) { return (s.readings && s.readings[did]) || null; }
export function readingUnlocked(s, did, key) {
  const r = DEDUCTIONS[did] && DEDUCTIONS[did].readings && DEDUCTIONS[did].readings[key];
  return !!r && (!r.if || test(r.if, s) || readingOf(s, did) === key);
}
export function readingsOffered(s, did) {
  const d = DEDUCTIONS[did];
  return d && d.readings ? Object.keys(d.readings).filter((k) => readingUnlocked(s, did, k)) : [];
}
export function setReading(s, did, key) {
  const d = DEDUCTIONS[did];
  if (!d || !d.readings || !s.deductions.includes(did) || lockedDeduction(s, did)) return false;
  if (key != null && (!d.readings[key] || !readingUnlocked(s, did, key))) return false;
  ensureCaseState(s);
  if (key == null) delete s.readings[did]; else s.readings[did] = key;
  return true;
}
export function cycleReading(s, did, dir = 1) {
  const d = DEDUCTIONS[did];
  if (!d || !d.readings) return false;
  const keys = readingsOffered(s, did);
  if (!keys.length) return false;
  const cur = readingOf(s, did);
  const i = cur ? keys.indexOf(cur) : dir > 0 ? -1 : keys.length;
  return setReading(s, did, keys[(i + dir + keys.length) % keys.length]);
}

// ---------------- conclusions ----------------
// Every conclusion of the question, with: available (all its deductions formed), supported (the chosen readings match),
// and per-requirement rows for the review screen. Unavailable ones are not shown to the player by name.
export function conclusionsFor(s, qid) {
  return Object.entries(CONCLUSIONS).filter(([, c]) => c.q === qid).map(([id, c]) => {
    const rows = Object.entries(c.requires).map(([did, key]) => ({ did, key, formed: s.deductions.includes(did), chosen: readingOf(s, did), match: readingOf(s, did) === key }));
    // on the table only once every deduction it rests on is formed and every reading it needs has come to mind
    const available = rows.every((r) => r.formed && readingUnlocked(s, r.did, r.key));
    return { id, c, rows, available, supported: available && rows.every((r) => r.match) };
  });
}
export function canCommit(s, cid) {
  const c = CONCLUSIONS[cid];
  if (!c) return false;
  const caseId = caseOfQuestion(c.q);
  if (!caseId || committed(s, caseId)) return false;
  const row = conclusionsFor(s, c.q).find((r) => r.id === cid);
  return !!(row && row.supported);
}
// Commit to a conclusion. Records the readings it rests on; consequences play out in the aftermath.
export function commit(s, cid) {
  if (!canCommit(s, cid)) return false;
  const c = CONCLUSIONS[cid];
  const caseId = caseOfQuestion(c.q);
  ensureCaseState(s);
  const readings = {};
  for (const did of deductionsFor(s, c.q)) if (readingOf(s, did)) readings[did] = readingOf(s, did);
  s.cases[caseId] = { conclusion: cid, readings, t: timeString(s.time) };
  apply([{ log: `Settled what I believe happened: ${c.title.toLowerCase()}.` }], s);
  return true;
}
// What follows from the case as it stands (committed conclusion, or left open).
export function outcomeOf(s, caseId) {
  const k = committed(s, caseId);
  return k ? CONCLUSIONS[k.conclusion].outcome : OPEN_OUTCOMES[caseId];
}
// Can the case be decided at all yet (any conclusion on the table)?
export function caseOpenForDecision(s, caseId) {
  const q = QUESTIONS.find((x) => x.case === caseId);
  return !!(q && test(q.if, s) && !committed(s, caseId) && conclusionsFor(s, q.id).some((r) => r.available));
}

// ---------------- saves ----------------
// Saves written before the case system: add the new fields, drop deduction ids that no longer exist, and apply what a
// recorded closer look teaches (onExamine) so an old save that had examined the furrow knows about the wheel pit.
// `legacy`: the save predates the redesigned notebook (it has no notebookRead of its own).
export function migrateCaseState(s, { legacy = false } = {}) {
  ensureCaseState(s);
  // people added in a later chapter (Rusk, Vale, Ada Bell) join an older save with their starting state
  const fresh = newState();
  if (!s.chars) s.chars = {};
  for (const [c, v] of Object.entries(fresh.chars)) if (!s.chars[c]) s.chars[c] = { ...v };
  if (s.time && s.time.day == null) s.time.day = 1;
  s.deductions = s.deductions.filter((d, i, a) => DEDUCTIONS[d] && a.indexOf(d) === i);
  for (const did of Object.keys(s.readings)) if (!s.deductions.includes(did) || !hasReadings(did)) delete s.readings[did];
  for (const [id, rec] of Object.entries(s.evidence || {})) {
    const ev = EVIDENCE[id];
    if (ev && ev.onExamine && rec && rec.examined) apply(ev.onExamine.filter((e) => e.set), s);
  }
  // saves from before the redesigned notebook: everything already in it counts as read (no wall of "new" marks)
  if (legacy) markAllRead(s);
  return s;
}
