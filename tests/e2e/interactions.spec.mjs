// Scene interactions: Tiled-authored objects and the existing hand-written scenes, plus the full
// scripted playthrough (tools/harness.js T.fullRun) as the regression test for existing content.
import { test, expect } from '@playwright/test';
import { boot, step, press, info, expectClean } from './helpers.mjs';

test.describe('Black Ram Hotel exterior (Tiled)', () => {
  test('examining a Tiled interactable shows its lines', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
    await page.evaluate(() => T.walkTo(165));
    expect((await info(page)).prompt).toBe('Examine — Hitching rail');
    await press(page, 'KeyE', 90);
    expect((await info(page)).dlg).toContain('hitching rail');
    await page.evaluate(() => T.talkThrough());
    expect((await info(page)).dlg).toBeNull();
    await expectClean(page, errors);
  });

  test('phase-dependent variants and phase-tagged lights switch at night', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR', phase: 'NIGHT' });
    await page.evaluate(() => T.walkTo(462));
    await press(page, 'KeyE', 90);
    expect((await info(page)).dlg).toContain('let go out');
    const lights = await page.evaluate(() => TWT.scene.lights.map((l) => Math.round(l.x)));
    expect(lights).toEqual([320, 395]); // porch lamp (both phases) + upstairs window (night only)
    expect(await page.evaluate(() => TWT.scene.darkness)).toBe(0.84);
    await expectClean(page, errors);
  });

  test('the zone event fires once; the door stays shut until Finch has been met, then enters the parlor', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
    await page.evaluate(() => T.walkTo(300));
    await step(page, 5);
    expect(await page.evaluate(() => TWT.state.eventsDone)).toContain('HOTEL_STREET_ENTER');
    await page.evaluate(() => T.walkTo(320));
    expect((await info(page)).prompt).toBe('Enter — Black Ram Hotel');
    await press(page, 'KeyE', 60); // story gate: Finch has not been met
    expect((await info(page)).scene).toBe('BLACK_RAM_EXTERIOR');
    await page.evaluate(() => { TWT.state.flags.metFinch = true; T.talkThrough(); });
    await press(page, 'KeyE', 60);
    const s = await info(page);
    expect(s.scene).toBe('PARLOR');
    expect(s.x).toBe(40); // PARLOR.fromStreet
    await expectClean(page, errors);
  });
});

test('recording evidence in a hand-written scene still works (parlor register)', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'PARLOR' });
  await page.evaluate(() => { T.talkThrough(); T.walkTo(303); });
  expect((await info(page)).prompt).toContain('Guest register');
  await press(page, 'KeyE', 60);
  await page.evaluate(() => T.talkThrough());
  expect(await page.evaluate(() => Object.keys(TWT.state.evidence))).toContain('HOTEL_REGISTER');
  await expectClean(page, errors);
});

test.describe('full vertical slice (existing content regression)', () => {
  test.setTimeout(240_000);
  for (const opts of [{}, { finchKind: false, examineAll: false }]) {
    test(`T.fullRun(${JSON.stringify(opts)}) passes every check`, async ({ page }) => {
      const { errors } = await boot(page, { test: '1' });
      const rep = await page.evaluate((o) => T.fullRun(o), opts);
      expect(rep.errors, rep.steps.join('\n')).toEqual([]);
      expect(rep.steps.length).toBeGreaterThanOrEqual(25);
      await expectClean(page, errors);
    });
  }
});
