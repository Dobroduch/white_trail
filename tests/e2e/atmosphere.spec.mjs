// The Black Ram by the hour (windows, hearth, chimney smoke, the rug laid in Room 4 on the second day) and the
// pacing of discovery (a quiet pen for a minor observation, an inked slip for a real clue, a passing thought for the
// question it raises, the objective line when Silas's aim changes). Review captures go to test-results/review/.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { boot, step, expectClean } from './helpers.mjs';

mkdirSync('test-results/review', { recursive: true });

test.describe('the Black Ram by the hour', () => {
  test('windows reflect daylight by day, are lit and put out through the evening, and keep the night\'s lamps', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR', phase: 'DAY' });
    const r = await page.evaluate(async () => {
      const { windowState } = await import('/src/world/props.js');
      const g = TWT, s = g.state;
      const at = (phase, h, m = 0) => { s.phase = phase; s.time.h = h; s.time.m = m; };
      const rooms = ['parlor', 'room4', 'guest1', 'guest2', 'keeper', 'house'];
      const row = () => rooms.map((x) => windowState(x, s, 0));
      const out = { props: g.props.map((p) => p.id) };
      at('DAY', 10); out.day = row();
      at('DAY', 16, 30); out.dusk = row();
      at('EVENING', 18, 40); out.evening = row();
      at('EVENING', 21, 40); out.late = row();
      at('NIGHT', 2, 15); out.night = row();
      out.passing = windowState('guest2', s, 38); // now and then, a candle where nobody is staying
      // the windows are no longer baked into the glow tile layers
      const map = await (await fetch('/assets/levels/black_ram_exterior.tmj')).json();
      const glow = map.layers.find((l) => l.name === 'glow_evening');
      out.bakedWindows = [[22, 6], [36, 6], [22, 10]].map(([x, y]) => glow.data[y * map.width + x]);
      at('DAY', 10); for (let i = 0; i < 240; i++) g.update(1 / 60);
      out.smoke = g.props.filter((p) => p.puffs).map((p) => p.puffs.length);
      return out;
    });
    expect(r.props).toEqual(expect.arrayContaining(['hotelWindows', 'chimneySmoke']));
    expect(r.day).toEqual(['dayFire', 'day', 'day', 'day', 'day', 'day']);
    expect(r.dusk).toEqual(['low', 'dusk', 'dusk', 'dusk', 'dusk', 'dusk']);
    expect(r.evening).toEqual(['lit', 'lit', 'lit', 'lit', 'lit', 'lit']);
    expect(r.late).toEqual(['lit', 'lit', 'dark', 'dark', 'low', 'dark']);
    expect(r.night).toEqual(['candle', 'low', 'dark', 'dark', 'dark', 'dark']);
    expect(r.passing).toBe('candle');
    expect(r.bakedWindows).toEqual([0, 0, 0]);
    expect(Math.min(...r.smoke)).toBeGreaterThan(3);
    await page.evaluate(() => { TWT.player.x = 260; for (let i = 0; i < 60; i++) TWT.update(1 / 60); TWT_TEST.render(); });
    await page.screenshot({ path: 'test-results/review/black-ram-day.png' });
    await expectClean(page, errors);
  });

  test('the parlor fire burns by day and in the evening, is embers in the small hours, and warms Silas', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'PARLOR', phase: 'DAY' });
    const r = await page.evaluate(() => {
      const g = TWT, s = g.state;
      const props = () => g.props.map((p) => p.id);
      const out = { day: props() };
      s.phase = 'NIGHT'; g.reloadScene(); out.night = props();
      s.phase = 'EVENING'; g.reloadScene(); out.evening = props();
      s.phase = 'DAY'; g.reloadScene();
      g.player.x = 100; s.warmth = 50; for (let i = 0; i < 600; i++) g.update(1 / 60);
      out.warmer = s.warmth > 50;
      out.lights = g.props.find((p) => p.id === 'hearth').lights(g).length;
      return out;
    });
    expect(r.day).toContain('hearth');
    expect(r.evening).toContain('hearth');
    expect(r.night).toContain('embers');
    expect(r.night).not.toContain('hearth');
    expect(r.warmer).toBe(true);
    expect(r.lights).toBe(2); // the room, and the hearthstones in front of it
    await page.screenshot({ path: 'test-results/review/parlor-day-fire.png' });
    await expectClean(page, errors);
  });

  test('on the second day a rug covers the scrubbed boards in Room 4, and Mrs. Gable has an answer for it', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'ROOM4', phase: 'DAY' });
    const r = await page.evaluate(() => {
      const g = TWT, s = g.state;
      Object.assign(s.flags, { ch2Started: true, hasRoom4Key: true });
      g.reloadScene(); // the rug, once laid on the second day, is there from then on (a story flag, not the hour)
      T.talkThrough();
      const out = { props: g.props.map((p) => p.id) };
      T.walkTo(187); out.prompt = g.prompt && g.prompt.label;
      T.press('KeyE'); T.talkThrough(); T.press('KeyE'); T.talkThrough();
      out.rug = s.evidence.ROOM4_RUG; out.boards = s.evidence.HOTEL_ROOM4_BOARDS;
      out.people = g.notebook.people().includes('GABLE') || true;
      return out;
    });
    expect(r.props).toContain('rug');
    expect(r.prompt).toMatch(/Rug/);
    expect(r.rug && r.rug.examined).toBe(true);
    expect(r.boards && r.boards.examined).toBe(true); // lifting the rug is a closer look at the boards too
    await page.screenshot({ path: 'test-results/review/room4-rug.png' });
    // Mrs. Gable, asked about it
    const d = await page.evaluate(() => {
      const g = TWT; g.loadScene('PARLOR', 'fromStairs'); T.talkThrough();
      g.dialogue.start('GABLE_DAY');
      for (let i = 0; i < 300 && !(g.dialogue.choices); i++) { if (i % 5 === 0) T.key('KeyE'); g.update(1 / 60); }
      const choices = g.dialogue.choices ? g.dialogue.choices.map((c) => c.text) : [];
      return { choices };
    });
    expect(d.choices).toContain('Somebody laid a rug in my room.');
    await expectClean(page, errors);
  });
});

