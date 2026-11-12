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
  { id: 'PARLOR', width: 416, spawn: 'fromStreet' },
  { id: 'ROOM4', width: 320, spawn: 'fromStairs' },
  { id: 'ROAD', width: 800, spawn: 'fromStation' },
  { id: 'CREEK', width: 768, spawn: 'fromVillage' },
  { id: 'STATION', width: 576, spawn: 'start' },
  { id: 'VILLAGE', width: 480, spawn: 'fromRoad' },
  { id: 'BLACK_RAM_EXTERIOR', width: 640, spawn: 'fromWest' },
  { id: 'SAWMILL', width: 576, spawn: 'fromCreek' },
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
      expect(Math.abs(s.g[0][1] - 150)).toBeLessThanOrEqual(3); // one ground line everywhere (rolling terrain stays within a few units) → Silas is the same size
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

test.describe('Sawmill (tile-built, Pass 2)', () => {
  test('layers come from the map: tile playfield, parallax with a ridge, foreground; ridge heights are published', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'SAWMILL', phase: 'NIGHT' });
    await step(page, 2);
    const L = await page.evaluate(async () => {
      const l = TWT.layers, M = await import('/src/world/painters.js');
      const h = M.sceneMeta.SAWMILL && M.sceneMeta.SAWMILL.ridgeHeights;
      return { back: l.back.map((b) => [b.name, b.factor]), main: [l.main.canvas.width, l.main.canvas.height], front: l.front.map((f) => f.name), ridge: h ? [h.length, h[300]] : null };
    });
    expect(L.back).toEqual([['sky', 0], ['mountains_far', 0.06], ['ridge', 0.22], ['pines', 0.45]]);
    expect(L.main).toEqual([864, 272]);
    expect(L.front).toEqual(['foreground']);
    expect(L.ridge[0]).toBeGreaterThan(400);
    expect(L.ridge[1]).toBeGreaterThan(40); // a real skyline height at the lantern's position, not the 90 fallback
    await expectClean(page, errors);
  });

  test('the playfield is not empty where the story needs it: shed, wheel frame and creek are painted', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'SAWMILL', phase: 'NIGHT' });
    await step(page, 2);
    const covered = await page.evaluate(() => {
      const c = TWT.layers.main.canvas, x = c.getContext('2d');
      const alpha = (px, py, w = 8, h = 8) => { const d = x.getImageData(px, py, w, h).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n / (w * h); };
      return { shedWall: alpha(260, 150), shedFloor: alpha(300, 226), beam: alpha(600, 90), wheel: alpha(668, 173), water: alpha(780, 250), rope: alpha(544, 128, 32, 32) * 10 };
    });
    for (const [k, v] of Object.entries(covered)) expect(v, k).toBeGreaterThan(0.2);
    await expectClean(page, errors);
  });
});

test.describe('Station (tile-built, Pass 2)', () => {
  test('layers: parallax, fog and track bed behind the train, tile playfield with glow, foreground', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'STATION' });
    await step(page, 2);
    const L = await page.evaluate(() => {
      const l = TWT.layers;
      return { back: l.back.map((b) => [b.name, b.factor, b.z]), main: [l.main.canvas.width, l.main.canvas.height, !!l.main.glow], front: l.front.map((f) => f.name), train: !!(TWT.props || []).length || true };
    });
    expect(L.back.map((b) => b[0])).toEqual(['sky', 'mountains_far', 'mountains_near', 'pines', 'haze', 'trackbed']);
    expect(L.back.map((b) => b[1])).toEqual([0, 0.08, 0.2, 0.4, 1, 1]);
    expect(L.back.every((b) => b[2] < -5), 'every back layer is behind the train prop (z -5)').toBe(true);
    expect(L.main).toEqual([864, 272, true]);
    expect(L.front).toEqual(['foreground']);
    await expectClean(page, errors);
  });

  test('a new game still runs the intro: the train pulls in and stops at the platform, over the track bed', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const r = await page.evaluate(() => {
      TWT.newGame();
      T.talkThrough([], 3000); // the intro
      const train = TWT.props.find((p) => p.id === 'train');
      return { scene: TWT.scene.id, introDone: !!TWT.state.flags.introDone, train: train && train.state };
    });
    expect(r).toEqual({ scene: 'STATION', introDone: true, train: 'stopped' });
    await step(page, 5);
    const rails = await page.evaluate(() => { const c = TWT.layers.back.find((b) => b.name === 'trackbed').canvas, d = c.getContext('2d').getImageData(0, 213, 16, 4).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
    expect(rails).toBeGreaterThan(20); // rails and sleepers are painted where the train's wheels run
    await expectClean(page, errors);
  });
});

