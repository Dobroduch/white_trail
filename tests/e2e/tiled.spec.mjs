// Tiled pipeline in the browser: layer construction, parallax, hot reload, and failure isolation.
import { test, expect } from '@playwright/test';
import { boot, step, expectClean } from './helpers.mjs';

test('the map becomes engine layers: parallax back layers, playfield, glow, foreground', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  await step(page, 2);
  const L = await page.evaluate(() => {
    const l = TWT.layers;
    return {
      back: l.back.map((b) => [b.name, b.factor, !!b.glow]),
      main: [l.main.canvas.width, l.main.canvas.height, l.main.native, !!l.main.glow],
      front: l.front.map((f) => [f.name, f.factor]),
    };
  });
  expect(L.back).toEqual([
    ['sky_evening', 0, false], ['mountains', 0.08, false], ['far_trees', 0.3, false],
    ['far_rooftops', 0.5, true], ['street_fog', 1, false],
  ]);
  expect(L.main).toEqual([960, 272, true, true]);
  expect(L.front).toEqual([['foreground', 1.2]]);
  // parallax: walking right moves near layers further than far ones
  const shift = await page.evaluate(() => {
    const before = [0, 0.3, 1].map((f) => TWT.layerX(f));
    T.walkTo(500); T.step(120);
    return [0, 0.3, 1].map((f, i) => before[i] - TWT.layerX(f));
  });
  expect(shift[0]).toBe(0);
  expect(shift[1]).toBeGreaterThan(0);
  expect(shift[2]).toBeGreaterThan(shift[1]);
  await expectClean(page, errors);
});

test('night uses the night-tagged layers', async ({ page }) => {
  await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR', phase: 'NIGHT' });
  await step(page, 2);
  const names = await page.evaluate(() => TWT.layers.back.map((b) => b.name));
  expect(names[0]).toBe('sky_night');
  expect(await page.evaluate(() => TWT.layers.back.find((b) => b.name === 'far_rooftops').glow)).toBeFalsy();
});

test('TWT.levels.reload() picks up an edited map without reloading the page', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  // simulate "saved in Tiled": serve a version whose sign text changed
  await page.route('**/assets/levels/black_ram_exterior.tmj*', async (route) => {
    const res = await route.fetch();
    const map = await res.json();
    const obj = map.layers.find((l) => l.name === 'gameplay').objects.find((o) => o.name === 'hotelSign');
    obj.properties.find((p) => p.name === 'lines').value = 'Edited in Tiled.';
    await route.fulfill({ json: map });
  });
  expect(await page.evaluate(() => TWT.levels.reload('BLACK_RAM_EXTERIOR'))).toBe(true);
  const lines = await page.evaluate(() => TWT.scene.interactables.find((i) => i.id === 'hotelSign').lines);
  expect(lines).toEqual(['Edited in Tiled.']);
  await expectClean(page, errors);
});

test('a broken map is reported clearly and the rest of the game still runs', async ({ page }) => {
  await page.route('**/assets/levels/black_ram_exterior.tmj*', (r) => r.fulfill({ json: { type: 'map', orientation: 'orthogonal', infinite: true, width: 10, height: 5, tilewidth: 16, tileheight: 16, layers: [], tilesets: [] } }));
  const { errors } = await boot(page, { test: '1', scene: 'PARLOR' });
  const st = await page.evaluate(() => TWT.levels.status.BLACK_RAM_EXTERIOR);
  expect(st.ok).toBe(false);
  expect(st.errors.join(' ')).toMatch(/infinite/i);
  expect(errors.some((e) => e.includes('[tiled]'))).toBe(true);
  expect(await page.evaluate(() => TWT.scene.id)).toBe('PARLOR');
  await step(page, 30);
  expect(await page.evaluate(() => [...TWT.errorsSeen])).toEqual([]);
});
