// Chapter 4, "Struck Through": the fourth day, played straight on from the third night's end card, for each way the
// killer can be settled (with the optional finds included or skipped, and the revolver drawn on Rusk once); how the
// third chapter's outcome changes the day (Finch gone up the ridge after "the woman", Ada Bell sheltering in town, Mrs.
// Gable's keys taken); saves in the middle of the chapter and on its end card; waiting by the dead fire for first
// light after "Sit by the dead fire a while". Captures in test-results/review/.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { boot, expectClean } from './helpers.mjs';

mkdirSync('test-results/review', { recursive: true });

const throughChapter3 = ({ ch1, ch2, ch3 }) => {
  const r1 = T.fullRun(ch1);
  const r2 = T.fullRun2(ch2);
  const r3 = T.fullRun3(ch3);
  return [...r1.errors, ...r2.errors, ...r3.errors];
};

test.describe('chapter 4 — the fourth day', () => {
  test.setTimeout(400_000);
  const runs = [
    { name: 'the true account, every optional find', ch1: { conclusion: 'C_STAGED', pit: true }, ch2: { conclusion: 'C2_BLAST' }, ch3: { conclusion: 'C3_HALE', thorough: true },
      ch4: { conclusion: 'C4_CUTLER', thorough: true }, aftermath: 'AFTER4_CUTLER', flag: 'killerKnown', rusk: 'confessed' },
    { name: 'Cutler alone; Finch up the ridge after the woman; optional finds skipped', ch1: { conclusion: 'C_RITE' }, ch2: { conclusion: 'C2_WAR' }, ch3: { conclusion: 'C3_GUEST', thorough: false },
      ch4: { conclusion: 'C4_ALONE', thorough: false }, aftermath: 'AFTER4_ALONE', flag: 'cutlerAlone', rusk: 'confessed' }, // (won over on the second day: he breaks at once)
    { name: 'Mercer\'s own hand; Mrs. Gable\'s keys taken; the revolver drawn on Rusk', ch1: { conclusion: 'C_TONIGHT', finchKind: false }, ch2: { conclusion: 'C2_RITE' }, ch3: { conclusion: 'C3_GABLE', thorough: true },
      ch4: { conclusion: 'C4_MERCER', thorough: true, gun: true }, aftermath: 'AFTER4_MERCER', flag: 'mercerAccused', rusk: 'fled' },
    { name: 'kept to myself', ch1: {}, ch2: { conclusion: null, thorough: false }, ch3: { conclusion: null, thorough: false },
      ch4: { conclusion: null, thorough: false }, aftermath: 'AFTER4_OPEN', flag: null, rusk: 'named' },
  ];
  for (const r of runs) {
    test(r.name, async ({ page }) => {
      const { errors } = await boot(page, { test: '1' });
      const earlier = await page.evaluate(throughChapter3, { ch1: r.ch1, ch2: r.ch2, ch3: r.ch3 });
      expect(earlier).toEqual([]);
      const rep = await page.evaluate((ch4) => T.fullRun4(ch4), r.ch4);
      expect(rep.errors, rep.steps.join('\n')).toEqual([]);
      expect(rep.aftermath).toBe(r.aftermath);
      expect(rep.rusk).toBe(r.rusk);
      const s = await page.evaluate(() => TWT.state);
      if (r.flag) expect(s.flags[r.flag]).toBe(true);
      for (const f of ['killerKnown', 'cutlerAlone', 'mercerAccused'].filter((x) => x !== r.flag)) expect(s.flags[f]).toBeFalsy();
      expect(s.time.day).toBe(4);
      expect(s.map.visited).toContain('loft');
      expect(s.items).toContain('TALLY_BOOK');
      // the end card's open questions and the story so far
      await page.evaluate(() => { for (let i = 0; i < 150; i++) TWT.update(1 / 60); TWT_TEST.render(); });
      await page.screenshot({ path: `test-results/review/ch4-endcard-${r.aftermath}.png` });
      // "Sit by the fire a while" (the second item, after "Go on: the fourth night"): the parlor at night, free to move;
      // the card not shown again
      await page.evaluate(() => { T.press('ArrowDown', 2); T.press('KeyE', 60); });
      const after = await page.evaluate(() => ({ scene: TWT.scene.id, move: TWT.canMove(), seen: TWT.state.flags.ch4EndCardSeen, phase: TWT.state.phase }));
      expect(after).toEqual({ scene: 'PARLOR', move: true, seen: true, phase: 'NIGHT' });
      await expectClean(page, errors);
    });
  }

  test('sitting by the dead fire after the third night, then waiting for first light; saves mid-day and on the end card resume', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const earlier = await page.evaluate(throughChapter3, { ch1: { conclusion: 'C_STAGED' }, ch2: { conclusion: 'C2_BLAST' }, ch3: { conclusion: 'C3_HALE', thorough: false } });
    expect(earlier).toEqual([]);
    // "Sit by the dead fire a while" (the second item), then the armchair: wait for first light
    await page.evaluate(() => { for (let i = 0; i < 150; i++) TWT.update(1 / 60); T.press('ArrowDown', 2); T.press('KeyE', 30); });
    expect(await page.evaluate(() => ({ scene: TWT.scene.id, move: TWT.canMove(), ch4: !!TWT.state.flags.ch4Started }))).toEqual({ scene: 'PARLOR', move: true, ch4: false });
    const resume = async () => {
      await page.reload();
      await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
      await page.evaluate(async () => { (await import('/tools/harness.js')).install(); TWT.continueGame(); T.step(60); });
    };
    await resume(); // a save after "sit a while" resumes by the fire, not on the card
    expect(await page.evaluate(() => ({ scene: TWT.scene.id, ov: TWT.overlay && TWT.overlay.constructor.name }))).toEqual({ scene: 'PARLOR', ov: null });
    await page.evaluate(() => {
      const g = TWT;
      T.walkTo(144); T.press('KeyE');
      for (let i = 0; i < 2000 && !(g.dialogue.active && g.dialogue.choices && g.dialogueView.shown >= (g.dialogue.lastText || '').length); i++) g.update(1 / 60);
      T.key('Digit1');
      for (let i = 0; i < 2000 && !g.state.flags.ch4Started; i++) g.update(1 / 60);
      for (let i = 0; i < 900 && !g.dialogue.active; i++) g.update(1 / 60);
      T.talkThrough([], 3000);
    });
    expect(await page.evaluate(() => ({ scene: TWT.scene.id, day: TWT.state.time.day, phase: TWT.state.phase, move: TWT.canMove() }))).toEqual({ scene: 'PARLOR', day: 4, phase: 'DAY', move: true });
    // to Rusk's and back out, then reload in the street
    await page.evaluate(() => {
      const door = (x) => { T.walkTo(x); T.press('KeyE'); T.step(80); T.talkThrough(); };
      door(18); T.walkTo(6); T.hold('KeyA', 20); T.step(80); T.talkThrough(); door(197);
      T.walkTo(181); T.press('KeyE'); T.talkThrough(); T.press('KeyE'); T.talkThrough();
      door(21); TWT.checkpoint();
    });
    await resume();
    expect(await page.evaluate(() => ({ scene: TWT.scene.id, day: TWT.state.time.day, reg: !!(TWT.state.evidence.EV4_REGISTER && TWT.state.evidence.EV4_REGISTER.examined), ov: TWT.overlay && TWT.overlay.constructor.name }))).toEqual({ scene: 'VILLAGE', day: 4, reg: true, ov: null });
    await expectClean(page, errors);
  });

  test('the killer\'s readings come only with their evidence; Ada will not show her book for nothing', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const earlier = await page.evaluate(throughChapter3, { ch1: { conclusion: 'C_STAGED' }, ch2: { conclusion: 'C2_BLAST' }, ch3: { conclusion: 'C3_HALE', thorough: false } });
    expect(earlier).toEqual([]);
    const r = await page.evaluate(async () => {
      const { readingUnlocked } = await import('/src/systems/caseSystem.js');
      const { observe } = await import('/src/systems/storyState.js');
      const g = TWT, s = g.state;
      for (let i = 0; i < 150; i++) g.update(1 / 60);
      T.press('KeyE', 3);
      for (let i = 0; i < 900 && !g.dialogue.active; i++) g.update(1 / 60);
      T.talkThrough([], 3000);
      const out = { padExamined: !!(s.evidence.EV3_PAD && s.evidence.EV3_PAD.examined), glove: s.items.includes('GLOVE') };
      // Ada (at the tower, this run): with neither the pad looked at closely nor the glove, no book
      const door = (x) => { T.walkTo(x); T.press('KeyE'); T.step(80); T.talkThrough(); };
      door(18); T.walkTo(6); T.hold('KeyA', 20); T.step(80); T.talkThrough(); door(373);
      T.walkTo(506); T.hold('KeyD', 20); T.step(80); T.talkThrough();
      T.walkTo(235); T.press('KeyE');
      for (let i = 0; i < 2000 && !(g.dialogue.active && g.dialogue.choices); i++) { if (g.dialogue.active && i % 5 === 0) T.key('KeyE'); g.update(1 / 60); }
      out.adaChoices = g.dialogue.choices ? g.dialogue.choices.map((c) => c.text) : [];
      T.key('Digit' + out.adaChoices.length); T.talkThrough();
      out.book = !!s.evidence.EV4_ADA_BOOK;
      // the killer's readings: "Cutler, with that knife" only once Cutler has been met; "Mercer's order" only with its evidence
      out.cutlerBefore = readingUnlocked(s, 'D4_TREAD', 'CUTLER');
      out.mercerBefore = readingUnlocked(s, 'D4_WORD', 'MERCER');
      observe(s, 'T4_CUTLER'); observe(s, 'T4_RUSK_CONFESS');
      out.cutlerAfter = readingUnlocked(s, 'D4_TREAD', 'CUTLER');
      out.mercerAfter = readingUnlocked(s, 'D4_WORD', 'MERCER');
      return out;
    });
    expect(r.padExamined).toBe(false);
    expect(r.glove).toBe(false);
    expect(r.adaChoices.some((c) => c.startsWith('My telegram was'))).toBe(false);
    expect(r.book).toBe(false);
    expect([r.cutlerBefore, r.mercerBefore, r.cutlerAfter, r.mercerAfter]).toEqual([false, false, true, true]);
    await expectClean(page, errors);
  });
});
