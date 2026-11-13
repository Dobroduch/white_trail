// The investigation layer: case solving (correct and incorrect commitments), the optional wheel pit, progressive hints,
// the Mind map and People pages, saves mid-investigation and saves written by the previous build, the lantern, the
// dialogue speaker styling, the Road sign and the night sky.
import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { boot, step, info, press, expectClean } from './helpers.mjs';

const SAVE_KEY = 'thewhitetrail.save.v1';
const fixture = (name) => readFileSync(new URL(`./fixtures/save-v1-${name}.json`, import.meta.url), 'utf8');
mkdirSync('test-results/review', { recursive: true });

test.describe('case 1 — what happened to Sheriff Hale', () => {
  test.setTimeout(240_000);
  const runs = [
    { name: 'true account, with the hidden wheel pit', opts: { conclusion: 'C_STAGED', pit: true }, aftermath: 'AFTER_STAGED', flag: 'millKeptClosed', trust: 'STEADY', pitSeen: true },
    { name: 'true account, main route only (pit skipped)', opts: { conclusion: 'C_STAGED' }, aftermath: 'AFTER_STAGED', flag: 'millKeptClosed', trust: 'STEADY', pitSeen: false },
    { name: 'wrong account: murdered at the mill tonight', opts: { conclusion: 'C_TONIGHT', finchKind: false }, aftermath: 'AFTER_TONIGHT', flag: 'millSearched', trust: 'WARY', pitSeen: false },
    { name: 'wrong account: bled in the Order\'s name', opts: { conclusion: 'C_RITE' }, aftermath: 'AFTER_RITE', flag: 'townFrightened', trust: 'COLD', pitSeen: false },
  ];
  for (const r of runs) {
    test(r.name, async ({ page }) => {
      const { errors } = await boot(page, { test: '1' });
      const rep = await page.evaluate((o) => T.fullRun(o), r.opts);
      expect(rep.errors, rep.steps.join('\n')).toEqual([]);
      expect(rep.aftermath).toBe(r.aftermath);
      const s = await page.evaluate(() => TWT.state);
      expect(s.cases.HALE.conclusion).toBe(r.opts.conclusion);
      expect(s.flags[r.flag]).toBe(true);
      for (const other of ['millKeptClosed', 'millSearched', 'townFrightened'].filter((f) => f !== r.flag)) expect(s.flags[other]).toBeFalsy();
      expect(s.chars.finch.trust).toBe(r.trust);
      expect(!!s.evidence.PIT_HOLLOW).toBe(r.pitSeen);
      expect(s.map.visited).toContain('sawmill');
      await page.evaluate(() => TWT_TEST.render());
      await page.screenshot({ path: `test-results/review/endcard-${r.opts.conclusion}.png` });
      await expectClean(page, errors);
    });
  }

  test('leaving undecided is its own outcome', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const rep = await page.evaluate(() => T.fullRun({}));
    expect(rep.errors, rep.steps.join('\n')).toEqual([]);
    expect(rep.aftermath).toBe('AFTER_OPEN');
    expect(await page.evaluate(() => TWT.state.cases.HALE)).toBeUndefined();
    await expectClean(page, errors);
  });

  test('the review never marks the true account; commitment needs matching readings and is final', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'SAWMILL', phase: 'NIGHT' });
    const r = await page.evaluate(async () => {
      const cs = await import('/src/systems/caseSystem.js');
      const g = TWT, s = g.state;
      Object.assign(s.flags, { foundSheriffBody: true, heardScream: true, ridgeLightSeen: true });
      for (const e of ['T_FINCH_HALE', 'SAWMILL_ROPE', 'SAWMILL_MARKS', 'SAWMILL_LEDGER']) s.evidence[e] = { observed: true, examined: true, n: 1 };
      s.evidence.SAWMILL_BODY = { observed: true, examined: true, n: 2 };
      for (const [a, b] of [['S_LITTLE_BLOOD', 'S_HOISTED'], ['S_OLD_BLOOD', 'S_MISSING'], ['S_MARKS', 'S_LEDGER'], ['S_SCREAM', 'S_RIDGE']]) cs.tryPair(s, a, b);
      g.openPanel('notebook'); T.press('KeyC', 2);
      const review = g.overlay;
      TWT_TEST.render();
      const before = cs.conclusionsFor(s, 'Q_HALE').map((c) => ({ id: c.id, available: c.available, supported: c.supported }));
      // try to commit without readings
      const rows = review.rows(); const ci = rows.findIndex((x) => x.kind === 'c');
      while (review.sel !== ci) T.press('ArrowDown', 1);
      T.step(15); // past the review's input guard
      T.press('KeyE', 2);
      const refused = { msg: review.msg, top: g.overlay.constructor.name, committed: !!s.cases.HALE };
      return { before, refused, rowsOrder: rows.filter((x) => x.kind === 'c').map((x) => x.id) };
    });
    expect(r.before.every((c) => c.available && !c.supported)).toBe(true);
    expect(r.refused.committed).toBe(false);
    expect(r.refused.top).toBe('CaseReview');
    expect(r.refused.msg).toMatch(/readings do not add up/);
    expect(r.rowsOrder).toEqual(['C_RITE', 'C_TONIGHT', 'C_STAGED']); // authored order, not ranked
    await page.screenshot({ path: 'test-results/review/case-review.png' });
    await expectClean(page, errors);
  });
});

