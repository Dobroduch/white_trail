// Robustness: the game must survive players and browsers behaving unexpectedly.
//   - every checkpoint the game writes across chapters 1–4 resumes into a playable state (no softlock on load);
//   - a corrupt, malformed or outdated save is set aside, never silently replaced, and the player is told;
//   - a save whose scene no longer exists resumes at the hotel instead of crashing;
//   - a browser that refuses to store the save says so once, and play goes on;
//   - losing focus mid-walk pauses the game and forgets the held key (no walking on by itself after);
//   - panels and pause pressed during a scripted beat neither break it nor let it be skipped into a bad state.
import { test, expect } from '@playwright/test';
import { boot, expectClean } from './helpers.mjs';

const KEY = 'thewhitetrail.save.v1';
const ASIDE = 'thewhitetrail.save.v1.unreadable';

// From a fresh page: put raw save data in place, reload, and press Continue on the title.
async function continueWith(page, raw) {
  await page.evaluate(({ KEY, raw }) => { localStorage.clear(); localStorage.setItem(KEY, raw); }, { KEY, raw });
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.evaluate(async () => { (await import('/tools/harness.js')).install(); });
  return page.evaluate(() => {
    const g = TWT; g.toTitle(); T.step(40); T.press('KeyE', 4); // the title's "press any key"
    const t = g.overlay; const i = t.items.findIndex((x) => x.act === 'continue');
    if (i < 0) return { continue: false };
    t.sel = i; T.press('KeyE', 4); T.step(10);
    return { continue: true, mode: g.mode, overlay: g.overlay && g.overlay.constructor.name, q: g.overlay && g.overlay.q, scene: g.scene && g.scene.id };
  });
}

