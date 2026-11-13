// Data integrity checks for THE WHITE TRAIL. Run: node tools/validate.mjs
// Verifies every cross-reference between scenes, dialogue, scripts, evidence, deductions and sprites.
import { readFile } from 'node:fs/promises';
import { DIALOGUE, SPEAKERS } from '../src/data/dialogue.js';
import { EVIDENCE } from '../src/data/evidence.js';
import { LEADS, ITEMS, PEOPLE } from '../src/data/notebookData.js';
import { QUESTIONS, STATEMENTS, DEDUCTIONS, CONCLUSIONS, OPEN_OUTCOMES } from '../src/data/caseData.js';
import { HINT_STEPS, HINT_TIMING } from '../src/data/hints.js';
import { tryPair, conclusionsFor, setReading, commit, canCommit, migrateCaseState, statementKnown } from '../src/systems/caseSystem.js';
import { SCRIPTS } from '../src/data/scripts.js';
import { SCENES, GLOBAL_EVENTS } from '../src/world/scenes.js';
import { newState, test, apply, observe, examine, countAt } from '../src/systems/storyState.js';
import { LEVELS } from '../src/world/tiled/levelList.js';
import { sceneFromTiled, layerPlan, resolveUrl } from '../src/world/tiled/tiledMap.js';

let errors = 0, checks = 0;
const fail = (m) => { errors++; console.error('  ✗ ' + m); };
const ok = (cond, m) => { checks++; if (!cond) fail(m); };

function walkConds(c, where) {
  if (!c) return;
  for (const [k, v] of Object.entries(c)) {
    if (k === 'evidence' || k === 'noEvidence' || k === 'examined') ok(EVIDENCE[v], `${where}: unknown evidence ${v}`);
    if (k === 'item' || k === 'notItem') ok(ITEMS[v], `${where}: unknown item ${v}`);
    if (k === 'seen' || k === 'notSeen') { const [d, n] = v.split('.'); ok(DIALOGUE[d] && DIALOGUE[d].nodes[n], `${where}: unknown seen ${v}`); }
    if (k === 'all' || k === 'any') v.forEach((x) => walkConds(x, where));
  }
}
function walkEffects(list, where) {
  for (const e of list || []) {
    if (e.evidence) ok(EVIDENCE[e.evidence], `${where}: unknown evidence ${e.evidence}`);
    if (e.item) ok(ITEMS[e.item], `${where}: unknown item ${e.item}`);
    if (e.script) ok(SCRIPTS[e.script], `${where}: unknown script ${e.script}`);
  }
}

console.log('Dialogue');
for (const [id, d] of Object.entries(DIALOGUE)) {
  ok(d.nodes[d.start], `${id}: start node missing`);
  for (const [nid, n] of Object.entries(d.nodes)) {
    const w = `${id}.${nid}`;
    if (n.who) ok(n.who in SPEAKERS, `${w}: unknown speaker ${n.who}`);
    if (n.next) ok(n.next === 'END' || d.nodes[n.next], `${w}: next -> ${n.next} missing`);
    for (const c of n.choices || []) { ok(c.next === 'END' || d.nodes[c.next], `${w}: choice -> ${c.next} missing`); walkConds(c.if, w); }
    for (const b of n.branch || []) { ok(d.nodes[b.next], `${w}: branch -> ${b.next} missing`); walkConds(b.if, w); }
    ok(n.next || n.choices || n.branch, `${w}: dead end (no next/choices/branch)`);
    walkEffects(n.do, w);
  }
}

console.log('Scripts');
for (const [id, steps] of Object.entries(SCRIPTS)) {
  for (const s of steps) {
    if (s.say) ok(DIALOGUE[s.say], `${id}: say ${s.say} missing`);
    if (s.line) ok(s.line.who in SPEAKERS, `${id}: line speaker ${s.line.who}`);
  }
  // every script that takes control away gives it back
  const offs = steps.filter((s) => s.control === false).length;
  const ons = steps.filter((s) => s.control === true).length;
  ok(offs === 0 || ons > 0 || steps.some((s) => s.endCard), `${id}: removes control without restoring it`);
}

