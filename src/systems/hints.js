// Progressive hints: a stuck-timer over ACTIVE play, per investigation step (data/hints.js).
//   tier 0  nothing available yet
//   tier 1  the nudge can be asked for (after firstDelay of stuck time)
//   tier 2  the specific follow-up can be asked for (after the nudge was read and followUpDelay more stuck time)
// The game calls update(dt, active) every step; `active` is false while paused, in a blocking cutscene, or hidden.
// Not saved: after a reload the timer starts again from zero for the current step.
import { HINT_STEPS, HINT_TIMING } from '../data/hints.js';
import { test } from './storyState.js';

export class Hints {
  constructor(timing = {}) {
    this.timing = Object.assign({}, HINT_TIMING, timing);
    this.reset(null);
  }
  reset(stepId) { this.stepId = stepId; this.stuck = 0; this.given = 0; this.sinceGiven = 0; }

  currentStep(s) { return HINT_STEPS.find((h) => test(h.if, s) && !test(h.done, s)) || null; }

  // A compact signature of "relevant progress": any change restarts the stuck timer.
  progressKey(s) {
    return [s.evidenceCount, Object.values(s.evidence).filter((e) => e.examined).length, s.deductions.length,
      JSON.stringify(s.readings || {}), Object.keys(s.cases || {}).length].join('|');
  }

  update(dt, s, active) {
    const step = this.currentStep(s);
    const id = step ? step.id : null;
    const key = this.progressKey(s);
    if (id !== this.stepId) this.reset(id);
    else if (key !== this.key) { this.stuck = 0; this.sinceGiven = 0; } // progress: start counting again, keep what was read
    this.key = key;
    if (!step || !active) return;
    this.stuck += dt;
    if (this.given > 0) this.sinceGiven += dt;
  }

  // Which tier could the player ask for right now (0 = none)?
  available() {
    if (!this.stepId) return 0;
    if (this.given === 0) return this.stuck >= this.timing.firstDelay ? 1 : 0;
    if (this.given === 1) return this.sinceGiven >= this.timing.followUpDelay ? 2 : 0;
    return 0;
  }

  // The player asked. Returns the text to show, or null if nothing is available yet.
  request(s) {
    const step = this.currentStep(s);
    const tier = this.available();
    if (!step || !tier) return null;
    this.given = tier;
    this.sinceGiven = 0;
    return tier === 1 ? step.nudge : step.specific;
  }

  // Read back the last hint again (no new information), e.g. if the box was skipped too fast.
  last(s) {
    const step = this.currentStep(s);
    if (!step || !this.given) return null;
    return this.given === 1 ? step.nudge : step.specific;
  }
}
