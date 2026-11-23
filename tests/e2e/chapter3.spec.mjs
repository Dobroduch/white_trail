// Chapter 3, "What the Snow Keeps": the third day and night, played straight on from the second day's end card, for each
// way Room 4 can be settled (and with the optional finds skipped); the case's readings coming to mind only with their
// evidence; Mrs. Gable holding out until she is shown what Silas already knows; saves in the middle of the chapter and on
// its end card; the third night's details (the bolted door, the bed, the drugged coffee). Captures in test-results/review/.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { boot, expectClean } from './helpers.mjs';

mkdirSync('test-results/review', { recursive: true });

test.describe('chapter 3 — the third day and night', () => {
  test.setTimeout(300_000);
  const runs = [
    { name: 'the true account, every optional find', ch1: { conclusion: 'C_STAGED', pit: true }, ch2: { conclusion: 'C2_BLAST' }, ch3: { conclusion: 'C3_HALE', thorough: true }, aftermath: 'AFTER3_HALE', flag: 'gableConfides' },
    { name: 'the guest\'s trouble, optional finds skipped', ch1: { conclusion: 'C_RITE' }, ch2: { conclusion: 'C2_WAR' }, ch3: { conclusion: 'C3_GUEST', thorough: false }, aftermath: 'AFTER3_GUEST', flag: 'huntForGuest' },
    { name: 'Mrs. Gable\'s own work', ch1: { conclusion: 'C_TONIGHT', finchKind: false }, ch2: { conclusion: 'C2_RITE' }, ch3: { conclusion: 'C3_GABLE', thorough: true }, aftermath: 'AFTER3_GABLE', flag: 'gableAccused' },
    { name: 'kept to myself', ch1: {}, ch2: { conclusion: null, thorough: false }, ch3: { conclusion: null, thorough: false }, aftermath: 'AFTER3_OPEN', flag: null },
  ];
  for (const r of runs) {
    test(r.name, async ({ page }) => {
      const { errors } = await boot(page, { test: '1' });
      const rep = await page.evaluate(({ ch1, ch2, ch3 }) => {
        const r1 = T.fullRun(ch1);
        const r2 = T.fullRun2(ch2);
        return { earlier: [...r1.errors, ...r2.errors], r3: T.fullRun3(ch3) };
      }, { ch1: r.ch1, ch2: r.ch2, ch3: r.ch3 });
      expect(rep.earlier).toEqual([]);
      expect(rep.r3.errors, rep.r3.steps.join('\n')).toEqual([]);
      expect(rep.r3.aftermath).toBe(r.aftermath);
      const s = await page.evaluate(() => TWT.state);
      if (r.flag) expect(s.flags[r.flag]).toBe(true);
      for (const f of ['gableConfides', 'huntForGuest', 'gableAccused'].filter((x) => x !== r.flag)) expect(s.flags[f]).toBeFalsy();
      expect(s.time.day).toBe(3);
      expect(s.map.visited).toContain('office');
      expect(s.items).toContain('BUTTON');
      expect(s.items).not.toContain('GABLE_NOTE');
      if (r.ch3.thorough) expect(s.items).toContain('GLOVE'); else expect(s.items).not.toContain('GLOVE');
      // the end card's open questions and the story so far
      await page.evaluate(() => { for (let i = 0; i < 150; i++) TWT.update(1 / 60); TWT_TEST.render(); });
      await page.screenshot({ path: `test-results/review/ch3-endcard-${r.aftermath}.png` });
      // "Sit by the dead fire a while": still in the parlor at night, free to move; the card not shown again on reload
      await page.evaluate(() => { T.press('KeyE', 60); });
      const after = await page.evaluate(() => ({ scene: TWT.scene.id, move: TWT.canMove(), seen: TWT.state.flags.ch3EndCardSeen, phase: TWT.state.phase }));
      expect(after).toEqual({ scene: 'PARLOR', move: true, seen: true, phase: 'NIGHT' });
      await expectClean(page, errors);
    });
  }

  test('a save on the second day\'s end card goes on into the third; a save mid-chapter and on its end card resume where they were', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    await page.evaluate(() => { T.fullRun({ conclusion: 'C_STAGED' }); T.fullRun2({ conclusion: 'C2_BLAST' }); });
    const resume = async () => {
      await page.reload();
      await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
      await page.evaluate(async () => { (await import('/tools/harness.js')).install(); TWT.continueGame(); T.step(60); });
    };
    await resume();
    expect(await page.evaluate(() => ({ ov: TWT.overlay && TWT.overlay.constructor.name, ch: TWT.overlay && TWT.overlay.chapter }))).toEqual({ ov: 'EndCard', ch: 2 });
    // go on, see Hale, then reload in the office
    await page.evaluate(() => {
      for (let i = 0; i < 150; i++) TWT.update(1 / 60);
      T.press('KeyE', 3);
      for (let i = 0; i < 900 && !TWT.dialogue.active; i++) TWT.update(1 / 60);
      T.talkThrough([], 3000);
      const door = (x) => { T.walkTo(x); T.press('KeyE'); T.step(80); T.talkThrough(); };
      door(20); door(18); T.walkTo(6); T.hold('KeyA', 20); T.step(80); T.talkThrough(); door(43);
      T.walkTo(228); T.press('KeyE'); T.talkThrough(); T.press('KeyE'); T.talkThrough();
      TWT.checkpoint();
    });
    await resume();
    const mid = await page.evaluate(() => ({ scene: TWT.scene.id, day: TWT.state.time.day, coat: !!(TWT.state.evidence.EV3_COAT && TWT.state.evidence.EV3_COAT.examined), ch3: TWT.state.flags.ch3Started, ov: TWT.overlay && TWT.overlay.constructor.name }));
    expect(mid).toEqual({ scene: 'FINCH_OFFICE', day: 3, coat: true, ch3: true, ov: null });
    // the rest of the chapter, then reload on its end card
    await page.evaluate(() => {
      // (fullRun3 expects the second day's end card; finish the chapter by its own steps from here instead)
      const g = TWT, s = g.state;
      const door = (x) => { T.walkTo(x); T.press('KeyE'); T.step(80); T.talkThrough(); };
      door(21); door(373);
      for (let i = 0; i < 600 && !s.flags.burialDone; i++) { if (g.dialogue.active && i % 5 === 0) T.key('KeyE'); g.update(1 / 60); }
      T.talkThrough();
      T.walkTo(6); T.hold('KeyA', 20); T.step(80); T.talkThrough(); T.walkTo(470); T.hold('KeyD', 20); T.step(80); T.talkThrough();
      door(320); door(342);
      T.walkTo(221); T.press('KeyE'); T.talkThrough(); T.press('KeyE'); T.talkThrough();
      T.walkTo(61); T.press('KeyE'); T.talkThrough(); T.press('KeyE'); T.talkThrough();
      door(20);
      T.walkTo(276); T.press('KeyE');
      for (let i = 0; i < 5000 && (g.dialogue.active || g.cutsceneBlocking()); i++) {
        if (g.dialogue.active && g.dialogue.choices && g.dialogueView.shown >= (g.dialogue.lastText || '').length) {
          const c = g.dialogue.choices.map((x) => x.text); let idx = c.findIndex((t) => t.startsWith('Your wardrobe')); if (idx < 0) idx = c.length - 1; T.key('Digit' + (idx + 1));
        } else if (g.dialogue.active && i % 5 === 0) T.key('KeyE');
        g.update(1 / 60);
      }
      for (let i = 0; i < 400 && !s.flags.ch3DuskReady; i++) g.update(1 / 60);
      T.talkThrough();
      door(18); T.walkTo(320); T.press('KeyE'); T.step(20); T.talkThrough([9]);
      for (let i = 0; i < 600 && !(g.dialogue.active && g.dialogue.id === 'CH3_NIGHT'); i++) { if (g.dialogue.active && i % 5 === 0) T.key('KeyE'); g.update(1 / 60); }
      T.talkThrough([], 3000);
      g.checkpoint();
    });
    await resume();
    const night = await page.evaluate(() => ({ scene: TWT.scene.id, phase: TWT.state.phase, night: TWT.state.flags.ch3Night, note: TWT.state.items.includes('GABLE_NOTE'), gable: TWT.npcs.some((n) => n.id === 'gable'), pot: TWT.props.some((p) => p.id === 'coffeePot') }));
    expect(night).toEqual({ scene: 'PARLOR', phase: 'NIGHT', night: true, note: true, gable: false, pot: true });
    // the bed refuses the night; the coffee; the cup; the end card; reload on it
    await page.evaluate(() => {
      const g = TWT;
      T.walkTo(101); T.press('KeyE');
      for (let i = 0; i < 2000 && !(g.dialogue.active && g.dialogue.choices); i++) g.update(1 / 60);
      T.key('Digit1');
      for (let i = 0; i < 6000 && (g.cutsceneBlocking() || g.dialogue.active || !g.state.flags.woke3); i++) { if (g.dialogue.active && i % 6 === 0) T.key('KeyE'); g.update(1 / 60); }
      T.talkThrough();
      T.walkTo(112); T.press('KeyE'); T.talkThrough(); T.press('KeyE');
      for (let i = 0; i < 900 && !(g.overlay && g.overlay.constructor.name === 'EndCard'); i++) { if (g.dialogue.active && i % 6 === 0) T.key('KeyE'); g.update(1 / 60); }
    });
    await resume();
    expect(await page.evaluate(() => ({ ov: TWT.overlay && TWT.overlay.constructor.name, ch: TWT.overlay && TWT.overlay.chapter, note: TWT.state.items.includes('GABLE_NOTE'), drank: TWT.state.flags.drankCoffee }))).toEqual({ ov: 'EndCard', ch: 3, note: false, drank: true });
    await expectClean(page, errors);
  });

  test('Mrs. Gable holds out against the button alone; readings come to mind only with their evidence', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'PARLOR', phase: 'DAY' });
    const r = await page.evaluate(async () => {
      const cs = await import('/src/systems/caseSystem.js');
      const g = TWT, s = g.state;
      Object.assign(s.flags, { ch2Started: true, ch3Started: true, hasRoom4Key: true, parlorEntered: true });
      T.talkThrough();
      const ev = (id, examined = true) => { s.evidence[id] = { observed: true, examined, n: Object.keys(s.evidence).length + 1 }; };
      ev('HOTEL_ROOM4_BOARDS'); ev('T_GABLE_ROOM4'); ev('HOTEL_REGISTER'); ev('EV3_COAT'); ev('EV3_BUTTON', false);
      // the button alone: she deflects, and gives nothing
      g.dialogue.start('GABLE_DAY');
      const choicesOf = () => { for (let i = 0; i < 400 && !g.dialogue.choices; i++) { if (i % 5 === 0) T.key('KeyE'); g.update(1 / 60); } return g.dialogue.choices ? g.dialogue.choices.map((c) => c.text) : []; };
      const out = { first: choicesOf() };
      T.key('Digit' + (out.first.findIndex((t) => t.startsWith('This was under the bed')) + 1));
      out.afterButton = choicesOf();
      out.note = !!s.evidence.EV3_NOTE;
      for (let i = 0; i < 400 && g.dialogue.active; i++) { if (g.dialogue.choices) T.key('Digit' + g.dialogue.choices.length); else if (i % 5 === 0) T.key('KeyE'); g.update(1 / 60); }
      // readings: the button only seen, not looked at closely; the stair not looked at closely
      ev('EV3_PANEL', false); ev('T3_GABLE_STAIR');
      for (const [a, b] of [['S3_BUTTON', 'S3_COAT'], ['S3_STAIR', 'S3_HEARD'], ['S_GABLE_GUEST', 'S_REGISTER']]) cs.tryPair(s, a, b);
      out.offered = { here: cs.readingsOffered(s, 'D3_HALE_HERE'), stair: cs.readingsOffered(s, 'D3_STAIR'), guest: cs.readingsOffered(s, 'D_UNWRITTEN_GUEST') };
      out.truthOnTable = cs.conclusionsFor(s, 'Q_ROOM4').find((c) => c.id === 'C3_HALE').available;
      s.evidence.EV3_BUTTON.examined = true; s.evidence.EV3_PANEL.examined = true;
      out.offered2 = { here: cs.readingsOffered(s, 'D3_HALE_HERE'), stair: cs.readingsOffered(s, 'D3_STAIR') };
      out.truthOnTable2 = cs.conclusionsFor(s, 'Q_ROOM4').find((c) => c.id === 'C3_HALE').available;
      return out;
    });
    expect(r.first).toContain('This was under the bed in Room 4. [Show the button]');
    expect(r.first).not.toContain('Your wardrobe has a back to it.');
    expect(r.note).toBe(false);
    expect(r.offered).toEqual({ here: ['LATER'], stair: ['FLED'], guest: ['REAL', 'NONE'] });
    expect(r.truthOnTable).toBe(false);
    expect(r.offered2).toEqual({ here: ['STRUGGLE', 'LATER'], stair: ['CARRIED', 'FLED'] });
    expect(r.truthOnTable2).toBe(true);
    await expectClean(page, errors);
  });
});