console.log('Tiled levels');
{
  // Convert every registered Tiled map exactly as the game does, check the files it needs, then
  // register it in SCENES so the scene checks below cover it like any hand-written scene.
  const exists = async (u) => { try { await readFile(u); return true; } catch { return false; } };
  for (const lv of LEVELS) {
    const mapUrl = new URL('../' + lv.url, import.meta.url);
    let map = null;
    try { map = JSON.parse(await readFile(mapUrl, 'utf8')); } catch (e) { ok(false, `${lv.id}: cannot read ${lv.url} (${e.message})`); continue; }
    const { scene, errors: errs, warnings } = sceneFromTiled(map, lv.id);
    for (const e of errs) ok(false, e);
    for (const wn of warnings) console.warn('  ! ' + wn);
    let maxGid = 0;
    for (const ts of map.tilesets || []) {
      let def = ts, base = lv.url;
      if (ts.source) {
        ok(!/\.tsx$/i.test(ts.source), `${lv.id}: tileset ${ts.source} must be JSON (.tsj), not .tsx`);
        base = resolveUrl(lv.url, ts.source);
        try { def = JSON.parse(await readFile(new URL('../' + base, import.meta.url), 'utf8')); } catch (e) { ok(false, `${lv.id}: tileset ${base} unreadable (${e.message})`); continue; }
      }
      if (def.image) ok(await exists(new URL('../' + resolveUrl(base, def.image), import.meta.url)), `${lv.id}: tileset image ${resolveUrl(base, def.image)} missing`);
      maxGid = Math.max(maxGid, ts.firstgid + (def.tilecount || 0) - 1);
    }
    const plan = layerPlan(map);
    for (const p of plan) {
      if (p.layer.type === 'imagelayer') ok(await exists(new URL('../' + resolveUrl(lv.url, p.layer.image), import.meta.url)), `${lv.id}: image layer "${p.name}" file ${p.layer.image} missing`);
      if (p.layer.type === 'tilelayer') {
        ok(Array.isArray(p.layer.data), `${lv.id}: layer "${p.name}" must use CSV tile layer format`);
        for (const g of p.layer.data || []) if (((g >>> 0) & 0x0fffffff) > maxGid) { ok(false, `${lv.id}: layer "${p.name}" uses tile ${g & 0x0fffffff} beyond its tilesets`); break; }
      }
      ok(['back', 'main', 'glow', 'front'].includes(p.role), `${lv.id}: layer "${p.name}" has unknown role "${p.role}"`);
    }
    ok(!SCENES[lv.id] || SCENES[lv.id].tiled, `${lv.id}: id collides with a hand-written scene`);
    if (!errs.length) SCENES[lv.id] = scene;
    ok(Object.keys(scene.spawns).length > 0, `${lv.id}: no spawn`);
  }
}

console.log('Scenes');
for (const [id, sc] of Object.entries(SCENES)) {
  const all = [sc, sc.night, sc.day].filter(Boolean);
  for (const ex of sc.exits || []) {
    ok(SCENES[ex.to], `${id}: exit to unknown ${ex.to}`);
    ok(SCENES[ex.to] && SCENES[ex.to].spawns[ex.spawn], `${id}: exit spawn ${ex.to}.${ex.spawn} missing`);
    if (ex.blockedScript) ok(SCRIPTS[ex.blockedScript], `${id}: blocked script missing`);
    if (ex.scriptIf) ok(SCRIPTS[ex.scriptIf.script], `${id}: scriptIf missing`);
    walkConds(ex.if, id);
  }
  for (const d of sc.doors || []) {
    ok(SCENES[d.to] && SCENES[d.to].spawns[d.spawn], `${id}: door ${d.id} -> ${d.to}.${d.spawn} missing`);
    if (d.scriptIf) { ok(SCRIPTS[d.scriptIf.script], `${id}: door ${d.id} scriptIf script missing`); walkConds(d.scriptIf.if, id); }
    ok(d.x >= sc.bounds[0] - 20 && d.x <= sc.bounds[1] + 20, `${id}: door ${d.id} outside interaction reach`);
    walkConds(d.if, id);
  }
  for (const v of all) for (const n of v.npcs || []) { ok(DIALOGUE[n.dialogue], `${id}: npc ${n.id} dialogue ${n.dialogue} missing`); walkConds(n.if, id); }
  for (const it of sc.interactables || []) {
    if (it.evidence) ok(EVIDENCE[it.evidence], `${id}: ${it.id} evidence missing`);
    if (it.dialogue) ok(DIALOGUE[it.dialogue], `${id}: ${it.id} dialogue missing`);
    ok(it.evidence || it.dialogue || it.lines || it.variants, `${id}: ${it.id} has nothing to say`);
    ok(it.x >= sc.bounds[0] - 20 && it.x <= sc.bounds[1] + 20, `${id}: ${it.id} unreachable at x=${it.x}`);
    walkConds(it.if, id);
  }
  for (const ev of sc.events || []) { if (ev.script) ok(SCRIPTS[ev.script], `${id}: event script ${ev.script} missing`); walkConds(ev.if, id); }
  for (const sp of Object.values(sc.spawns)) ok(sp.x >= sc.bounds[0] && sp.x <= sc.bounds[1], `${id}: spawn outside bounds`);
}
for (const ev of GLOBAL_EVENTS) { ok(SCRIPTS[ev.script], `global ${ev.id} script missing`); walkConds(ev.if, ev.id); }

