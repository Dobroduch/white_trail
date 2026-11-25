// Chapter 5, "The Fall": the fourth night, played straight on from the fourth day's end card, to each of the three
// endings (Mystery Bible §8: Q8, one living witness and one document; Q9, Exposed / Known but buried / The fall).
// Each test plays chapters 1–4 for real once, then branches the fourth night from that save (T.snapshot / T.resume,
// the way a player's "Continue" would) to cover how the earlier chapters and the night's own choices decide it:
// the cabin found or not, Clara's answer, the revolver fired or held, Mercer taken or let go, the fuse lit (Cutler
// warned, Mercer named, Clara taken), Vale's bell. Also: "Sit by the fire a while" then the front door; saves in the
// middle of the night; the last card on "Continue". Captures in test-results/review/.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { boot, expectClean } from './helpers.mjs';

mkdirSync('test-results/review', { recursive: true });

const throughChapter4 = ({ ch1, ch2, ch3, ch4 }) => {
  const reps = [T.fullRun(ch1), T.fullRun2(ch2), T.fullRun3(ch3), T.fullRun4(ch4)];
  window.__ch4end = T.snapshot();
  return reps.flatMap((r) => r.errors);
};
// the fourth night from the saved end of the fourth day, with the state changed first (optional)
const night = ({ opt, mutate }) => {
  T.resume(window.__ch4end, mutate ? new Function('st', mutate) : null);
  const r = T.fullRun5(opt);
  const s = TWT.state;
  return { errors: r.errors, steps: r.steps, ending: r.ending, fuseLit: r.fuseLit, flags: s.flags, shots: s.consequences.shotsFired, killed: s.consequences.peopleKilled, clara: s.chars.clara, cutler: s.chars.cutler, loaded: s.revolver.loaded };
};
const shot = async (page, name) => {
  await page.evaluate(() => { for (let i = 0; i < 150; i++) TWT.update(1 / 60); TWT_TEST.render(); });
  await page.screenshot({ path: `test-results/review/ch5-${name}.png` });
};