test.describe('the hidden wheel pit', () => {
  test('no prompt and no hotspot at the entrance until Silas knows; the furrow\'s closer look reveals it', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'SAWMILL', phase: 'NIGHT' });
    await page.evaluate(() => { TWT.state.flags.foundSheriffBody = true; TWT.state.lanternOn = true; T.talkThrough(); T.walkTo(437); T.step(20); });
    const before = await page.evaluate(() => ({ prompt: TWT.prompt && TWT.prompt.label, doors: TWT.interactables().filter((o) => o.kind === 'door').map((o) => o.ref.id) }));
    expect(before.prompt).toBeNull();
    expect(before.doors).not.toContain('sm_pit');
    await page.evaluate(() => TWT_TEST.render());
    await page.screenshot({ path: 'test-results/review/pit-entrance-unknown.png' });
    await page.evaluate(() => { T.walkTo(494); T.press('KeyE'); T.talkThrough(); T.press('KeyE'); T.talkThrough(); });
    expect(await page.evaluate(() => TWT.state.flags.knowsWheelPit)).toBe(true);
    await page.evaluate(() => { T.walkTo(437); T.step(30); });
    const after = await page.evaluate(() => ({ prompt: TWT.prompt && TWT.prompt.label, bark: TWT.hud.barkMsg && TWT.hud.barkMsg.text }));
    expect(after.prompt).toBe('Climb down — Wheel pit');
    expect(after.bark).toMatch(/mouth of the race/);
    await page.evaluate(() => TWT_TEST.render());
    await page.screenshot({ path: 'test-results/review/pit-entrance-known.png' });
    await page.evaluate(() => { T.press('KeyE'); T.step(90); T.talkThrough(); T.walkTo(150); T.step(30); });
    expect((await info(page)).scene).toBe('WHEEL_PIT');
    await page.screenshot({ path: 'test-results/review/wheel-pit.png' });
    await expectClean(page, errors);
  });

  test('Mrs. Gable can tell him about the pit instead', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'PARLOR', phase: 'NIGHT' });
    await page.evaluate(() => { for (let i = 0; i < 200 && !TWT.dialogue.active; i++) TWT.update(1 / 60); });
    await page.evaluate(() => T.talkThrough([2, 4])); // "What is there at the mill, at this hour?", then "Go back to bed"
    const s = await page.evaluate(() => ({ k: TWT.state.flags.knowsWheelPit, ev: Object.keys(TWT.state.evidence) }));
    expect(s.k).toBe(true);
    expect(s.ev).toContain('T_GABLE_PIT');
    await expectClean(page, errors);
  });
});

