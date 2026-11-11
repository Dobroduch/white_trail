// Shared helpers for the Playwright suite. They drive the real game through window.TWT (the game
// object), window.TWT_TEST (deterministic stepping in ?test=1 mode) and tools/harness.js (the same
// harness used for manual console play-testing), so there is one test driver, not two.
import { expect } from '@playwright/test';

/** Open the game with URL params, wait until booted, and start collecting console errors. */
export async function boot(page, params = {}) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const qs = new URLSearchParams({ dpr: '1', ...params }).toString();
  await page.goto('/?' + qs);
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 20_000 });
  await page.evaluate(async () => { (await import('/tools/harness.js')).install(); });
  return { errors };
}

/** Advance the deterministic simulation (test mode only) by n fixed 1/60 s steps. */
export const step = (page, n = 1) => page.evaluate((k) => window.TWT_TEST.step(k), n);
export const info = (page) => page.evaluate(() => window.T.info());
export const game = (page, fn, arg) => page.evaluate(fn, arg);

/** Press a key through the real keyboard path, then step so the game consumes it. */
export async function press(page, key, frames = 3) {
  await page.keyboard.press(key);
  await step(page, frames);
}

/** Fail if the page logged errors or the game caught runtime exceptions. */
export async function expectClean(page, errors) {
  expect(errors, 'browser console errors').toEqual([]);
  const seen = await page.evaluate(() => [...window.TWT.errorsSeen]);
  expect(seen, 'game runtime errors').toEqual([]);
}