test.describe('chapter 5 — the fourth night', () => {
  test.setTimeout(400_000);

  test('the true account: Clara found at the cabin; every way the night can go from there', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const earlier = await page.evaluate(throughChapter4, { ch1: { conclusion: 'C_STAGED', pit: true }, ch2: { conclusion: 'C2_BLAST' }, ch3: { conclusion: 'C3_HALE', thorough: true }, ch4: { conclusion: 'C4_CUTLER', thorough: true } });
    expect(earlier).toEqual([]);
    // the whole way: she will testify, Cutler is taken alive, Mercer comes down
    let r = await page.evaluate(night, { opt: {} });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.ending).toBe('EXPOSED');
    expect(r.fuseLit).toBe(false);
    expect(r.flags).toMatchObject({ claraWithSilas: true, claraTestifies: true, cutlerTaken: true, mercerTaken: true });
    expect(r.flags.workingsBlown).toBeFalsy();
    expect([r.shots, r.loaded, r.cutler.alive]).toEqual([0, 3, true]);
    await shot(page, 'end-EXPOSED');
    // "Continue" on a finished story: the last card again
    expect(await page.evaluate(() => { TWT.toTitle(); TWT.continueGame(); return { ov: TWT.overlay && TWT.overlay.constructor.name, ch: TWT.overlay && TWT.overlay.chapter }; })).toEqual({ ov: 'EndCard', ch: 5 });
    // the revolver fired: Cutler dead, one cartridge gone; still exposed (Clara, Rusk and Finch can speak)
    r = await page.evaluate(night, { opt: { cutler: 'fire' } });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.ending).toBe('EXPOSED');
    expect([r.shots, r.loaded, r.cutler.alive, r.killed]).toEqual([1, 2, false, ['cutler']]);
    // Mercer let go: known, but buried
    r = await page.evaluate(night, { opt: { clara: 'no', mercer: 'let' } });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.ending).toBe('BURIED');
    expect(r.flags.letMercerGo).toBe(true);
    await shot(page, 'end-BURIED-let');
    // no witness who will stand up (Clara only wants to be safe, Rusk did not confess, Finch did not own up): Mercer
    // walks down ahead of me
    r = await page.evaluate(night, { opt: { clara: 'no', cutler: 'fire' }, mutate: "delete st.evidence.T4_FINCH_CONFESS; st.flags.ruskConfessed = false;" });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.ending).toBe('BURIED');
    expect(r.flags.noProof).toBe(true);
    // ...but Clara's word alone is a witness: the same night with her "all the way" is exposed
    r = await page.evaluate(night, { opt: { clara: 'yes', cutler: 'fire' }, mutate: "delete st.evidence.T4_FINCH_CONFESS; st.flags.ruskConfessed = false;" });
    expect(r.ending).toBe('EXPOSED');
    // not knowing the way to the cabin: Clara went to the workings herself; the cabin path is lost in the snow
    r = await page.evaluate(night, { opt: {}, mutate: "st.flags.knowsObservatory = false;" });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.ending).toBe('EXPOSED');
    expect(r.flags.claraWithSilas).toBeFalsy();
    expect(r.flags.cabinVisited).toBeFalsy();
    await expectClean(page, errors);
  });

  test('Finch went up after "the woman": Clara taken to the workings, the fuse lit; the fall, the shot, the bell', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const earlier = await page.evaluate(throughChapter4, { ch1: { conclusion: 'C_RITE' }, ch2: { conclusion: 'C2_WAR' }, ch3: { conclusion: 'C3_GUEST', thorough: false }, ch4: { conclusion: 'C4_ALONE', thorough: false } });
    expect(earlier).toEqual([]);
    expect(await page.evaluate(() => JSON.parse(window.__ch4end).flags.huntForGuest)).toBe(true);
    // the revolver held, no bell: the fall
    let r = await page.evaluate(night, { opt: {}, mutate: 'st.flags.valeTurned = false;' });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.fuseLit).toBe(true);
    expect(r.ending).toBe('FALL');
    expect(r.flags).toMatchObject({ claraLost: true, workingsBlown: true, cutlerTaken: true, finchFound: true });
    expect(r.clara.alive).toBe(false);
    await shot(page, 'end-FALL');
    // the revolver fired: the fuse pulled, Clara alive; Rusk's confession and the tally book are proof enough
    r = await page.evaluate(night, { opt: { cutler: 'fire', clara: 'no' }, mutate: 'st.flags.valeTurned = false;' });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.ending).toBe('EXPOSED');
    expect(r.flags).toMatchObject({ fuseOut: true, cutlerShot: true });
    expect(r.flags.workingsBlown).toBeFalsy();
    // held, with Vale's bell: the town comes up in time and digs her out
    r = await page.evaluate(night, { opt: { clara: 'yes' }, mutate: 'st.flags.valeTurned = true;' });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.ending).toBe('EXPOSED');
    expect(r.flags).toMatchObject({ bellRang: true, townCame: true, workingsBlown: true });
    expect(r.flags.claraLost).toBeFalsy();
    await expectClean(page, errors);
  });

  test('Mercer named in the street and the revolver drawn on Rusk: the fuse already burning when Clara and I come in', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const earlier = await page.evaluate(throughChapter4, { ch1: { conclusion: 'C_TONIGHT', finchKind: false }, ch2: { conclusion: 'C2_RITE' }, ch3: { conclusion: 'C3_GABLE', thorough: true }, ch4: { conclusion: 'C4_MERCER', thorough: true, gun: true } });
    expect(earlier).toEqual([]);
    // held: the fall comes down on the chest, but she is beside me
    let r = await page.evaluate(night, { opt: { clara: 'no' } });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.fuseLit).toBe(true);
    expect(r.flags).toMatchObject({ mercerAccused: true, ruskFled: true, claraWithSilas: true, workingsBlown: true });
    expect(r.ending).toBe('EXPOSED'); // (Finch owned up to the telegram on the fourth day: a witness)
    await shot(page, 'end-EXPOSED-blown');
    // fired: the fuse pulled; Mercer let go anyway
    r = await page.evaluate(night, { opt: { cutler: 'fire', mercer: 'let' } });
    expect(r.errors, r.steps.join('\n')).toEqual([]);
    expect(r.ending).toBe('BURIED');
    expect(r.flags).toMatchObject({ fuseOut: true, letMercerGo: true });
    await expectClean(page, errors);
  });

  test('"Sit by the fire a while", then out of the front door; saves on the ridge and in the workings resume', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const earlier = await page.evaluate(throughChapter4, { ch1: { conclusion: 'C_STAGED' }, ch2: { conclusion: 'C2_BLAST', thorough: false }, ch3: { conclusion: 'C3_HALE', thorough: false }, ch4: { conclusion: 'C4_CUTLER', thorough: true } });
    expect(earlier).toEqual([]);
    // "Sit by the fire a while" (the second item): the parlor at night
    await page.evaluate(() => { for (let i = 0; i < 150; i++) TWT.update(1 / 60); T.press('ArrowDown', 2); T.press('KeyE', 60); });
    expect(await page.evaluate(() => ({ scene: TWT.scene.id, move: TWT.canMove(), ch5: !!TWT.state.flags.ch5Started }))).toEqual({ scene: 'PARLOR', move: true, ch5: false });
    const resume = async () => {
      await page.reload();
      await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
      await page.evaluate(async () => { (await import('/tools/harness.js')).install(); TWT.continueGame(); T.step(60); });
    };
    await resume(); // the save after "sit a while" resumes by the fire, not on the card
    expect(await page.evaluate(() => ({ scene: TWT.scene.id, ov: TWT.overlay && TWT.overlay.constructor.name }))).toEqual({ scene: 'PARLOR', ov: null });
    // the front door: "Go up the ridge now?" Not yet, then yes
    const out = await page.evaluate(() => {
      const g = TWT;
      const ask = () => { T.walkTo(18); T.press('KeyE'); for (let i = 0; i < 2000 && !(g.dialogue.active && g.dialogue.choices && g.dialogueView.shown >= (g.dialogue.lastText || '').length); i++) g.update(1 / 60); };
      ask(); T.key('Digit2'); T.talkThrough();
      const notYet = { scene: g.scene.id, ch5: !!g.state.flags.ch5Started };
      ask(); T.key('Digit1');
      for (let i = 0; i < 2000 && !g.state.flags.ch5Started; i++) g.update(1 / 60);
      for (let i = 0; i < 900 && !g.dialogue.active; i++) g.update(1 / 60);
      T.talkThrough([], 3000);
      return { notYet, now: { scene: g.scene.id, phase: g.state.phase, move: g.canMove() } };
    });
    expect(out).toEqual({ notYet: { scene: 'PARLOR', ch5: false }, now: { scene: 'TELEGRAPH', phase: 'NIGHT', move: true } });
    // out onto the ridge, then reload there
    await page.evaluate(() => { T.walkTo(700); T.hold('KeyD', 30); T.step(90); T.talkThrough(); TWT.checkpoint(); });
    await resume();
    expect(await page.evaluate(() => ({ scene: TWT.scene.id, move: TWT.canMove(), ov: TWT.overlay && TWT.overlay.constructor.name }))).toEqual({ scene: 'RIDGE', move: true, ov: null });
    // up to the cabin for Clara, into the workings, then reload there: she is still with me, Cutler still at the fall
    await page.evaluate(() => {
      const g = TWT;
      T.walkTo(250); T.talkThrough(); // (the pale shape in the snow stops him a moment)
      T.walkTo(700); T.hold('KeyD', 30); T.step(90);
      for (let i = 0; i < 300 && !g.state.flags.cabinVisited; i++) g.update(1 / 60);
      T.talkThrough([0, 0], 4000);
      T.walkTo(20); T.press('KeyE'); T.step(80); T.talkThrough();
      T.walkTo(564); T.press('KeyE'); T.step(80);
      for (let i = 0; i < 300 && !g.state.flags.workingsEntered; i++) g.update(1 / 60);
      T.talkThrough([], 4000);
    });
    await resume();
    expect(await page.evaluate(() => ({ scene: TWT.scene.id, move: TWT.canMove(), npcs: TWT.npcs.map((n) => n.id).sort() }))).toEqual({ scene: 'WORKINGS', move: true, npcs: ['clara', 'cutler', 'mercer'] });
    await shot(page, 'workings');
    await expectClean(page, errors);
  });
});