test.describe('hints', () => {
  test('appear only after the stuck delay, only when asked, pause with the game and the tab, reset on progress', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'STATION', hintDelay: '6', hintFollowUp: '4' });
    const r = await page.evaluate(async () => {
      const { PauseMenu } = await import('/src/ui/menus.js');
      const g = TWT, h = g.hints, out = {};
      T.talkThrough(); T.step(60 * 5);
      out.early = h.available();
      T.press('KeyH', 2); out.earlyDialogue = g.dialogue.active;
      T.step(60 * 2); out.after7 = h.available(); out.unasked = g.dialogue.active; // available, but nothing is shown unasked
      const t0 = h.stuck;
      g.pushOverlay(new PauseMenu(g)); T.step(60 * 10); out.pausedGain = h.stuck - t0; g.popOverlay();
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      const t1 = h.stuck; T.step(60 * 10); out.hiddenGain = h.stuck - t1;
      delete document.hidden; Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      T.press('KeyH', 2); out.nudge = g.dialogue.active && g.dialogue.lastText; T.talkThrough();
      T.press('KeyH', 2); out.again = g.dialogue.active; T.step(30);
      T.step(60 * 5); out.follow = h.available();
      T.press('KeyH', 2); out.specific = g.dialogue.active && g.dialogue.lastText; T.talkThrough();
      T.walkTo(214); T.press('KeyE'); T.talkThrough([2]); T.step(240);
      out.newStep = h.stepId; out.resetStuck = h.stuck; out.resetAvail = h.available();
      return out;
    });
    expect(r.early).toBe(0);
    expect(r.earlyDialogue).toBe(false);
    expect(r.after7).toBe(1);
    expect(r.unasked).toBe(false);
    expect(r.pausedGain).toBe(0);
    expect(r.hiddenGain).toBe(0);
    expect(r.nudge).toMatch(/conductor/);
    expect(r.again).toBe(false); // the follow-up needs more stuck time first
    expect(r.follow).toBe(2);
    expect(r.specific).toMatch(/press E/);
    expect(r.newStep).toBe('H_FINCH');
    expect(r.resetStuck).toBeLessThan(6);
    expect(r.resetAvail).toBe(0);
    await expectClean(page, errors);
  });
});

test.describe('journal pages', () => {
  test('People: entries, details and portraits unlock as Silas learns', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'STATION' });
    const r = await page.evaluate(async () => {
      const { drawPortrait } = await import('/src/ui/notebook.js');
      const { PEOPLE } = await import('/src/data/notebookData.js');
      const g = TWT, s = g.state, ctx = document.createElement('canvas').getContext('2d');
      const seen = (id) => drawPortrait(ctx, PEOPLE.find((p) => p.id === id), s, 0, 0, 38, 38);
      const notes = (id) => PEOPLE.find((p) => p.id === id).notes.filter((n) => (n.if.evidence ? s.evidence[n.if.evidence] : true)).length;
      const out = { start: g.notebook.people(), finchSeen0: seen('FINCH'), haleSeen0: seen('HALE'), claraSeen: seen('CLARA') };
      s.flags.metFinch = true; s.flags.parlorEntered = true; s.flags.foundSheriffBody = true;
      s.evidence.T_GABLE_HALE = { observed: true, examined: true, n: 1 };
      out.later = g.notebook.people(); out.finchSeen1 = seen('FINCH'); out.haleSeen1 = seen('HALE'); out.gableSeen = seen('GABLE');
      g.openPanel('notebook'); g.notebook.tab = 6; g.notebook.sel = 0; TWT_TEST.render();
      return out;
    });
    expect(r.start).toEqual(['HALE', 'CLARA', 'FINCH', 'CONDUCTOR']);
    expect([r.finchSeen0, r.haleSeen0, r.claraSeen]).toEqual([false, false, false]);
    expect(r.later).toContain('GABLE');
    expect([r.finchSeen1, r.haleSeen1, r.gableSeen]).toEqual([true, true, true]);
    await page.screenshot({ path: 'test-results/review/people-hale.png' });
    await expectClean(page, errors);
  });

  test('Deductions page shows one question at a time; Mind map grows with each deduction', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'SAWMILL', phase: 'NIGHT' });
    const r = await page.evaluate(() => {
      const g = TWT, s = g.state, nb = g.notebook;
      Object.assign(s.flags, { foundSheriffBody: true, heardScream: true });
      for (const e of ['T_FINCH_HALE', 'SAWMILL_ROPE', 'SAWMILL_MARKS', 'SAWMILL_LEDGER', 'CREEK_TRACKS', 'HOTEL_REGISTER', 'T_GABLE_ROOM4']) s.evidence[e] = { observed: true, examined: true, n: 1 };
      s.evidence.SAWMILL_BODY = { observed: true, examined: true, n: 2 };
      s.evidence.HOTEL_ROOM4_BOARDS = { observed: true, examined: true, n: 3 };
      g.openPanel('notebook'); while (nb.tab !== 4) T.press('ArrowRight', 1);
      const out = { q: nb.q, rows: nb.listFor(4), map: [] };
      nb.tab = 5; out.map.push(nb.mapNodes().length); nb.tab = 4;
      for (const [a, b] of [['S_LITTLE_BLOOD', 'S_HOISTED'], ['S_MARKS', 'S_LEDGER'], ['S_SCREAM', 'S_TRACKS']]) { T.deduce(a, b); out.map.push(nb.mapNodes().length); }
      T.press('KeyQ', 1); out.q2 = nb.q; out.rows2 = nb.listFor(4);
      T.press('KeyQ', 1);
      while (nb.tab !== 5) T.press('ArrowRight', 1);
      const nodes = nb.mapNodes(); nb.sel = nodes.indexOf('S:S_HOISTED'); TWT_TEST.render();
      out.selected = nodes[nb.sel];
      return out;
    });
    expect(r.q).toBe('Q_HALE');
    expect(r.rows.filter((x) => x.startsWith('S:')).length).toBeLessThanOrEqual(12);
    expect(r.rows).not.toContain('S:S_BOARDS'); // Room 4's statements stay under their own question
    expect(r.map).toEqual([0, 3, 6, 9]);
    expect(r.q2).toBe('Q_ROOM4');
    expect(r.rows2).toContain('S:S_BOARDS');
    expect(r.selected).toBe('S:S_HOISTED');
    await page.screenshot({ path: 'test-results/review/mind-map.png' });
    await expectClean(page, errors);
  });
});

