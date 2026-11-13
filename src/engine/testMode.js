// Deterministic test mode, enabled by URL parameters (never in normal play):
//
//   ?test=1          seed Math.random (default seed 1), don't start the requestAnimationFrame loop
//                    (the test drives fixed 1/60 s steps itself), and don't auto-pause on blur.
//   &seed=N          use another seed.
//   &live=1          with test=1: keep the real-time loop running (seeded, but not frame-exact).
//   ?scene=ID        skip the title and start a new game in that scene (also works without test=1).
//   &phase=NIGHT     story phase for ?scene (EVENING by default).   &spawn=key  spawn point.
//   ?nopause=1       don't auto-pause when the window loses focus.
//   ?hintDelay=N     seconds of stuck play before the first hint can be asked for (playtesting; data/hints.js).
//   &hintFollowUp=N  seconds more before the specific follow-up (default: half of hintDelay).
//
// Why seeding is enough: everything time-dependent in the game advances only in Game.update(dt)
// with a fixed dt, and every random choice (snowflakes, NPC idle phase, breath, audio jitter) comes
// from Math.random. With the loop stopped and Math.random seeded, N steps from boot always produce
// the same frame, so snowfall, lantern flicker, fire and fog are pixel-identical between runs.
//
// This module must be imported before anything that calls Math.random at module load or in
// constructors: main.js imports it first.
import { mulberry32 } from './rng.js';

const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const on = (k) => q.has(k) && q.get(k) !== '0';

export const TEST = {
  enabled: on('test'),
  seed: Number(q.get('seed')) || 1,
  manual: on('test') && !on('live'),
  noAutoPause: on('test') || on('nopause'),
  scene: q.get('scene') || null,
  phase: (q.get('phase') || 'EVENING').toUpperCase(),
  spawn: q.get('spawn') || null,
  hintDelay: q.has('hintDelay') ? Number(q.get('hintDelay')) : null,
  hintFollowUp: q.has('hintFollowUp') ? Number(q.get('hintFollowUp')) : null,
};

if (TEST.enabled) {
  Math.random = mulberry32(TEST.seed);
  console.info(`[test] deterministic mode: seed ${TEST.seed}, ${TEST.manual ? 'manual stepping' : 'live loop'}`);
}
