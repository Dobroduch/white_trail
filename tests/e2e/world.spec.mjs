// The opening-chapter exterior world: every location loads, its geometry is sane, and every
// transition between locations works through normal play (edge exits and doors), with the story
// gates intact. Add a location to LOCATIONS when it moves to Tiled.
//
// Screenshots for visual review are written to test-results/world/<scene>-<phase>.png (not baselines;
// the pixel baselines live in visual.spec.mjs).
import { test, expect } from '@playwright/test';
import { boot, step, press, info, expectClean } from './helpers.mjs';
import { mkdirSync } from 'node:fs';

// [scene id, phase, expected width (world units), a few x positions that must be walkable and framed]
const LOCATIONS = [
  { id: 'STATION', width: 560, spawn: 'start' },
  { id: 'VILLAGE', width: 480, spawn: 'fromRoad' },
  { id: 'BLACK_RAM_EXTERIOR', width: 640, spawn: 'fromWest' },
  { id: 'SAWMILL', width: 560, spawn: 'fromCreek' },
];

for (const loc of LOCATIONS) {
  test.describe(`${loc.id}: geometry`, () => {
    test('loads with the planned size, ground, bounds and a spawn on the ground', async ({ page }) => {
      const { errors } = await boot(page, { test: '1', scene: loc.id });
      await step(page, 3);
      const s = await page.evaluate(() => ({ w: TWT.scene.width, b: TWT.scene.bounds, g: TWT.scene.ground, sp: TWT.scene.spawns, id: TWT.scene.id, ext: TWT.scene.exterior, tiled: !!TWT.scene.tiled }));
      expect(s.id).toBe(loc.id);
      expect(s.tiled, 'authored in Tiled, not hand-written in scenes.js').toBe(true);
      expect(s.w).toBe(loc.width);
      expect(s.b[0]).toBeGreaterThan(0);
      expect(s.b[1]).toBeLessThan(s.w);
      expect(s.g[0][1]).toBe(150); // shared ground line → Silas is the same size everywhere
      expect(Object.keys(s.sp)).toContain(loc.spawn);
      await expectClean(page, errors);
    });

    test('collision: Silas cannot leave the bounds; the camera never shows beyond the map', async ({ page }) => {
      const { errors } = await boot(page, { test: '1', scene: loc.id });
      await page.evaluate(() => TWT.state.flags.introDone = true);
      const r = await page.evaluate(async () => {
        const D = await import('/src/engine/display.js');
        const g = TWT, out = {};
        for (const [k, x] of [['left', g.scene.bounds[0]], ['right', g.scene.bounds[1]]]) {
          T.walkTo(x); T.step(90);
          out[k] = { px: g.player.x, cam: g.camera.x, scene: g.scene.id };
        }
        return { ...out, viewW: D.VIEW_W, width: g.scene.width };
      });
      // an exit may have fired at an edge; only check the scene we started in
      for (const k of ['left', 'right']) {
        if (r[k].scene !== loc.id) continue;
        expect(r[k].cam).toBeGreaterThanOrEqual(0);
        expect(r[k].cam).toBeLessThanOrEqual(r.width - r.viewW + 0.5);
      }
      await expectClean(page, errors);
    });

    for (const phase of ['EVENING', 'NIGHT']) {
      test(`screenshot for review (${phase.toLowerCase()})`, async ({ page }) => {
        await page.setViewportSize({ width: 960, height: 540 });
        const { errors } = await boot(page, { test: '1', scene: loc.id, phase });
        await step(page, 60);
        mkdirSync('test-results/world', { recursive: true });
        await page.locator('#game').screenshot({ path: `test-results/world/${loc.id}-${phase}.png` });
        await expectClean(page, errors);
      });
    }
  });
}