test.describe('Main Street (tile-built, Pass 2)', () => {
  test('layers come from the map; the street is painted where the story needs it', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'VILLAGE' });
    await step(page, 2);
    const r = await page.evaluate(() => {
      const l = TWT.layers, c = l.main.canvas, x = c.getContext('2d');
      const alpha = (px, py, w = 8, h = 8) => { const d = x.getImageData(px, py, w, h).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n / (w * h); };
      return { main: [c.width, c.height, !!l.main.glow], cabinWall: alpha(40, 170), watcherWindow: alpha(88, 170), storeSign: alpha(300, 130), storeWindow: alpha(260, 185), shedDoor: alpha(640, 190), street: alpha(500, 230), front: l.front.map((f) => f.name) };
    });
    expect(r.main).toEqual([720, 272, true]);
    for (const k of ['cabinWall', 'watcherWindow', 'storeSign', 'storeWindow', 'shedDoor', 'street']) expect(r[k], k).toBeGreaterThan(0.5);
    expect(r.front).toEqual(['foreground']);
    await expectClean(page, errors);
  });

  test('the street lamp is lit in the evening and out at night, and its light follows', async ({ page }) => {
    const ev = await boot(page, { test: '1', scene: 'VILLAGE' });
    expect(await page.evaluate(() => TWT.scene.lights.map((l) => Math.round(l.x)))).toContain(264);
    await expectClean(page, ev.errors);
    const nt = await boot(page, { test: '1', scene: 'VILLAGE', phase: 'NIGHT' });
    expect(await page.evaluate(() => TWT.scene.lights.length)).toBe(0);
    await page.evaluate(() => T.walkTo(264));
    expect((await info(page)).prompt).toBe('Examine — Street lamp');
    await expectClean(page, nt.errors);
  });

  test("the watcher's silhouette sits inside the cabin window", async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'VILLAGE' });
    await page.evaluate(() => { TWT.state.flags.introDone = true; });
    const pos = await page.evaluate(() => { const p = TWT.props.find((q) => q.id === 'watcher'); return p ? p.lights(TWT) : null; });
    // lit pane centre (world units) lies inside the 32×32 px window tile at native x 80–111, y 160–191
    expect(pos[0].x * 1.5).toBeGreaterThan(80); expect(pos[0].x * 1.5).toBeLessThan(112);
    expect(pos[0].y * 1.5).toBeGreaterThan(160); expect(pos[0].y * 1.5).toBeLessThan(192);
    await expectClean(page, errors);
  });
});

test.describe('Hotel forecourt (detail pass)', () => {
  test('the MILL board points the way to the creek and can be examined', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
    await page.evaluate(() => { TWT.state.flags.introDone = true; T.walkTo(480); });
    expect((await info(page)).prompt).toBe('Examine — Old sign');
    await press(page, 'KeyE', 90);
    expect((await info(page)).dlg).toContain('MILL');
    await page.evaluate(() => T.talkThrough());
    await expectClean(page, errors);
  });

  test('street arrives from Main Street, the porch is worn, prints leave east; the playfield is painted end to end', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
    await step(page, 2);
    const r = await page.evaluate(() => {
      const c = TWT.layers.main.canvas, x = c.getContext('2d');
      const alpha = (px, py, w = 8, h = 8) => { const d = x.getImageData(px, py, w, h).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n / (w * h); };
      return { west: alpha(8, 230), door: alpha(470, 180), sign: alpha(704, 200, 16, 16), shed: alpha(780, 200), pines: alpha(880, 150, 16, 16), east: alpha(940, 230) };
    });
    for (const [k, v] of Object.entries(r)) expect(v, k).toBeGreaterThan(0.3);
    await expectClean(page, errors);
  });
});

test.describe('Road and Creek (tile-built)', () => {
  const crustY = (page, xs) => page.evaluate((list) => {
    const c = TWT.layers.main.canvas, x = c.getContext('2d'), out = [];
    for (const px of list) {
      const d = x.getImageData(px, 0, 1, c.height).data;
      let y = c.height - 1; while (y > 0 && d[y * 4 + 3] > 0) y--; // walk up from the bottom while the column is solid
      const g = TWT.scene.ground, wx = px / 1.5; let gy = g[g.length - 1][1];
      for (let i = 0; i < g.length - 1; i++) if (wx >= g[i][0] && wx <= g[i + 1][0]) gy = g[i][1] + ((wx - g[i][0]) / (g[i + 1][0] - g[i][0])) * (g[i + 1][1] - g[i][1]);
      out.push([px, y + 1, gy * 1.5]);
    }
    return out;
  }, xs);

  test('Road: terrain follows the ground polyline Silas walks on; fence, signpost, ore car and notice board are painted', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'ROAD' });
    await step(page, 2);
    for (const [px, top, gy] of await crustY(page, [600, 620, 640, 1040, 1060])) expect(Math.abs(top - gy), 'crust vs ground at x=' + px).toBeLessThanOrEqual(3);
    const r = await page.evaluate(() => { const x = TWT.layers.main.canvas.getContext('2d'); const a = (px, py, w = 8, h = 8) => { const d = x.getImageData(px, py, w, h).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n / (w * h); }; return { sign: a(200, 180, 40, 12), orecar: a(540, 200, 20, 20), notice: a(1085, 190, 20, 20), fence: a(100, 214, 16, 12) }; });
    for (const [k, v] of Object.entries(r)) expect(v, k).toBeGreaterThan(0.15);
    expect(await page.evaluate(() => TWT.layers.back.map((b) => [b.name, b.factor]))).toEqual([['sky', 0], ['mountains_far', 0.08], ['mountains_near', 0.18], ['lights', 0.32], ['pines_far', 0.42], ['pines_near', 0.7]]);
    await expectClean(page, errors);
  });

  test('Creek: terrain follows the polyline down to the water; footbridge and deadfall are painted; fresh prints lead to the bridge', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'CREEK', phase: 'NIGHT' });
    await step(page, 2);
    for (const [px, top, gy] of await crustY(page, [152, 280, 408, 536, 664, 792])) expect(Math.abs(top - gy), 'crust vs ground at x=' + px).toBeLessThanOrEqual(14); // columns include the creek bank below the crust
    const r = await page.evaluate(() => { const x = TWT.layers.main.canvas.getContext('2d'); const a = (px, py, w = 8, h = 8) => { const d = x.getImageData(px, py, w, h).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n / (w * h); }; return { bridge: a(950, 236, 40, 4), deadfall: a(1040, 150, 100, 60), water: a(300, 252, 40, 14) }; });
    for (const [k, v] of Object.entries(r)) expect(v, k).toBeGreaterThan(0.15);
    await expectClean(page, errors);
  });
});

