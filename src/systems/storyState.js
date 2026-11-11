// Central, serializable story state. Presentation state (camera, particles, UI) lives elsewhere.
import { EVIDENCE } from '../data/evidence.js';

export const SAVE_VERSION = 1;

export function newState() {
  return {
    version: SAVE_VERSION,
    scene: 'STATION',
    spawn: 'start',
    playerX: null,
    facing: 1,
    phase: 'EVENING',
    time: { day: 1, h: 18, m: 40 },
    lanternOn: false,
    lanternOil: 100,
    warmth: 100,
    revolver: { loaded: 3, capacity: 6, reserve: 0 }, // firing is not implemented in this milestone
    items: ['TELEGRAM', 'LANTERN', 'REVOLVER'],
    evidence: {}, // id -> { observed: true, examined: bool, n: discovery order }
    evidenceCount: 0,
    deductions: [],
    looked: {}, // interactable id -> times examined
    seen: {}, // 'DIALOGUE.node' -> true
    flags: { receivedTelegram: true, trappedInVillage: true },
    chars: {
      silas: { alive: true },
      conductor: { alive: true },
      finch: { alive: true, trust: 'WARY' },
      gable: { alive: true, cooperation: 'GUARDED' },
      hale: { alive: false, found: false },
      clara: { alive: true, location: 'UNKNOWN' },
    },
    eventsDone: [],
    timeline: [], // { t: 'HH:MM', text } — written by story beats at the in-game time they happen
    consequences: { shotsFired: 0, peopleKilled: [], peopleWounded: [], threatsMade: [] },
  };
}

// ---------------- Conditions ----------------
// ctx: { playerX } for spatial conditions.
export function test(cond, s, ctx = {}) {
  if (!cond) return true;
  for (const [k, v] of Object.entries(cond)) {
    switch (k) {
      case 'flag': if (!s.flags[v]) return false; break;
      case 'notFlag': if (s.flags[v]) return false; break;
      case 'evidence': if (!s.evidence[v]) return false; break;
      case 'noEvidence': if (s.evidence[v]) return false; break;
      case 'examined': if (!(s.evidence[v] && s.evidence[v].examined)) return false; break;
      case 'item': if (!s.items.includes(v)) return false; break;
      case 'notItem': if (s.items.includes(v)) return false; break;
      case 'seen': if (!s.seen[v]) return false; break;
      case 'notSeen': if (s.seen[v]) return false; break;
      case 'phase': if (s.phase !== v) return false; break;
      case 'trust': for (const [c, t] of Object.entries(v)) if (s.chars[c].trust !== t) return false; break;
      case 'xMin': if (!(ctx.playerX >= v)) return false; break;
      case 'xMax': if (!(ctx.playerX <= v)) return false; break;
      case 'countAt': if (countAt(s, v.scene) < v.min) return false; break;
      case 'noDeductions': if (s.deductions.length > 0) return false; break;
      case 'all': if (!v.every((c) => test(c, s, ctx))) return false; break;
      case 'any': if (!v.some((c) => test(c, s, ctx))) return false; break;
      default: console.warn(`[story] unknown condition "${k}"`);
    }
  }
  return true;
}

export function countAt(s, scene) {
  let n = 0;
  for (const id of Object.keys(s.evidence)) if (EVIDENCE[id] && EVIDENCE[id].location === scene && EVIDENCE[id].category !== 'TESTIMONY') n++;
  return n;
}

// ---------------- Effects ----------------
// Returns a list of side-effect requests for the game layer (scripts to run, notifications).
export function apply(effects, s) {
  const out = [];
  for (const e of effects || []) {
    if (e.set) Object.assign(s.flags, e.set);
    if (e.evidence) { const r = observe(s, e.evidence); if (r) out.push({ noted: e.evidence }); }
    if (e.examine) { if (examine(s, e.examine)) out.push({ noted: e.examine, detail: true }); }
    if (e.item && !s.items.includes(e.item)) { s.items.push(e.item); out.push({ item: e.item }); }
    if (e.removeItem) s.items = s.items.filter((i) => i !== e.removeItem);
    if (e.char) for (const [c, patch] of Object.entries(e.char)) Object.assign(s.chars[c], patch);
    if (e.script) out.push({ script: e.script });
    if (e.log && !s.timeline.some((t) => t.text === e.log)) s.timeline.push({ t: timeString(s.time), text: e.log });
  }
  return out;
}

// Record that Silas has observed a piece of evidence. Never duplicates.
export function observe(s, id) {
  if (!EVIDENCE[id]) { console.error(`[evidence] unknown evidence id "${id}"`); return false; }
  if (s.evidence[id]) return false;
  s.evidenceCount += 1;
  s.evidence[id] = { observed: true, examined: !EVIDENCE[id].detail, n: s.evidenceCount };
  return true;
}
export function examine(s, id) {
  const fresh = observe(s, id);
  const rec = s.evidence[id];
  if (!rec) return false;
  const changed = !rec.examined;
  rec.examined = true;
  return fresh || changed;
}

export function timeString(t) {
  return String(t.h).padStart(2, '0') + ':' + String(t.m).padStart(2, '0');
}
export function advanceTime(s, minutes) {
  let total = s.time.h * 60 + s.time.m + minutes;
  if (s.phase === 'EVENING') total = Math.min(total, 22 * 60 + 30); // the evening never runs past 22:30
  if (s.phase === 'NIGHT') total = Math.min(total, 3 * 60 + 30);
  s.time.h = Math.floor(total / 60) % 24;
  s.time.m = total % 60;
}
