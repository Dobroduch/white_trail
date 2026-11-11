// UI systems: pause, settings (persisted), notebook / inventory / map panels, dialogue choices.
import { test, expect } from '@playwright/test';
import { boot, step, press, info, expectClean } from './helpers.mjs';

const overlay = (page) => page.evaluate(() => (TWT.overlay ? TWT.overlay.panelKind || TWT.overlay.constructor.name : null));

test('Esc pauses (even mid-dialogue) and resumes', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  await page.evaluate(() => T.walkTo(165));
  await press(page, 'KeyE', 10);
  expect((await info(page)).dlg).not.toBeNull();
  await press(page, 'Escape');
  expect(await overlay(page)).toBe('PauseMenu');
  const shown = await page.evaluate(() => TWT.dialogueView.shown);
  await step(page, 60);
  expect(await page.evaluate(() => TWT.dialogueView.shown)).toBe(shown); // typewriter frozen while paused
  await press(page, 'Escape');
  expect(await overlay(page)).toBeNull();
  await expectClean(page, errors);
});

test('settings: volume rows change the audio buses and persist to localStorage', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  await press(page, 'KeyD', 2); // a user gesture: unlocks Web Audio
  await press(page, 'Escape');
  const items = await page.evaluate(() => TWT.overlay.items.map((i) => i.act));
  for (let i = 0; i < items.indexOf('settings'); i++) await press(page, 'ArrowDown');
  await press(page, 'Enter');
  expect(await overlay(page)).toBe('SettingsMenu');
  const rows = await page.evaluate(() => TWT.overlay.rows().map((r) => r.key));
  expect(rows).toEqual(expect.arrayContaining(['master', 'ambience', 'effects', 'footsteps', 'interaction', 'music']));
  // footsteps: down to the row, then Left ×10 → 0 %
  for (let i = 0; i < rows.indexOf('footsteps'); i++) await press(page, 'ArrowDown');
  for (let i = 0; i < 10; i++) await press(page, 'ArrowLeft');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('thewhitetrail.settings.v1')));
  expect(saved.footsteps).toBe(0);
  await page.waitForTimeout(400); // gains glide (setTargetAtTime), they don't jump
  const g = await page.evaluate(() => ({ steps: TWT.audio.steps.gain.value, interact: TWT.audio.interact.gain.value }));
  expect(g.steps).toBeLessThan(0.01);
  expect(g.interact).toBeGreaterThan(0.9);
  await press(page, 'Escape'); await press(page, 'Escape');
  expect(await overlay(page)).toBeNull();
  await expectClean(page, errors);
});

test('notebook, inventory and map open with N / I / M, switch directly, and close', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  await step(page, 5);
  await press(page, 'KeyN');
  expect(await overlay(page)).toBe('notebook');
  await press(page, 'KeyI');
  expect(await overlay(page)).toBe('inventory');
  await press(page, 'KeyM');
  expect(await overlay(page)).toBe('map');
  await press(page, 'KeyM');
  expect(await overlay(page)).toBeNull();
  await press(page, 'Tab');
  expect(await overlay(page)).toBe('notebook');
  await press(page, 'Escape');
  expect(await overlay(page)).toBeNull();
  await expectClean(page, errors);
});

test('dialogue choices can be picked with the number keys', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'PARLOR' });
  await page.evaluate(() => { T.talkThrough(); T.walkTo(258); });
  expect((await info(page)).prompt).toContain('Mrs. Gable');
  await press(page, 'KeyE', 10);
  // advance until a choice list appears
  for (let i = 0; i < 40 && !(await info(page)).choices; i++) { await page.evaluate(() => { TWT.dialogueView.shown = 1e9; }); await press(page, 'KeyE', 4); }
  const before = await info(page);
  expect(before.choices && before.choices.length).toBeGreaterThan(0);
  await page.evaluate(() => { TWT.dialogueView.shown = 1e9; });
  await press(page, 'Digit1', 10);
  expect((await info(page)).dlg).not.toBe(before.dlg);
  await expectClean(page, errors);
});