console.log('Evidence / deductions / leads');
const sawmill = Object.values(SCENES.SAWMILL.interactables).filter((i) => i.evidence);
ok(sawmill.length >= 4, `sawmill has only ${sawmill.length} evidence interactables`);
for (const [id, e] of Object.entries(EVIDENCE)) {
  ok(e.title && e.observed && e.interpretation && e.location && e.category, `${id}: missing required fields`);
  for (const r of e.related.evidence || []) ok(EVIDENCE[r], `${id}: related ${r} missing`);
  if (e.collect) ok(ITEMS[e.collect], `${id}: collect item missing`);
}
console.log('Case data (statements / deductions / conclusions / hints / people)');
const qids = new Set(QUESTIONS.map((q) => q.id));
for (const q of QUESTIONS) walkConds(q.if, q.id);
for (const [id, st] of Object.entries(STATEMENTS)) {
  ok(qids.has(st.q), `${id}: unknown question ${st.q}`);
  ok(st.label && (st.text || st.variants), `${id}: needs label and text`);
  for (const e of st.sources || []) ok(EVIDENCE[e], `${id}: source ${e} missing`);
  ok(st.if || (st.sources || []).length, `${id}: no way to become known`);
  walkConds(st.if, id); for (const v of st.variants || []) walkConds(v.if, id);
}
for (const [id, d] of Object.entries(DEDUCTIONS)) {
  ok(qids.has(d.q), `${id}: unknown question ${d.q}`);
  for (const p of d.pairs) { ok(p.length === 2, `${id}: pair must have two statements`); for (const x of p) ok(STATEMENTS[x] && STATEMENTS[x].q === d.q, `${id}: pair statement ${x} missing or of another question`); }
  for (const e of d.details || []) ok(EVIDENCE[e], `${id}: detail ${e} missing`);
  for (const l of d.links || []) ok(DEDUCTIONS[l], `${id}: link ${l} missing`);
  if (d.readings) ok(Object.keys(d.readings).length === 2, `${id}: a deduction with readings needs exactly two`);
  ok(d.map && d.map.x >= 0 && d.map.x <= 1 && d.map.y >= 0 && d.map.y <= 1, `${id}: mind-map position missing`);
}
{ // no statement pair may form two deductions
  const seen = new Map();
  for (const [id, d] of Object.entries(DEDUCTIONS)) for (const p of d.pairs) { const k = [...p].sort().join('+'); ok(!seen.has(k), `pair ${k} forms both ${seen.get(k)} and ${id}`); seen.set(k, id); }
}
for (const [id, c] of Object.entries(CONCLUSIONS)) {
  ok(qids.has(c.q) && QUESTIONS.find((q) => q.id === c.q).case, `${id}: question ${c.q} is not a case`);
  for (const [did, key] of Object.entries(c.requires)) ok(DEDUCTIONS[did] && DEDUCTIONS[did].q === c.q && DEDUCTIONS[did].readings && DEDUCTIONS[did].readings[key], `${id}: requires ${did}=${key}, which does not exist`);
  ok(DIALOGUE[c.outcome.aftermath], `${id}: aftermath dialogue ${c.outcome.aftermath} missing`);
  ok(c.outcome.epilogue, `${id}: epilogue missing`);
  walkEffects(c.outcome.do, id);
}
for (const [c, o] of Object.entries(OPEN_OUTCOMES)) ok(DIALOGUE[o.aftermath], `open outcome dialogue for case ${c} missing`);
for (const q of QUESTIONS.filter((x) => x.case)) {
  const list = Object.values(CONCLUSIONS).filter((c) => c.q === q.id);
  ok(list.filter((c) => c.truth).length === 1, `${q.id}: exactly one conclusion must be the truth`);
  ok(list.length >= 2, `${q.id}: a case needs more than one plausible conclusion`);
  // the readings of different conclusions must exclude each other, so the player can never support two at once
  for (const a of list) for (const b of list) if (a !== b) ok(Object.entries(a.requires).some(([d, k]) => b.requires[d] && b.requires[d] !== k), `${q.id}: "${a.title}" and "${b.title}" can be supported at the same time`);
}
for (const h of HINT_STEPS) { ok(h.id && h.nudge && h.specific && h.done, `hint ${h.id}: incomplete`); walkConds(h.done, h.id); walkConds(h.if, h.id); }
ok(HINT_TIMING.firstDelay > 0 && HINT_TIMING.followUpDelay > 0, 'hint delays must be positive');
for (const p of PEOPLE) { walkConds(p.if, p.id); for (const n of p.notes || []) walkConds(n.if, p.id); ok(p.portrait, `${p.id}: portrait spec missing`); }
{ // the true conclusion of the Hale case is reachable from main-route evidence alone (no wheel pit, no optional dialogue)
  const s = newState();
  Object.assign(s.flags, { heardScream: true, foundSheriffBody: true, ridgeLightSeen: true });
  for (const e of ['T_FINCH_HALE', 'SAWMILL_ROPE', 'SAWMILL_MARKS', 'SAWMILL_LEDGER']) observe(s, e);
  examine(s, 'SAWMILL_BODY');
  for (const [a, b] of [['S_LITTLE_BLOOD', 'S_HOISTED'], ['S_OLD_BLOOD', 'S_MISSING'], ['S_MARKS', 'S_LEDGER'], ['S_SCREAM', 'S_RIDGE']]) ok(tryPair(s, a, b).ok, `main route: ${a}+${b} should form a deduction`);
  ok(!tryPair(s, 'S_LITTLE_BLOOD', 'S_LEDGER').ok, 'a wrong pair must be refused');
  ok(!tryPair(s, 'S_PIT', 'S_OLD_BLOOD').ok, 'a pair with an unknown statement must be refused');
  const truth = Object.entries(CONCLUSIONS).find(([, c]) => c.truth && c.q === 'Q_HALE');
  ok(conclusionsFor(s, 'Q_HALE').every((r) => r.available), 'main route: every Hale conclusion is on the table');
  ok(!canCommit(s, truth[0]), 'no commitment without readings');
  for (const [d, k] of Object.entries(truth[1].requires)) setReading(s, d, k);
  ok(conclusionsFor(s, 'Q_HALE').filter((r) => r.supported).length === 1, 'readings support exactly one conclusion');
  ok(commit(s, truth[0]) && s.cases.HALE.conclusion === truth[0], 'commit records the conclusion');
  ok(!setReading(s, 'D_LONG_DEAD', 'KEPT_ALIVE'), 'readings are locked after commitment');
  ok(!statementKnown(newState(), 'S_SCREAM'), 'statements are not known on a new game');
  const old = { ...newState(), deductions: ['D_SCENE_ARRANGED', 'D_GONE'], readings: undefined, cases: undefined, evidence: { SAWMILL_DRAG: { observed: true, examined: true, n: 1 } } };
  migrateCaseState(old);
  ok(old.deductions.join() === 'D_SCENE_ARRANGED' && old.readings && old.cases && old.flags.knowsWheelPit, 'old save migration');
}
for (const l of LEADS) for (const v of l.variants) walkConds(v.if, l.id);

