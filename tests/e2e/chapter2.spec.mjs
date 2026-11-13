// Chapter 2, "Deceit and Isolation": the second day, played straight on from the first night's end card (no title, no new
// game), for each way the first night can end and each way the second day can be settled; saves mid-chapter and on the
// first night's end card; and that nothing from the first night replays or is lost. Review captures go to
// test-results/review/.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { boot, step, expectClean } from './helpers.mjs';

mkdirSync('test-results/review', { recursive: true });

test.describe('chapter 2 — the second day', () => {
  test.setTimeout(240_000);
  // [first night, second day, the first night's consequence that must show up on the second day]
  const runs = [
    { name: 'true / true', ch1: { conclusion: 'C_STAGED', pit: true }, ch2: { conclusion: 'C2_BLAST' }, aftermath: 'AFTER2_BLAST', flag: 'watchGrave', vale: 'VALE.closed' },
    { name: 'the Order (town frightened) / old war stores', ch1: { conclusion: 'C_RITE' }, ch2: { conclusion: 'C2_WAR' }, aftermath: 'AFTER2_WAR', flag: 'powderMoved', vale: 'VALE.frightened', rusk: 'RUSK.frightened' },
    { name: 'murdered tonight (search party) / the Order\'s rites', ch1: { conclusion: 'C_TONIGHT', finchKind: false }, ch2: { conclusion: 'C2_RITE' }, aftermath: 'AFTER2_RITE', flag: 'valeEmboldened', vale: 'VALE.searched' },
    { name: 'left open / kept to myself', ch1: {}, ch2: { conclusion: null, thorough: false }, aftermath: 'AFTER2_OPEN', flag: null, vale: 'VALE.open' },
  ];
  for (const r of runs) {
    test(r.name, async ({ page }) => {
      const { errors } = await boot(page, { test: '1' });
      const rep = await page.evaluate(([a, b]) => {
        const r1 = T.fullRun(a);
        const before = { evidence: Object.keys(TWT.state.evidence), items: TWT.state.items.slice(), timeline: TWT.state.timeline.length };
        const r2 = T.fullRun2(b);
        return { r1, r2, before };
      }, [r.ch1, r.ch2]);
      expect(rep.r1.errors, rep.r1.steps.join('\n')).toEqual([]);
      expect(rep.r2.errors, rep.r2.steps.join('\n')).toEqual([]);
      expect(rep.r2.aftermath).toBe(r.aftermath);
      const s = await page.evaluate(() => TWT.state);
      // everything from the first night is still there
      for (const e of rep.before.evidence) expect(s.evidence[e], e).toBeTruthy();
      for (const i of rep.before.items) expect(s.items).toContain(i);
      expect(s.timeline.length).toBeGreaterThan(rep.before.timeline);
      // the first night's outcome coloured the second day
      expect(s.seen[r.vale], `Vale greets according to the first night (${r.vale})`).toBe(true);
      if (r.rusk) expect(s.seen[r.rusk]).toBe(true);
      if (r.flag) expect(s.flags[r.flag]).toBe(true);
      for (const f of ['watchGrave', 'powderMoved', 'valeEmboldened'].filter((x) => x !== r.flag)) expect(s.flags[f]).toBeFalsy();
      expect(s.map.visited).toEqual(expect.arrayContaining(['station', 'village', 'hotel', 'sawmill', 'store', 'chapel', 'tower']));
      expect(s.time.day).toBe(2);
      await page.evaluate(() => TWT_TEST.render());
      await page.screenshot({ path: `test-results/review/ch2-endcard-${r.aftermath}.png` });
      // "Walk the town a while longer": back on the forecourt by day, free to move, the end card not shown again on reload
      await page.evaluate(() => { for (let i = 0; i < 150; i++) TWT.update(1 / 60); T.press('KeyE', 90); T.talkThrough(); });
      const after = await page.evaluate(() => ({ scene: TWT.scene.id, move: TWT.canMove(), seen: TWT.state.flags.ch2EndCardSeen, phase: TWT.state.phase }));
      expect(after).toEqual({ scene: 'BLACK_RAM_EXTERIOR', move: true, seen: true, phase: 'DAY' });
      await expectClean(page, errors);
    });
  }

  test('a save on the first night\'s end card resumes there and goes on into the second day', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    await page.evaluate(() => T.fullRun({ conclusion: 'C_STAGED' }));
    expect(await page.evaluate(() => TWT.state.flags.sliceComplete && !TWT.state.flags.ch2Started)).toBe(true);
    // reload the page; Continue from the title
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.evaluate(async () => (await import('/tools/harness.js')).install());
    await page.evaluate(() => { T.step(40); T.press('KeyE', 10); T.press('KeyE', 10); }); // any key, then Continue
    const o = await page.evaluate(() => ({ ov: TWT.overlay && TWT.overlay.constructor.name, ch: TWT.overlay && TWT.overlay.chapter }));
    expect(o).toEqual({ ov: 'EndCard', ch: 1 });
    await page.evaluate(() => { for (let i = 0; i < 150; i++) TWT.update(1 / 60); T.press('KeyE', 3); for (let i = 0; i < 900 && !TWT.dialogue.active; i++) TWT.update(1 / 60); T.talkThrough([], 3000); });
    const s = await page.evaluate(() => ({ scene: TWT.scene.id, phase: TWT.state.phase, day: TWT.state.time.day, started: TWT.state.flags.ch2Started, hale: TWT.state.cases.HALE.conclusion }));
    expect(s).toEqual({ scene: 'BLACK_RAM_EXTERIOR', phase: 'DAY', day: 2, started: true, hale: 'C_STAGED' });
    await expectClean(page, errors);
  });

  test('a save in the middle of the second day reloads into the same place and state', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const mid = await page.evaluate(() => {
      T.fullRun({ conclusion: 'C_STAGED' });
      for (let i = 0; i < 150; i++) TWT.update(1 / 60);
      T.press('KeyE', 3); for (let i = 0; i < 900 && !TWT.dialogue.active; i++) TWT.update(1 / 60); T.talkThrough([], 3000);
      T.walkTo(6); T.hold('KeyA', 20); T.step(80); T.talkThrough();
      T.walkTo(197); T.press('KeyE'); T.step(80); T.talkThrough();
      T.walkTo(159); T.press('KeyE'); T.talkThrough(); T.press('KeyE'); T.talkThrough();
      TWT.checkpoint();
      return { scene: TWT.scene.id, ledger: TWT.state.evidence.STORE_LEDGER, phase: TWT.state.phase, deductions: TWT.state.deductions.length };
    });
    expect(mid.scene).toBe('RUSK_STORE');
    expect(mid.ledger.examined).toBe(true);
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.evaluate(async () => (await import('/tools/harness.js')).install());
    await page.evaluate(() => { T.step(40); T.press('KeyE', 10); T.press('KeyE', 30); });
    const back = await page.evaluate(() => ({ scene: TWT.scene.id, ledger: TWT.state.evidence.STORE_LEDGER, phase: TWT.state.phase, deductions: TWT.state.deductions.length, ov: TWT.overlay && TWT.overlay.constructor.name, rusk: TWT.npcs.some((n) => n.id === 'rusk') }));
    expect(back).toEqual({ ...mid, ov: null, rusk: true });
    await expectClean(page, errors);
  });

  test('by day the first night\'s people and beats stay done: no patrons, no second scream, no Finch on the porch', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'PARLOR', phase: 'DAY' });
    await step(page, 5);
    const p = await page.evaluate(() => ({ npcs: TWT.npcs.map((n) => n.id + ':' + n.dialogue), props: TWT.props.map((x) => x.id) }));
    expect(p.npcs).toEqual(['gable:GABLE_DAY']);
    expect(p.props).not.toContain('patrons');
    // the bed upstairs will not start the night over
    await page.evaluate(() => { TWT.loadScene('ROOM4', 'fromStairs'); T.walkTo(244); T.press('KeyE'); T.talkThrough(); });
    expect(await page.evaluate(() => ({ phase: TWT.state.phase, scream: !!TWT.state.flags.heardScream }))).toEqual({ phase: 'DAY', scream: false });
    expect(await page.evaluate(() => TWT.state.seen['BED.day'])).toBe(true);
    await expectClean(page, errors);
  });
});