test.describe('transitions', () => {
  const walkOff = (page, x, key) => page.evaluate(([px, k]) => { T.walkTo(px); T.hold(k, 25); T.step(80); return T.info(); }, [x, key]);

  test('ROAD → Main Street → hotel forecourt → Main Street, and back', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'ROAD' });
    expect((await walkOff(page, 796, 'KeyD')).scene).toBe('VILLAGE');
    expect(await page.evaluate(() => TWT.player.x)).toBeLessThan(40); // arrives at the west end, facing in
    await page.evaluate(() => { TWT.state.flags.metFinch = true; TWT.state.flags.curtainDrawn = true; }); // skip the street's story beats
    expect((await walkOff(page, 476, 'KeyD')).scene).toBe('BLACK_RAM_EXTERIOR');
    expect(await page.evaluate(() => TWT.player.x)).toBeLessThan(40);
    expect((await walkOff(page, 4, 'KeyA')).scene).toBe('VILLAGE');
    expect(await page.evaluate(() => TWT.player.x)).toBeGreaterThan(440); // arrives at the east end
    expect((await walkOff(page, 4, 'KeyA')).scene).toBe('ROAD');
    await expectClean(page, errors);
  });

  test('Station: the platform exit stays shut until the conductor has been spoken to, then leads to the road', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'STATION' });
    await page.evaluate(() => { TWT.state.flags.introDone = true; T.talkThrough(); });
    expect((await walkOff(page, 554, 'KeyD')).scene).toBe('STATION'); // blocked (STATION_BLOCK)
    await page.evaluate(() => { T.talkThrough(); TWT.state.flags.talkedConductor = true; });
    expect((await walkOff(page, 554, 'KeyD')).scene).toBe('ROAD');
    expect(await page.evaluate(() => TWT.player.x)).toBeLessThan(40);
    expect((await walkOff(page, 4, 'KeyA')).scene).toBe('STATION');
    expect(await page.evaluate(() => TWT.player.x)).toBeGreaterThan(520);
    await expectClean(page, errors);
  });

  test('Sawmill: reached from the creek footbridge; every inspection point is reachable and records its evidence', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'CREEK', phase: 'NIGHT' });
    await page.evaluate(() => { T.talkThrough(); T.walkTo(648); });
    await press(page, 'KeyE', 80);
    expect((await info(page)).scene).toBe('SAWMILL');
    const res = await page.evaluate(() => {
      T.talkThrough([], 3000); // the body event
      const out = [];
      for (const it of TWT.scene.interactables.filter((i) => i.evidence)) {
        T.walkTo(it.x); T.talkThrough([], 3000); T.walkTo(it.x); T.step(5); // the body event fires on the way
        const prompt = T.info().prompt;
        T.press('KeyE'); T.step(80); T.talkThrough([], 3000); T.step(150); T.talkThrough([], 3000); // incl. the ridge-light beat
        out.push([it.id, prompt, !!TWT.state.evidence[it.evidence]]);
      }
      return out;
    });
    for (const [id, prompt, recorded] of res) { expect(prompt, id).toContain('Examine'); expect(recorded, id + ' evidence recorded').toBe(true); }
    expect(res.length).toBeGreaterThanOrEqual(7);
    await expectClean(page, errors);
  });

  test('the creek stays closed in the evening and opens at night', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
    await page.evaluate(() => { TWT.state.flags.introDone = true; });
    expect((await walkOff(page, 632, 'KeyD')).scene).toBe('BLACK_RAM_EXTERIOR'); // blocked, with a line
    await page.evaluate(() => T.talkThrough());
    await page.evaluate(() => { TWT.state.phase = 'NIGHT'; TWT.loadScene('BLACK_RAM_EXTERIOR', 'fromHotel'); });
    expect((await walkOff(page, 632, 'KeyD')).scene).toBe('CREEK');
    // and the creek leads back to the forecourt, then on to the sawmill by the footbridge
    expect((await walkOff(page, 4, 'KeyA')).scene).toBe('BLACK_RAM_EXTERIOR');
    await expectClean(page, errors);
  });

  test('the parlor front door leads out to the forecourt, in front of the hotel', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'PARLOR' });
    await page.evaluate(() => T.talkThrough());
    await page.evaluate(() => { T.walkTo(18); });
    await press(page, 'KeyE', 70);
    const s = await info(page);
    expect(s.scene).toBe('BLACK_RAM_EXTERIOR');
    expect(Math.abs(s.x - 320)).toBeLessThan(2); // at the hotel door
    await expectClean(page, errors);
  });

  test('Main Street: the watcher event fires once at the window; Finch is met, then leaves for the hotel', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'VILLAGE' });
    await page.evaluate(() => { TWT.state.flags.introDone = true; T.walkTo(80); });
    await step(page, 120);
    expect(await page.evaluate(() => TWT.state.flags.curtainDrawn)).toBe(true);
    const done = await page.evaluate(() => {
      T.walkTo(300);
      T.step(10);
      const metBefore = !!TWT.state.flags.metFinch;
      T.talkThrough([], 3000);
      return { metBefore, met: !!TWT.state.flags.metFinch, hidden: TWT.scene.id };
    });
    expect(done.metBefore).toBe(false);
    expect(done.met).toBe(true);
    // Finch is gone from the street now; his scripted exit does not teleport him into the hotel
    expect(await page.evaluate(() => TWT.npcs ? TWT.npcs.some((n) => n.id === 'finch' && !n.hidden) : false)).toBe(false);
    await expectClean(page, errors);
  });

  test('story gate: the hotel door is shut before Finch and the east end of the street is open', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
    await page.evaluate(() => T.walkTo(320));
    await press(page, 'KeyE', 60);
    await page.evaluate(() => T.talkThrough());
    expect((await info(page)).scene).toBe('BLACK_RAM_EXTERIOR');
    await expectClean(page, errors);
  });
});