console.log('State model');
{
  const s = newState();
  ok(observe(s, 'SAWMILL_BODY') === true, 'first observe should record');
  ok(observe(s, 'SAWMILL_BODY') === false, 'second observe must not duplicate');
  ok(Object.keys(s.evidence).length === 1 && s.evidenceCount === 1, 'evidence duplicated');
  examine(s, 'SAWMILL_BODY');
  ok(s.evidence.SAWMILL_BODY.examined, 'examine should mark examined');
  apply([{ evidence: 'SAWMILL_ROPE' }, { evidence: 'SAWMILL_ROPE' }, { evidence: 'T_GABLE_NIGHT' }], s);
  ok(countAt(s, 'SAWMILL') === 2, 'countAt should ignore testimony and duplicates');
  ok(test({ all: [{ evidence: 'SAWMILL_BODY' }, { notFlag: 'x' }, { any: [{ flag: 'nope' }, { phase: 'EVENING' }] }] }, s), 'compound condition');
  ok(!test({ xMin: 300 }, s, { playerX: 100 }), 'spatial condition');
  ok(s.revolver.loaded === 3 && s.revolver.capacity === 6, 'revolver must start with 3 of 6');
  ok(s.items.filter((i) => i === 'REVOLVER').length === 1, 'exactly one firearm');
  const json = JSON.parse(JSON.stringify(s));
  ok(json.evidence.SAWMILL_BODY.examined === true, 'state must serialize');
}