test.describe('saves', () => {
  test.setTimeout(120_000);
  test('reload mid-investigation restores discoveries, deductions, readings and the lantern', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'SAWMILL', phase: 'NIGHT' });
    await page.evaluate(() => {
      const g = TWT, s = g.state;
      Object.assign(s.flags, { foundSheriffBody: true, heardScream: true, introDone: true });
      T.talkThrough(); T.press('KeyF');
      T.walkTo(494); T.press('KeyE'); T.talkThrough(); T.press('KeyE'); T.talkThrough(); // furrow: closer look → knows the pit
      T.walkTo(350); T.press('KeyE'); T.talkThrough();
      T.walkTo(371); T.press('KeyE'); T.talkThrough();
      T.walkTo(437); T.press('KeyE'); T.step(90); T.talkThrough(); T.walkTo(144); T.press('KeyE'); T.talkThrough(); // into the pit
      s.evidence.SAWMILL_BODY = { observed: true, examined: false, n: 40 };
      g.openPanel('notebook'); while (g.notebook.tab !== 4) T.press('ArrowRight', 1);
      T.deduce('S_LITTLE_BLOOD', 'S_HOISTED');
      const rows = g.notebook.listFor(4); g.notebook.sel = rows.indexOf('D:D_SCENE_ARRANGED'); T.press('KeyE', 1); T.press('KeyE', 1); // MOVED
      T.press('Escape'); T.step(10); g.checkpoint();
    });
    const saved = await page.evaluate(() => ({ scene: TWT.scene.id, d: TWT.state.deductions, r: TWT.state.readings, pit: !!TWT.state.evidence.PIT_HOLLOW, k: TWT.state.flags.knowsWheelPit, lantern: TWT.state.lanternOn }));
    expect(saved).toEqual({ scene: 'WHEEL_PIT', d: ['D_SCENE_ARRANGED'], r: { D_SCENE_ARRANGED: 'MOVED' }, pit: true, k: true, lantern: true });
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.evaluate(async () => { (await import('/tools/harness.js')).install(); TWT.continueGame(); T.step(80); });
    const loaded = await page.evaluate(() => ({ scene: TWT.scene.id, d: TWT.state.deductions, r: TWT.state.readings, pit: !!TWT.state.evidence.PIT_HOLLOW, k: TWT.state.flags.knowsWheelPit, lantern: TWT.state.lanternOn, shown: TWT.player.lanternShown(TWT.state.lanternOn), light: TWT.collectLights(TWT.camera.ix).some((l) => l.warm === 0.3) }));
    expect(loaded).toEqual({ ...saved, shown: true, light: true });
    // shutter it, reload: it comes back shuttered, not in his hand, casting nothing
    await page.evaluate(() => { T.press('KeyF'); T.step(5); });
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.evaluate(async () => { (await import('/tools/harness.js')).install(); TWT.continueGame(); T.step(80); });
    const off = await page.evaluate(() => ({ lantern: TWT.state.lanternOn, shown: TWT.player.lanternShown(TWT.state.lanternOn), light: TWT.collectLights(TWT.camera.ix).some((l) => l.warm === 0.3) }));
    expect(off).toEqual({ lantern: false, shown: false, light: false });
    await expectClean(page, errors);
  });

  for (const name of ['parlor', 'creek', 'sawmill']) {
    test(`a save from the previous build (${name}) loads and plays on`, async ({ page }) => {
      const { errors } = await boot(page, { test: '1' });
      await page.evaluate(([k, v]) => localStorage.setItem(k, v), [SAVE_KEY, fixture(name)]);
      await page.reload();
      await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
      await page.evaluate(async () => { (await import('/tools/harness.js')).install(); TWT.continueGame(); T.step(90); });
      const old = JSON.parse(fixture(name)).state;
      const s = await page.evaluate(() => ({ scene: TWT.scene.id, d: TWT.state.deductions, readings: TWT.state.readings, cases: TWT.state.cases, ev: Object.keys(TWT.state.evidence).length, lantern: TWT.state.lanternOn, k: !!TWT.state.flags.knowsWheelPit }));
      expect(s.scene).toBe(old.scene);
      expect(s.ev).toBe(Object.keys(old.evidence).length);
      expect(s.d).toEqual(old.deductions);
      expect(s.readings).toEqual({});
      expect(s.cases).toEqual({});
      expect(s.lantern).toBe(old.lanternOn);
      expect(s.k).toBe(!!(old.evidence.SAWMILL_DRAG && old.evidence.SAWMILL_DRAG.examined)); // what the old closer look taught
      if (name === 'sawmill') {
        // carry the old investigation through to a commitment and its aftermath
        const end = await page.evaluate(() => {
          const g = TWT; g.openPanel('notebook'); while (g.notebook.tab !== 4) T.press('ArrowRight', 1);
          for (const [a, b] of [['S_OLD_BLOOD', 'S_MISSING'], ['S_MARKS', 'S_LEDGER'], ['S_SCREAM', 'S_TRACKS']]) T.deduce(a, b);
          T.press('Escape'); T.walkTo(6); T.hold('KeyA', 20); T.step(20); T.talkThrough([0]); T.decide('C_TONIGHT');
          if (g.overlay) T.press('Escape', 2);
          for (let i = 0; i < 600 && !g.dialogue.active; i++) g.update(1 / 60);
          const aftermath = g.dialogue.id; T.talkThrough([], 4000); T.step(60);
          return { aftermath, end: g.overlay && g.overlay.constructor.name, c: g.state.cases.HALE && g.state.cases.HALE.conclusion };
        });
        expect(end).toEqual({ aftermath: 'AFTER_TONIGHT', end: 'EndCard', c: 'C_TONIGHT' });
      }
      await expectClean(page, errors);
    });
  }
});

