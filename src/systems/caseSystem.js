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
  return s;
}

// ---------------- questions & statements ----------------
export function questions(s) { return QUESTIONS.filter((q) => test(q.if, s)); }
export function question(id) { return QUESTIONS.find((q) => q.id === id) || null; }

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
export function knownStatements(s, qid) {
  return Object.keys(STATEMENTS).filter((id) => (!qid || STATEMENTS[id].q === qid) && statementKnown(s, id));
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
export function readingOf(s, did) { return (s.readings && s.readings[did]) || null; }
export function setReading(s, did, key) {
  const d = DEDUCTIONS[did];
  if (!d || !d.readings || !s.deductions.includes(did) || lockedDeduction(s, did)) return false;
  if (key != null && !d.readings[key]) return false;
  ensureCaseState(s);
  if (key == null) delete s.readings[did]; else s.readings[did] = key;
  return true;
}
export function cycleReading(s, did, dir = 1) {
  const d = DEDUCTIONS[did];
  if (!d || !d.readings) return false;
  const keys = Object.keys(d.readings);
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
    const available = rows.every((r) => r.formed);
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
export function migrateCaseState(s) {
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
  return s;
}