console.log('Sprites');
{
  const data = JSON.parse(await readFile(new URL('../assets/sprites/sprites.json', import.meta.url)));
  for (const [name, def] of Object.entries(data.sprites)) {
    for (const rows of def.frames || [def.rows]) {
      const w = rows[0].length;
      rows.forEach((r, i) => {
        ok(r.length === w, `${name} row ${i} width ${r.length} != ${w}`);
        for (const ch of r) if (ch !== '.') ok(data.palette[ch], `${name}: palette key '${ch}' missing`);
      });
    }
  }
  const used = new Set();
  for (const sc of Object.values(SCENES)) for (const v of [sc, sc.night, sc.day].filter(Boolean)) for (const n of v.npcs || []) used.add(n.sprite.replace(/_idle$/, ''));
  // a character is drawn from its native-density sheet (src/engine/assets.js NATIVE_SHEETS) or the legacy palette sprite
  const assetsSrc = await readFile(new URL('../src/engine/assets.js', import.meta.url), 'utf8');
  const native = new Set([...assetsSrc.matchAll(/sprites: \{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((x) => x[1])));
  for (const u of used) ok(data.sprites[u] || native.has(u + '_idle'), `npc sprite ${u} missing from sheet`);
  for (const n of ['silas_body', 'silas_legs', 'lantern_on', 'lantern_off', 'candle', 'hale_body', 'patron', 'patron_look']) ok(data.sprites[n], `sprite ${n} missing`);
}

console.log('Item artwork');
{
  // every item has its own 48x48 inventory picture, plus the sawmill pick-ups' world sprites
  const pngSize = (buf) => [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  const seen = new Set();
  for (const [id, it] of Object.entries(ITEMS)) {
    ok(it.icon, `${id}: no inventory icon`);
    if (!it.icon) continue;
    ok(!seen.has(it.icon), `${id}: icon ${it.icon} shared with another item`); seen.add(it.icon);
    let buf = null;
    try { buf = await readFile(new URL('../' + it.icon, import.meta.url)); } catch { /* reported below */ }
    ok(buf, `${id}: icon file ${it.icon} missing`);
    if (buf) { const [w, h] = pngSize(buf); ok(w === 48 && h === 48, `${id}: icon is ${w}x${h}, expected 48x48`); }
  }
  for (const f of ['pocket_watch_world', 'ledger_world']) {
    let buf = null;
    try { buf = await readFile(new URL(`../assets/export/items/world/${f}.png`, import.meta.url)); } catch { /* reported below */ }
    ok(buf, `world item sprite ${f}.png missing`);
  }
}

console.log(`\n${checks} checks, ${errors} error(s)`);
process.exit(errors ? 1 : 0);