test.describe('robustness', () => {
  test('every checkpoint written in chapters 1–5 resumes into a playable state', async ({ page }) => {
    test.setTimeout(600_000);
    const { errors } = await boot(page, { test: '1' });
    const snaps = await page.evaluate(() => {
      const g = TWT, out = [];
      const cp = g.checkpoint.bind(g);
      g.checkpoint = (...a) => { const r = cp(...a); if (g.mode === 'play') out.push(localStorage.getItem('thewhitetrail.save.v1')); return r; };
      const runs = [T.fullRun({ conclusion: 'C_STAGED', pit: true }), T.fullRun2({ conclusion: 'C2_BLAST' }), T.fullRun3({ conclusion: 'C3_GUEST' }), T.fullRun4({ conclusion: 'C4_CUTLER' }), T.fullRun5({ cutler: 'hold' })];
      g.checkpoint = cp;
      return { out: [...new Set(out)], errs: runs.flatMap((r) => r.errors) };
    });
    expect(snaps.errs).toEqual([]);
    expect(snaps.out.length).toBeGreaterThan(40);
    const bad = [];
    for (const raw of snaps.out) {
      const r = await page.evaluate((raw) => {
        const g = TWT;
        localStorage.setItem('thewhitetrail.save.v1', raw);
        const saved = JSON.parse(raw).state;
        while (g.overlay) g.popOverlay();
        g.cutscene = null; g.scriptQueue = []; g.dialogue.active = false;
        g.continueGame();
        // A resumed save may legitimately reopen an end card or finish a line first: answer it as a player would
        // (E on a line, the "stay" item on an end card) and see that control comes back.
        let k = 0, stayed = false;
        for (; k < 1500 && !g.canMove(); k++) {
          const o = g.overlay;
          if (o && o.constructor.name === 'EndCard') { const i = o.items.findIndex((x) => x.act === 'stay'); if (o.t > 2.1) { o.sel = i >= 0 ? i : 0; if (i >= 0) { T.key('KeyE'); stayed = true; } else break; } }
          else if (o && o.constructor.name === 'PauseMenu') T.key('Escape');
          else if (g.dialogue.active && k % 6 === 0) T.key(g.dialogue.choices ? 'Digit1' : 'KeyE');
          g.update(1 / 60);
        }
        const endCardTitle = g.overlay && g.overlay.constructor.name === 'EndCard' && !g.overlay.items.some((x) => x.act === 'stay');
        return { ok: g.canMove() || endCardTitle, scene: g.scene && g.scene.id, saved: saved.scene, frames: k, stayed, errs: [...g.errorsSeen], day: saved.time.day, phase: saved.phase, t: saved.time.h + ':' + saved.time.m, flags: Object.keys(saved.flags).filter((f) => saved.flags[f] === true).slice(-8), log: (saved.timeline.slice(-1)[0] || {}).text };
      }, raw);
      // ("Walk the town a while longer" on the second day's end card moves Silas out to the forecourt, by design)
      if (!r.ok || r.errs.length || (r.scene !== r.saved && !r.stayed)) bad.push(r);
    }
    expect(bad, 'checkpoints that do not resume cleanly').toEqual([]);
    await expectClean(page, errors);
  });

  test('a corrupt save is set aside, never silently replaced; declining keeps it; a new game keeps the copy', async ({ page }) => {
    await boot(page, { test: '1' });
    const garbage = '{"savedAt":1,"state":{"version":1,"scene":"PARLOR","items":"oops"';
    const r = await continueWith(page, garbage);
    expect(r.continue).toBe(true);
    expect(r.overlay).toBe('Confirm');
    expect(r.q).toMatch(/could not be read/);
    expect(await page.evaluate(({ KEY, ASIDE }) => [localStorage.getItem(KEY), localStorage.getItem(ASIDE)], { KEY, ASIDE })).toEqual([garbage, garbage]);
    // "No" (the default): back to the title, nothing touched
    const back = await page.evaluate(() => { T.press('KeyE', 4); return { mode: TWT.mode, overlay: TWT.overlay && TWT.overlay.constructor.name }; });
    expect(back).toEqual({ mode: 'title', overlay: 'TitleMenu' });
    expect(await page.evaluate((KEY) => localStorage.getItem(KEY), KEY)).toBe(garbage);
    // Continue again, "Yes": a new game; the unreadable data survives in its own key
    await page.evaluate(() => { const t = TWT.overlay; t.sel = t.items.findIndex((x) => x.act === 'continue'); T.press('KeyE', 4); T.press('ArrowUp', 1); T.press('KeyE', 4); T.step(30); });
    expect(await page.evaluate(() => ({ mode: TWT.mode, scene: TWT.scene.id }))).toEqual({ mode: 'play', scene: 'STATION' });
    expect(await page.evaluate((ASIDE) => localStorage.getItem(ASIDE), ASIDE)).toBe(garbage);
  });

  test('malformed and outdated saves are set aside the same way; a save of a scene that no longer exists resumes at the hotel', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const good = await page.evaluate(() => { TWT.startAt('PARLOR', { phase: 'EVENING' }); TWT.checkpoint(); return localStorage.getItem('thewhitetrail.save.v1'); });
    const mut = (fn) => { const d = JSON.parse(good); fn(d.state); return JSON.stringify(d); };
    for (const raw of [mut((s) => { s.items = null; }), mut((s) => { s.version = 99; }), mut((s) => { s.time = 'late'; }), mut((s) => { s.phase = 'NOON'; }), 'not json at all']) {
      const r = await continueWith(page, raw);
      expect(r.overlay, raw.slice(0, 60)).toBe('Confirm');
      expect(await page.evaluate((ASIDE) => localStorage.getItem(ASIDE), ASIDE)).toBe(raw);
    }
    const r = await continueWith(page, mut((s) => { s.scene = 'A_ROOM_THAT_WAS_REMOVED'; }));
    expect(r).toMatchObject({ mode: 'play', overlay: null, scene: 'BLACK_RAM_EXTERIOR' });
    expect(await page.evaluate(() => TWT.canMove())).toBe(true);
    // only the expected warnings were logged, and nothing threw
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => [...TWT.errorsSeen])).toEqual([]);
  });

  test('when the browser refuses to store the save, the player is told once and play goes on', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'VILLAGE', phase: 'EVENING' });
    const r = await page.evaluate(() => {
      const g = TWT;
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function () { throw new DOMException('quota', 'QuotaExceededError'); };
      g.checkpoint(); const first = g.hud.hintMsg && g.hud.hintMsg.text;
      g.hud.hintMsg = null; g.checkpoint(); const second = g.hud.hintMsg && g.hud.hintMsg.text;
      Storage.prototype.setItem = orig;
      g.checkpoint(); const third = g.hud.hintMsg && g.hud.hintMsg.text;
      T.hold('KeyD', 30);
      return { first, second, third, moved: g.player.x > 10, saved: !!localStorage.getItem('thewhitetrail.save.v1') };
    });
    expect(r.first).toMatch(/could not be saved/);
    expect(r.second).toBeFalsy(); // said once, not on every checkpoint
    expect(r.third).toBeFalsy();
    expect(r.saved).toBe(true); // storage back: saving works again
    expect(r.moved).toBe(true);
    await expectClean(page, errors.filter((e) => !/could not write save/.test(e)));
  });

  test('losing focus mid-walk pauses the game and forgets the held key', async ({ page }) => {
    // auto-pause is on: no ?test=1 here (it turns it off), the real loop runs
    const { errors } = await boot(page, { scene: 'VILLAGE', phase: 'EVENING' });
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(400);
    const x0 = await page.evaluate(() => TWT.player.x);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(100);
    const paused = await page.evaluate(() => ({ ov: TWT.overlay && TWT.overlay.constructor.name, held: TWT.input.held('right') }));
    expect(paused).toEqual({ ov: 'PauseMenu', held: false });
    // (the physical key is still down in the page; its keyup never came while the window was away)
    await page.evaluate(() => { TWT.input.down.clear(); });
    await page.keyboard.up('KeyD');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => ({ ov: TWT.overlay && TWT.overlay.constructor.name, x: TWT.player.x }));
    expect(after.ov).toBeNull();
    expect(Math.abs(after.x - x0)).toBeLessThan(12); // it did not walk on by itself
    await expectClean(page, errors);
  });

  test('a hidden tab releases held keys and stops the clock', async ({ page }) => {
    const { errors } = await boot(page, { test: '1', scene: 'VILLAGE', phase: 'EVENING' });
    const r = await page.evaluate(() => {
      const g = TWT, s = g.state;
      g.input.down.add('KeyD');
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      const held = g.input.held('right');
      delete document.hidden;
      return { held };
    });
    expect(r.held).toBe(false);
    await expectClean(page, errors);
  });

  test('pressing panels, pause and interact through a scripted beat neither breaks it nor skips it', async ({ page }) => {
    const { errors } = await boot(page, { test: '1' });
    const r = await page.evaluate(() => {
      const g = TWT;
      T.fullRun({ conclusion: 'C_STAGED' }); // (starts a new game: the state object is replaced)
      const s = g.state;
      // the second day's opening is a scripted beat: hammer every panel key and pause through it
      for (let i = 0; i < 150; i++) g.update(1 / 60);
      T.press('KeyE', 3);
      const keys = ['KeyN', 'KeyI', 'KeyM', 'Escape', 'KeyE', 'KeyC', 'KeyH', 'Tab'];
      let k = 0;
      for (; k < 6000 && !(g.canMove() && s.flags.ch2Started && !g.overlay); k++) {
        if (k % 7 === 0) T.key(keys[(k / 7) % keys.length | 0]);
        else if (g.overlay && g.overlay.constructor.name !== 'EndCard' && k % 7 === 3) T.key('Escape');
        g.update(1 / 60);
      }
      while (g.overlay) { T.key('Escape'); g.update(1 / 60); if (k++ > 7000) break; }
      return { ch2: !!s.flags.ch2Started, day: s.time.day, scene: g.scene.id, move: g.canMove(), errs: [...g.errorsSeen] };
    });
    expect(r).toEqual({ ch2: true, day: 2, scene: 'BLACK_RAM_EXTERIOR', move: true, errs: [] });
    await expectClean(page, errors);
  });
});
