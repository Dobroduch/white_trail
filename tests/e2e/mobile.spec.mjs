// Mobile browsers in landscape, touch only. Runs in the three mobile projects of playwright.config.mjs (a small
// Android phone 640×360, a large Android phone 915×412, an iPhone-sized 844×390), with device emulation: real
// viewport, device pixel ratio, isMobile and touch events. Taps and holds go through Playwright's touchscreen
// (CDP touch events) or, for whole playthroughs, through tools/harness.js in touch mode, which presses the
// VISIBLE on-screen buttons with real pointer events and fails on any action that has no touch control.
// Emulation is not a physical device: what it cannot prove is listed in docs/TESTING.md.
import { test, expect } from '@playwright/test';
import { boot, step, expectClean } from './helpers.mjs';

const SAVE_KEY = 'thewhitetrail.save.v1';
// dpr: '0' lets the game use the emulated device pixel ratio (the helper defaults to a forced 1)
const mboot = (page, params = {}) => boot(page, { dpr: '0', test: '1', ...params });

// Visible touch buttons with their on-page boxes.
const buttons = (page) => page.evaluate(() => [...document.querySelectorAll('#touch .tc.on button')]
  .filter((b) => b.offsetParent && b.style.display !== 'none')
  .map((b) => { const r = b.getBoundingClientRect(); return { code: b.dataset.code, label: b.getAttribute('aria-label'), x: r.x, y: r.y, w: r.width, h: r.height }; }));
const box = async (page, sel) => { const r = await page.locator(sel).first().boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
const tap = async (page, sel, frames = 4) => { const p = await box(page, sel); await page.touchscreen.tap(p.x, p.y); await step(page, frames); };
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
// Silas's on-page box (CSS px), from his world position through the same projection the game uses.
const silasBox = (page) => page.evaluate(() => {
  const g = TWT, c = g.display.canvas, r = c.getBoundingClientRect(), k = r.width / c.width;
  const { UI_OX: ox, UI_OY: oy, UI_DEV: s } = window.__disp;
  const top = g.worldToUI(g.player.x - 6, g.player.y - 34), bot = g.worldToUI(g.player.x + 6, g.player.y);
  return { x: r.left + (top.x + ox) * s * k, y: r.top + (top.y + oy) * s * k, w: (bot.x - top.x) * s * k, h: (bot.y - top.y) * s * k };
});
const exposeDisplay = (page) => page.evaluate(async () => {
  const D = await import('/src/engine/display.js');
  Object.defineProperty(window, '__disp', { configurable: true, get: () => ({ UI_OX: D.UI_OX, UI_OY: D.UI_OY, UI_DEV: D.UI_DEV, NATIVE_W: D.NATIVE_W, NATIVE_H: D.NATIVE_H }) });
});
// Hold a finger on an element with raw CDP touch events (several fingers: several ids).
async function fingers(page) {
  const cdp = await page.context().newCDPSession(page);
  const down = new Map();
  // CDP diffs each event's point list against the previous one: a new id is a finger down, a missing id a finger up.
  const send = (type) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [...down.values()] });
  return {
    async press(id, sel) { const p = await box(page, sel); down.set(id, { x: p.x, y: p.y, id }); await send('touchStart'); },
    async lift(id) { down.delete(id); await send(down.size ? 'touchMove' : 'touchEnd'); },
  };
}