test.describe('lantern, dialogue, sign, sky', () => {
  test('the lantern is in his hand only while lit, through walking and scene changes', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'ROAD' });
    const r = await page.evaluate(() => {
      const g = TWT, lit = () => ({ on: g.state.lanternOn, shown: g.player.lanternShown(g.state.lanternOn), light: g.collectLights(g.camera.ix).some((l) => l.warm === 0.3) });
      T.talkThrough();
      const out = { off: lit() };
      T.press('KeyF'); out.on = lit();
      T.hold('KeyD', 60); out.walking = { ...lit(), moving: Math.abs(g.player.vx) > 4 };
      T.walkTo(796); T.hold('KeyD', 20); T.step(70); out.scene = g.scene.id; out.afterTransition = lit();
      T.press('KeyF'); T.hold('KeyA', 40); out.offWalking = lit();
      return out;
    });
    expect(r.off).toEqual({ on: false, shown: false, light: false });
    expect(r.on).toEqual({ on: true, shown: true, light: true });
    expect(r.walking).toEqual({ on: true, shown: true, light: true, moving: true });
    expect(r.scene).toBe('VILLAGE');
    expect(r.afterTransition).toEqual({ on: true, shown: true, light: true });
    expect(r.offWalking).toEqual({ on: false, shown: false, light: false });
    await expectClean(page, errors);
  });

  test('Silas\'s spoken lines carry his name and a distinct tint through a multi-speaker exchange', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'VILLAGE' });
    // walk the exchange node by node; stop (fully revealed) on Silas's line for the review screenshot, then go on
    const walk = (stopOnSilas) => page.evaluate(async (stop) => {
      const { SPEAKER_STYLE } = await import('/src/ui/dialogueView.js');
      const { SPEAKERS } = await import('/src/data/dialogue.js');
      const g = TWT, out = window.__seq || (window.__seq = []);
      if (!g.dialogue.active && !out.length) { T.talkThrough(); T.walkTo(330); for (let i = 0; i < 400 && !g.dialogue.active; i++) g.update(1 / 60); }
      for (let i = 0; i < 3000 && g.dialogue.active && out.length < 3; i++) {
        const key = g.dialogue.nodeId;
        if (key !== window.__last) {
          window.__last = key; const w = g.dialogue.lastWho;
          out.push({ who: w, tag: SPEAKERS[w], col: w === 'note' ? 'note' : (SPEAKER_STYLE[w] || SPEAKER_STYLE.default).text });
          if (stop && w === 'silas') { g.dialogueView.shown = 1e9; g.dialogueView.t = 0.5; TWT_TEST.render(); return out; }
        }
        if (i % 4 === 0) g.input.pressedCodes.add('KeyE');
        g.update(1 / 60);
      }
      return out;
    }, stopOnSilas);
    await walk(true);
    await page.screenshot({ path: 'test-results/review/dialogue-silas-line.png' });
    const seq = await walk(false);
    expect(seq.map((x) => x.who)).toEqual(['finch', 'silas', 'finch']);
    expect(seq.map((x) => x.tag)).toEqual(['CONSTABLE FINCH', 'SILAS VANCE', 'CONSTABLE FINCH']);
    expect(seq[1].col).not.toBe(seq[0].col);
    await expectClean(page, errors);
  });

  test('the Road sign reads CROW\'S HOLLOW in full', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'ROAD' });
    const tiles = await page.evaluate(async () => {
      const map = await (await fetch('/assets/levels/road_to_crows_hollow.tmj')).json();
      const ids = await (await fetch('/tools/data/wilderness_tiles.json')).json();
      const inv = Object.fromEntries(Object.entries(ids).map(([k, v]) => [v + 1, k]));
      const l = map.layers.find((x) => x.name === 'props_behind');
      return l.data.map((g) => inv[g & 0x0fffffff]).filter((n) => n && n.startsWith('sign_crow'));
    });
    expect(tiles.length).toBe(24);
    expect(tiles.every((n) => n.startsWith('sign_crow_wide_'))).toBe(true);
    await page.evaluate(() => { T.talkThrough(); T.press('KeyF'); T.walkTo(150); T.step(30); });
    await page.screenshot({ path: 'test-results/review/road-sign.png' });
    await expectClean(page, errors);
  });

  test('night skies are a deep blue; silhouettes stay darker than the sky; evening unchanged', async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 540 });
    const { errors } = await boot(page, { test: '1', scene: 'CREEK', phase: 'NIGHT' });
    const px = (x, y) => page.evaluate(([a, b]) => [...TWT.display.fbCtx.getImageData(a, b, 1, 1).data].slice(0, 3), [x, y]);
    await page.evaluate(() => { T.talkThrough(); T.walkTo(200); T.step(10); });
    const sky = await px(480, 30);
    const ridge = await px(480, 330); // the far range, below the skyline
    expect(sky[2]).toBeGreaterThan(sky[0] * 2);
    expect(sky[2]).toBeGreaterThanOrEqual(30);
    expect(ridge.reduce((a, b) => a + b, 0)).toBeLessThan(sky.reduce((a, b) => a + b, 0));
    await page.evaluate(() => { TWT.startAt('ROAD', { phase: 'EVENING' }); T.talkThrough(); T.step(10); });
    const evening = await px(480, 30);
    expect(evening[2]).toBeLessThan(30);
    await expectClean(page, errors);
  });
});