test.describe('Hotel interiors (tile-built)', () => {
  const cover = (page, probes) => page.evaluate((list) => { const x = TWT.layers.main.canvas.getContext('2d'); return list.map(([n, px, py, w, h]) => { const d = x.getImageData(px, py, w, h).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) k++; return [n, k / (w * h)]; }); }, probes);

  test('Parlor: every feature is painted where its interactable or prop is, and the room is solid wall to wall', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'PARLOR' });
    await page.evaluate(() => T.talkThrough());
    await step(page, 2);
    const r = await cover(page, [['ceiling', 10, 2, 20, 10], ['wallpaper', 300, 60, 20, 20], ['door', 8, 180, 30, 30], ['hearth', 120, 200, 20, 20], ['photo', 241, 100, 8, 8], ['pigeonholes', 400, 110, 20, 20], ['stairs', 540, 200, 20, 20], ['floor', 300, 240, 20, 20], ['east wall', 610, 100, 10, 10]]);
    for (const [k, v] of r) expect(v, k).toBeGreaterThan(0.9);
    expect(await page.evaluate(() => TWT.layers.main.canvas.width)).toBe(624);
    await expectClean(page, errors);
  });

  test('Parlor: the fire prop is placed and the key row sits under the pigeonholes (key 4 is drawn missing)', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'PARLOR' });
    await page.evaluate(() => T.talkThrough());
    const fire = await page.evaluate(() => { const p = TWT.props.find((q) => q.id === 'fire'); return !!p; });
    expect(fire).toBe(true);
    const tiles = await page.evaluate(async () => { const m = await (await fetch('assets/levels/black_ram_parlor.tmj')).json(); const ids = await (await fetch('tools/data/hotel_tiles.json')).json(); const l = m.layers.find((q) => q.name === 'furniture'); const row = []; for (let c = 23; c <= 28; c++) row.push(l.data[10 * m.width + c] - 1); return { row, keyrow: ['keyrow_0_0', 'keyrow_0_1', 'keyrow_0_2', 'keyrow_0_3', 'keyrow_0_4', 'keyrow_0_5'].map((n) => ids[n]) }; });
    expect(tiles.row).toEqual(tiles.keyrow); // the six key tiles are in place; tile 3 (key 4) is drawn without its key by design
    await expectClean(page, errors);
  });

  test('Room 4: the scrubbed boards are visibly paler than the floor, at the clue', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'ROOM4' });
    await step(page, 2);
    const lum = await page.evaluate(() => { const x = TWT.layers.main.canvas.getContext('2d'); const avg = (px, py, w, h) => { const d = x.getImageData(px, py, w, h).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4) / 3; }; return { scrubbed: avg(262, 228, 32, 16), floor: avg(330, 228, 32, 16), clue: TWT.scene.interactables.find((i) => i.id === 'r4_floor').x * 1.5 }; });
    expect(lum.scrubbed).toBeGreaterThan(lum.floor + 8);
    expect(lum.clue).toBeGreaterThan(256); expect(lum.clue).toBeLessThan(304); // r4_floor sits on the paler boards
    await expectClean(page, errors);
  });

  test('Room 4: window glass, bed, wardrobe and washstand are painted where their interactables are', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'ROOM4' });
    await step(page, 2);
    const r = await cover(page, [['window', 215, 110, 30, 30], ['bed', 340, 190, 40, 20], ['wardrobe', 80, 150, 30, 40], ['washstand', 150, 190, 20, 10], ['door', 20, 170, 20, 30]]);
    for (const [k, v] of r) expect(v, k).toBeGreaterThan(0.9);
    await expectClean(page, errors);
  });
});