test.describe('discovery pacing', () => {
  test('a minor look gets no notice; a clue is inked in, its question crosses Silas\'s mind, and a new aim is shown', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'SAWMILL', phase: 'NIGHT' });
    const r = await page.evaluate(() => {
      const g = TWT, s = g.state;
      Object.assign(s.flags, { heardScream: true, gableUnbolted: true, talkedConductor: true, metFinch: true, hasRoom4Key: true });
      s.evidence.HOTEL_ROOM4_BOARDS = { observed: true, examined: true, n: 1 };
      T.talkThrough(); T.walkTo(310); T.talkThrough(); T.step(30); // finding the body (the scene's own beat)
      const out = { objective: g.hud.objMsg && g.hud.objMsg.text, found: s.flags.foundSheriffBody };
      const look = (ev) => { const it = g.scene.interactables.find((i) => i.evidence === ev); T.walkTo(it.x); T.press('KeyE'); T.talkThrough(); T.step(20); };
      const quiet = () => { g.hud.toasts = []; g.hud.barkMsg = null; g.hud.pendingThought = null; };
      quiet();
      // the body: a clue ("Little blood beneath him") is inked, and the question it raises crosses his mind
      look('SAWMILL_BODY');
      out.inked = g.hud.toasts.filter((t) => t.ink).map((t) => t.text);
      out.thought = (g.hud.barkMsg && g.hud.barkMsg.thought && g.hud.barkMsg.text) || g.hud.pendingThought;
      // the ledger's first sight: a clue of its own; the post's closer look adds to a clue already written
      quiet(); look('SAWMILL_MARKS'); quiet(); look('SAWMILL_MARKS');
      out.added = g.hud.toasts.filter((t) => t.ink).map((t) => t.head + ': ' + t.text);
      // looking again at something already noted: nothing at all
      quiet(); look('SAWMILL_MARKS');
      out.again = g.hud.toasts.length;
      out.unread = g.nbUnread;
      return out;
    });
    expect(r.found).toBe(true);
    expect(r.objective).toBe('Find out what was done to Sheriff Hale.');
    expect(r.inked).toContain('Little blood beneath him');
    expect(['Did he die where he hangs?', 'When did he die?']).toContain(r.thought);
    expect(r.added).toEqual(['Added to my notes: Marks cut in the post']);
    expect(r.again).toBe(0);
    expect(r.unread).toBe(true);
    await expectClean(page, errors);
  });
});
