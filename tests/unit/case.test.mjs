// Pure-logic tests for the investigation layer: hint timing, case rules, the wheel-pit tileset and the Road sign tiles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Hints } from '../../src/systems/hints.js';
import { HINT_TIMING } from '../../src/data/hints.js';
import { newState, observe, examine } from '../../src/systems/storyState.js';
import { tryPair, conclusionsFor, setReading, cycleReading, commit, statementKnown, knownStatements } from '../../src/systems/caseSystem.js';
import { decodePNG } from '../../tools/lib/png.mjs';

const root = new URL('../../', import.meta.url);

test('hints: nothing before the delay, nudge then follow-up, only while active, reset by progress', () => {
  const s = newState();
  s.flags.introDone = true;
  const h = new Hints({ firstDelay: 10, followUpDelay: 5 });
  for (let i = 0; i < 9; i++) h.update(1, s, true);
  assert.equal(h.available(), 0);
  assert.equal(h.request(s), null);
  for (let i = 0; i < 20; i++) h.update(1, s, false); // paused / hidden: no time passes
  assert.equal(h.available(), 0);
  h.update(1, s, true);
  assert.equal(h.available(), 1);
  assert.match(h.request(s), /conductor/);
  assert.equal(h.available(), 0);
  for (let i = 0; i < 5; i++) h.update(1, s, true);
  assert.equal(h.available(), 2);
  assert.match(h.request(s), /press E/);
  assert.equal(h.available(), 0);
  observe(s, 'T_CONDUCTOR_PASS'); h.update(1, s, true); // progress on the step restarts the clock
  assert.equal(h.stuck, 1, 'the clock restarted on that step');
  s.flags.talkedConductor = true; h.update(1, s, true); // next step
  assert.equal(h.stepId, 'H_FINCH');
  assert.equal(h.given, 0);
  assert.ok(HINT_TIMING.firstDelay >= 60, 'the shipped first delay is a meaningful stretch of play');
});

test('case rules: statements merge records, pairs form deductions, readings decide what is supported', () => {
  const s = newState();
  assert.deepEqual(knownStatements(s, 'Q_HALE'), []);
  observe(s, 'T_GABLE_HALE');
  assert.ok(statementKnown(s, 'S_MISSING'), 'any merged source makes the statement known');
  examine(s, 'SAWMILL_BODY'); observe(s, 'SAWMILL_ROPE');
  assert.equal(tryPair(s, 'S_HOISTED', 'S_LITTLE_BLOOD').id, 'D_SCENE_ARRANGED');
  assert.equal(tryPair(s, 'S_LITTLE_BLOOD', 'S_HOISTED').fresh, false);
  assert.equal(tryPair(s, 'S_MISSING', 'S_HOISTED').ok, false);
  assert.equal(tryPair(s, 'S_OLD_BLOOD', 'S_MISSING').id, 'D_LONG_DEAD');
  assert.ok(cycleReading(s, 'D_SCENE_ARRANGED'));
  assert.equal(s.readings.D_SCENE_ARRANGED, 'DRAINED');
  assert.ok(cycleReading(s, 'D_SCENE_ARRANGED'));
  assert.equal(s.readings.D_SCENE_ARRANGED, 'MOVED');
  const tonight = conclusionsFor(s, 'Q_HALE').find((c) => c.id === 'C_TONIGHT');
  assert.equal(tonight.available, false, 'needs the scream deduction too');
  Object.assign(s.flags, { heardScream: true }); observe(s, 'CREEK_TRACKS');
  tryPair(s, 'S_SCREAM', 'S_TRACKS');
  setReading(s, 'D_LONG_DEAD', 'KEPT_ALIVE'); setReading(s, 'D_THE_SCREAM', 'DEATH');
  assert.ok(conclusionsFor(s, 'Q_HALE').find((c) => c.id === 'C_TONIGHT').supported);
  assert.ok(commit(s, 'C_TONIGHT'));
  assert.equal(commit(s, 'C_STAGED'), false, 'one commitment per case');
  assert.equal(setReading(s, 'D_THE_SCREAM', 'SUMMONS'), false);
});

test('wheel-pit tileset and the Road sign use only palette colours and the sign block holds the whole board', () => {
  const ids = JSON.parse(readFileSync(new URL('tools/data/wilderness_tiles.json', root), 'utf8'));
  const img = decodePNG(readFileSync(new URL('assets/export/tilesets/wilderness_exterior.png', root)));
  // assemble the 6×4 block and find the board's lettering extent (linen2 pixels)
  const at = (tile, x, y) => { const tx = (tile % 8) * 16 + x, ty = Math.floor(tile / 8) * 16 + y; return img.data.slice((ty * img.width + tx) * 4, (ty * img.width + tx) * 4 + 4); };
  let maxX = -1, minX = 999;
  for (let c = 0; c < 6; c++) for (let x = 0; x < 16; x++) for (let y = 4; y < 12; y++) {
    const p = at(ids[`sign_crow_wide_0_${c}`], x, y);
    if (p[3] && p[0] === 0xe4 && p[1] === 0xdc && p[2] === 0xc4) { maxX = Math.max(maxX, c * 16 + x); minX = Math.min(minX, c * 16 + x); }
  }
  assert.equal(minX, 18, 'lettering starts after the post');
  assert.equal(maxX - minX + 1, 53, "CROW'S HOLLOW is 53 px of 3×5 lettering, all of it inside the block");
  assert.ok(maxX < 96 - 6, 'room for the arrow point');
});