test.describe('mobile landscape, touch only', () => {
  test('fits the screen in landscape; touch controls are on, large enough, and clear of Silas and the dialogue', async ({ page }) => {
    const { errors } = await mboot(page, { scene: 'BLACK_RAM_EXTERIOR' });
    await exposeDisplay(page);
    await step(page, 2);
    await page.evaluate(() => T.walkTo(250));
    const vp = page.viewportSize();
    const s = await page.evaluate(() => {
      const c = TWT.display.canvas, r = c.getBoundingClientRect();
      return { touch: document.documentElement.classList.contains('touch'), ctx: document.documentElement.dataset.tc, css: r.toJSON(), out: { w: c.width, h: c.height }, d: window.__disp,
        scroll: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight };
    });
    expect(s.touch).toBe(true);
    expect(s.ctx).toBe('world');
    expect(s.scroll).toBe(false);
    // native height and aspect: never stretched, the limiting dimension filled
    expect(s.d.NATIVE_H).toBe(270);
    expect(Math.abs(s.out.w / s.out.h - s.d.NATIVE_W / 270)).toBeLessThan(0.02);
    expect(Math.max(s.css.width / vp.width, s.css.height / vp.height)).toBeGreaterThan(0.95);
    expect(s.css.x).toBeGreaterThanOrEqual(-0.5);
    expect(s.css.x + s.css.width).toBeLessThanOrEqual(vp.width + 0.5);
    const bs = await buttons(page);
    const codes = bs.map((b) => b.code).sort();
    for (const c of ['ArrowLeft', 'ArrowRight', 'KeyE', 'KeyF', 'KeyH', 'KeyN', 'KeyI', 'KeyM', 'Escape']) expect(codes, c).toContain(c);
    for (const b of bs) {
      expect(Math.min(b.w, b.h), `${b.label} is a comfortable target`).toBeGreaterThanOrEqual(44);
      expect(b.x).toBeGreaterThanOrEqual(s.css.x - 0.5);
      expect(b.y).toBeGreaterThanOrEqual(s.css.y - 0.5);
      expect(b.x + b.w).toBeLessThanOrEqual(s.css.x + s.css.width + 0.5);
      expect(b.y + b.h).toBeLessThanOrEqual(s.css.y + s.css.height + 0.5);
    }
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) expect(overlap(bs[i], bs[j]), `${bs[i].label} / ${bs[j].label} overlap`).toBe(false);
    const sb = await silasBox(page);
    for (const b of bs) expect(overlap(sb, b), `${b.label} covers Silas`).toBe(false);
    // in conversation: only the pause button, and it stays off the dialogue box (anchored at the top)
    await page.evaluate(() => { TWT.dialogue.startLines(['A line long enough to fill the dialogue box from one side of the frame to the other, so its box is as wide as it gets.']); T.step(30); });
    expect(await page.evaluate(() => document.documentElement.dataset.tc)).toBe('dialogue');
    const db = await page.evaluate(() => { const c = TWT.display.canvas, r = c.getBoundingClientRect(), k = r.width / c.width; const { UI_OX: ox, UI_OY: oy, UI_DEV: sc } = window.__disp; return { x: r.left + (12 + ox) * sc * k, y: r.top + (12 + oy) * sc * k, w: 296 * sc * k, h: 30 * sc * k }; });
    for (const b of await buttons(page)) { expect(b.code).toBe('Escape'); expect(overlap(db, b)).toBe(false); }
    await expectClean(page, errors);
  });

  test('portrait shows the rotate prompt and suspends play; landscape resumes with the state intact', async ({ page }) => {
    const { errors } = await mboot(page, { scene: 'VILLAGE' });
    await step(page, 2);
    await page.evaluate(() => { T.walkTo(120); T.step(40); TWT.state.lanternOn = true; TWT.checkpoint(); });
    const before = await page.evaluate(() => ({ x: TWT.player.x, t: { ...TWT.state.time }, scene: TWT.scene.id, ev: Object.keys(TWT.state.evidence).length, lantern: TWT.state.lanternOn }));
    const vp = page.viewportSize();
    await page.setViewportSize({ width: vp.height, height: vp.width }); // turn the phone upright
    await step(page, 2);
    expect(await page.locator('#rotate').isVisible()).toBe(true);
    expect(await page.evaluate(() => TWT.suspended)).toBe(true);
    // nothing advances behind the prompt, even with a walk key held
    await page.evaluate(() => { TWT.input.virtualDown('ArrowRight'); T.step(90); TWT.input.virtualUp('ArrowRight'); T.step(2); });
    const during = await page.evaluate(() => ({ x: TWT.player.x, t: { ...TWT.state.time } }));
    expect(during).toEqual({ x: before.x, t: before.t });
    await page.setViewportSize(vp); // and back to landscape
    await step(page, 3);
    expect(await page.locator('#rotate').isVisible()).toBe(false);
    expect(await page.evaluate(() => TWT.suspended)).toBe(false);
    const after = await page.evaluate(() => ({ x: TWT.player.x, t: { ...TWT.state.time }, scene: TWT.scene.id, ev: Object.keys(TWT.state.evidence).length, lantern: TWT.state.lanternOn }));
    expect(after).toEqual(before);
    // the controls were laid out again for the landscape frame and still work
    const c = await page.evaluate(() => TWT.display.canvas.getBoundingClientRect().toJSON());
    for (const b of await buttons(page)) expect(b.x + b.w).toBeLessThanOrEqual(c.x + c.width + 0.5);
    const f = await fingers(page);
    await f.press(1, '#touch .tc-move button[data-code="ArrowRight"]');
    await step(page, 30);
    await f.lift(1);
    await step(page, 2);
    expect(await page.evaluate(() => TWT.player.x)).toBeGreaterThan(before.x + 10);
    await expectClean(page, errors);
  });

  test('walking: hold to move, stop on release, and a second finger works while walking', async ({ page }) => {
    const { errors } = await mboot(page, { scene: 'ROAD', phase: 'EVENING' });
    await step(page, 2);
    const x0 = await page.evaluate(() => TWT.player.x);
    const f = await fingers(page);
    await f.press(1, '#touch .tc-move button[data-code="ArrowRight"]');
    await step(page, 40);
    const x1 = await page.evaluate(() => TWT.player.x);
    expect(x1).toBeGreaterThan(x0 + 15);
    // second finger: the lantern, without letting go of ▶
    const lit = await page.evaluate(() => TWT.state.lanternOn);
    await f.press(2, '#touch .tc-act button[data-code="KeyF"]');
    await step(page, 3);
    await f.lift(2);
    await step(page, 20);
    expect(await page.evaluate(() => TWT.state.lanternOn)).toBe(!lit);
    const x2 = await page.evaluate(() => TWT.player.x);
    expect(x2).toBeGreaterThan(x1 + 5); // still walking
    await f.lift(1);
    await step(page, 15); // the same short ease-out as the keyboard
    const x3 = await page.evaluate(() => TWT.player.x);
    await step(page, 30);
    expect(await page.evaluate(() => TWT.player.x)).toBeCloseTo(x3, 1); // stopped
    // walking left with the other pad
    await f.press(3, '#touch .tc-move button[data-code="ArrowLeft"]');
    await step(page, 30);
    await f.lift(3);
    expect(await page.evaluate(() => TWT.player.x)).toBeLessThan(x3 - 10);
    await expectClean(page, errors);
  });

  test('talk, choose by tapping, examine a clue, and use the Notebook, Inventory and Map buttons', async ({ page }) => {
    const { errors } = await mboot(page, { scene: 'VILLAGE' });
    await exposeDisplay(page);
    await step(page, 2);
    await page.evaluate(() => T.useTouch(true));
    // Finch meets Silas on the street: tap through, then tap the first choice on screen
    await page.evaluate(() => T.walkTo(300));
    for (let i = 0; i < 40; i++) {
      const st = await page.evaluate(() => ({ choices: !!TWT.dialogue.choices && TWT.dialogueView.shown >= (TWT.dialogue.lastText || '').length, active: TWT.dialogue.active }));
      if (st.choices) break;
      if (st.active) await page.touchscreen.tap(...(await page.evaluate(() => { const p = T.uiToClient(160, 30); return [p.x, p.y]; })));
      await step(page, 20);
    }
    const choice = await page.evaluate(() => { const r = TWT.dialogueView.choiceRects[0]; const p = T.uiToClient(r.x + r.w / 2, r.y + r.h / 2); return { p: [p.x, p.y], h: r.h * window.__disp.UI_DEV * TWT.display.canvas.getBoundingClientRect().width / TWT.display.canvas.width, text: TWT.dialogue.choices[0].text }; });
    expect(choice.h, 'choice rows are finger-sized').toBeGreaterThanOrEqual(20);
    expect(await page.evaluate(() => document.documentElement.dataset.tc)).toBe('choice');
    await page.touchscreen.tap(...choice.p);
    await step(page, 10);
    expect(await page.evaluate((t) => Object.keys(TWT.state.seen).length > 0 && (TWT.dialogue.lastText || '') !== '' , choice.text)).toBe(true);
    const rep = await page.evaluate(() => { T.talkThrough([0, 0, 0, 0, 3]); return T.info(); });
    expect(rep.dlg).toBeNull();
    expect(await page.evaluate(() => TWT.state.flags.metFinch)).toBe(true);
    await page.evaluate(() => T.useTouch(false));
    // the act button is labelled with what it will do; tapping it examines the clue
    await page.evaluate(() => T.walkTo(160));
    await step(page, 2);
    const label = await page.locator('#touch .tc-act button.act .lbl').textContent();
    const prompt = await page.evaluate(() => TWT.prompt && TWT.prompt.label);
    if (prompt) {
      expect(prompt.startsWith(label)).toBe(true);
      const n0 = await page.evaluate(() => Object.keys(TWT.state.looked).length);
      await tap(page, '#touch .tc-act button.act');
      expect(await page.evaluate(() => TWT.dialogue.active)).toBe(true);
      await page.evaluate(() => T.talkThrough());
      expect(await page.evaluate(() => Object.keys(TWT.state.looked).length)).toBeGreaterThan(n0);
    }
    // Notebook: open, tap a tab on the page itself, close with Back
    await tap(page, '#touch .tc-panels button[data-code="KeyN"]');
    expect(await page.evaluate(() => TWT.overlay && TWT.overlay.panelKind)).toBe('notebook');
    const tabRect = await page.evaluate(() => { const r = TWT.notebook.tabRects[6]; const p = T.uiToClient(r.x + r.w / 2, r.y + r.h / 2); return [p.x, p.y]; });
    await page.touchscreen.tap(...tabRect);
    await step(page, 3);
    expect(await page.evaluate(() => TWT.notebook.tabName())).toBe('PEOPLE');
    // the panel bar scrolls with ▲ ▼ (there is no D-pad over the page)
    expect(await page.locator('#touch .tc-dpad').isVisible()).toBe(false);
    await tap(page, '#touch .tc-updown button[data-code="ArrowDown"]');
    expect(await page.evaluate(() => TWT.notebook.sel)).toBe(1);
    // switch straight to the Inventory and the Map with their buttons, then close with Back
    await tap(page, '#touch .tc-panels button[data-code="KeyI"]');
    expect(await page.evaluate(() => TWT.overlay.panelKind)).toBe('inventory');
    await tap(page, '#touch .tc-panels button[data-code="KeyM"]');
    expect(await page.evaluate(() => TWT.overlay.panelKind)).toBe('map');
    await tap(page, '#touch .tc-backonly button[data-code="Escape"]');
    expect(await page.evaluate(() => TWT.overlay)).toBeNull();
    // pause menu: open with ≡, tap a line (Resume)
    await tap(page, '#touch .tc-sysTop button');
    expect(await page.evaluate(() => TWT.overlay && TWT.overlay.constructor.name)).toBe('PauseMenu');
    const resume = await page.evaluate(() => { const r = TWT.overlay.rects[0]; const p = T.uiToClient(r.x + r.w / 2, r.y + r.h / 2); return [p.x, p.y]; });
    await page.touchscreen.tap(...resume);
    await step(page, 3);
    expect(await page.evaluate(() => TWT.overlay)).toBeNull();
    // scene transition by walking off the edge
    await page.evaluate(() => { T.useTouch(true); T.walkTo(476); T.hold('KeyD', 20); T.step(70); });
    expect(await page.evaluate(() => TWT.scene.id)).toBe('BLACK_RAM_EXTERIOR');
    expect(await page.evaluate(() => T.touchMisses)).toEqual([]);
    await expectClean(page, errors);
  });

  test('new game from the title by touch, save, reload, Continue by touch', async ({ page }) => {
    const { errors } = await mboot(page);
    await page.evaluate(() => localStorage.removeItem('thewhitetrail.save.v1'));
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.evaluate(async () => (await import('/tools/harness.js')).install());
    await exposeDisplay(page);
    await step(page, 40);
    await page.touchscreen.tap(200, 150); // "Tap to begin"
    await step(page, 10);
    const newGame = await page.evaluate(() => { const o = TWT.overlay; const i = o.items.findIndex((x) => x.act === 'new'); const r = o.rects[i]; const p = T.uiToClient(r.x + r.w / 2, r.y + r.h / 2); return [p.x, p.y]; });
    await page.touchscreen.tap(...newGame);
    await step(page, 5);
    expect(await page.evaluate(() => TWT.mode)).toBe('play');
    const r = await page.evaluate(() => {
      T.useTouch(true);
      T.talkThrough([], 3000);
      T.walkTo(214); T.press('KeyE'); T.talkThrough([]); T.step(200);
      T.walkTo(554); T.hold('KeyD', 20); T.step(70);
      T.press('KeyF');
      return { scene: TWT.scene.id, lantern: TWT.state.lanternOn, ev: Object.keys(TWT.state.evidence).sort(), misses: T.touchMisses };
    });
    expect(r.misses).toEqual([]);
    expect(r.scene).toBe('ROAD');
    await step(page, 5);
    expect(await page.evaluate((k) => !!localStorage.getItem(k), SAVE_KEY)).toBe(true);
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.evaluate(async () => (await import('/tools/harness.js')).install());
    await step(page, 40);
    await page.touchscreen.tap(200, 150);
    await step(page, 10);
    const cont = await page.evaluate(() => { const o = TWT.overlay; const i = o.items.findIndex((x) => x.act === 'continue'); const rr = o.rects[i]; const p = T.uiToClient(rr.x + rr.w / 2, rr.y + rr.h / 2); return [p.x, p.y]; });
    await page.touchscreen.tap(...cont);
    await step(page, 5);
    const back = await page.evaluate(() => ({ scene: TWT.scene.id, lantern: TWT.state.lanternOn, ev: Object.keys(TWT.state.evidence).sort() }));
    expect(back).toEqual({ scene: r.scene, lantern: r.lantern, ev: r.ev });
    await expectClean(page, errors);
  });

  test('the whole first chapter, touch only: every action it needs has a touch control', async ({ page }) => {
    test.setTimeout(240_000);
    const { errors } = await mboot(page);
    const rep = await page.evaluate(() => { T.useTouch(true); const r = T.fullRun({ conclusion: 'C_STAGED', pit: true }); r.misses = T.touchMisses; r.taps = T.touchTaps; return r; });
    expect(rep.errors, rep.steps.join('\n')).toEqual([]);
    expect(rep.misses).toEqual([]);
    expect(rep.taps).toBeGreaterThan(100);
    await expectClean(page, errors);
  });

  test('chapter 2, touch only: from the first night\'s end card through the whole second day to its end card', async ({ page }) => {
    test.setTimeout(300_000);
    const { errors } = await mboot(page);
    const rep = await page.evaluate(() => {
      T.useTouch(true);
      const r1 = T.fullRun({ conclusion: 'C_STAGED' });
      const r2 = T.fullRun2({ conclusion: 'C2_BLAST' });
      return { r1: r1.errors, r2, misses: T.touchMisses, taps: T.touchTaps };
    });
    expect(rep.r1).toEqual([]);
    expect(rep.r2.errors, rep.r2.steps.join('\n')).toEqual([]);
    expect(rep.r2.aftermath).toBe('AFTER2_BLAST');
    expect(rep.misses, 'actions with no touch control').toEqual([]);
    // the end card's own menu, by a real tap: stay in town
    await page.evaluate(() => { for (let i = 0; i < 150; i++) TWT.update(1 / 60); TWT_TEST.render(); });
    const stay = await page.evaluate(() => { const o = TWT.overlay; const r = o.rects[0]; const p = T.uiToClient(r.x + r.w / 2, r.y + r.h / 2); return [p.x, p.y]; });
    await page.touchscreen.tap(...stay);
    await step(page, 90);
    expect(await page.evaluate(() => ({ scene: TWT.scene.id, move: TWT.canMove(), ctx: document.documentElement.dataset.tc }))).toEqual({ scene: 'BLACK_RAM_EXTERIOR', move: true, ctx: 'world' });
    await expectClean(page, errors);
  });
});
