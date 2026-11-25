// Text layout and render-state robustness, at several screen shapes.
//
// The text audit (tools/harness.js T.auditText) records every string one frame draws and reports text that runs off
// the screen, past its panel or column (panels that name their boxes with textBox()), or over other text. It is run
//   - every ~40 steps through whole playthroughs of chapters 1–4 (HUD, barks, dialogue, choices, cards),
//   - on every page, question, row, clue-notes page, picker and case review of the notebook, at checkpoints sampled
//     from those playthroughs (T.sweepNotebook), which also fails on any draw that throws,
//   - on each menu and panel (pause, settings, controls, inventory, map, telegram, end cards).
// A UI draw that throws must not leave a transform on the output canvas: that used to present the world through the
// UI scale on every later frame (the game "zoomed in" ~4x and unplayable after reading a clue's notes).
import { test, expect } from '@playwright/test';
import { boot, expectClean } from './helpers.mjs';

const SIZES = [
  { name: '16:9 desktop', use: { viewport: { width: 1280, height: 720 } } },
  { name: '4:3 window', use: { viewport: { width: 1024, height: 768 } } },
  { name: 'ultrawide window', use: { viewport: { width: 1720, height: 720 } } },
  { name: 'small phone, landscape, touch', touch: true, use: { viewport: { width: 640, height: 360 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
];

for (const size of SIZES) {
  test.describe(`text layout: ${size.name}`, () => {
    test.use(size.use);

    test('no text overflows or overlaps anywhere in chapters 1–4, the notebook or the menus', async ({ page }) => {
      test.setTimeout(420_000);
      const { errors } = await boot(page, { test: '1', ...(size.touch ? { dpr: '0' } : {}) });
      const r = await page.evaluate(async (touch) => {
        const g = TWT, issues = new Set(), snaps = [];
        const add = (list) => { for (const t of list) issues.add(t); };
        if (touch) T.useTouch(true);
        // checkpoints, for the notebook sweep afterwards
        const cp = g.checkpoint.bind(g);
        g.checkpoint = (...a) => { snaps.push(JSON.stringify(g.state)); return cp(...a); };
        // audit a frame every 40 steps of play
        const up = g.update.bind(g);
        let n = 0;
        g.update = (dt) => {
          up(dt);
          if (++n % 40 === 0 && g.mode === 'play') {
            const d = g.dialogue.active ? (g.dialogue.lastText || '').slice(0, 30) : '';
            add(T.auditText(`[${g.scene.id}${d ? ' · "' + d + '"' : ''}]`));
          }
        };
        g.newGame();
        const runs = [T.fullRun(), T.fullRun2(), T.fullRun3(), T.fullRun4()];
        g.update = up; g.checkpoint = cp;
        // the notebook at sampled checkpoints (and the last)
        const errs = [];
        const pick = snaps.filter((_, i) => i % 9 === 0 || i === snaps.length - 1);
        for (const js of pick) {
          const st = JSON.parse(js);
          g.state = st; g.startPlay(st.scene); g.update(1 / 60);
          g.cutscene = null; g.scriptQueue = []; g.dialogue.active = false; g.playerControl = true; g.transition = null;
          const sw = T.sweepNotebook();
          add(sw.text); errs.push(...sw.errors);
          if (sw.leftScaled) errs.push('output transform left scaled');
        }
        // menus and panels
        const { PauseMenu, SettingsMenu, ControlsHelp, Inventory, DocumentView, EndCard } = await import('/src/ui/menus.js');
        const { MapView } = await import('/src/ui/mapView.js');
        while (g.overlay) g.popOverlay();
        const panels = [
          ['pause', () => new PauseMenu(g)], ['settings', () => new SettingsMenu(g)], ['controls', () => new ControlsHelp(g)],
          ['inventory', () => { const v = new Inventory(g); v.panelKind = 'inventory'; return v; }], ['map', () => new MapView(g)],
          ['telegram', () => new DocumentView(g, 'TELEGRAM')], ['end card 1', () => new EndCard(g, 1)], ['end card 2', () => new EndCard(g, 2)],
          ['end card 3', () => new EndCard(g, 3)], ['end card 4', () => new EndCard(g, 4)],
        ];
        for (const [name, mk] of panels) {
          let o;
          try { o = mk(); } catch (e) { errs.push(name + ': ' + e.message); continue; }
          g.pushOverlay(o);
          for (let i = 0; i < 8; i++) { if (o.sel != null) o.sel = i; add(T.auditText(`[${name}${o.sel != null ? ' row ' + i : ''}]`)); }
          g.popOverlay();
        }
        // the title screen
        g.toTitle(); for (let i = 0; i < 5; i++) g.update(1 / 60);
        add(T.auditText('[title]'));
        return { issues: [...issues], errs, runs: runs.map((x) => x.errors) };
      }, !!size.touch);
      expect(r.runs, 'the playthroughs themselves').toEqual([[], [], [], []]);
      expect(r.errs, 'drawing errors').toEqual([]);
      expect(r.issues, 'text off screen, past its panel, or over other text').toEqual([]);
      await expectClean(page, errors);
    });
  });
}

test('a UI draw that throws does not zoom the world: the next frames present it at its normal size', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'PARLOR', phase: 'DAY' });
  const r = await page.evaluate(() => {
    const g = TWT, out = g.display.ctx;
    const snap = () => { g.render(); return out.getImageData(0, 0, out.canvas.width, out.canvas.height).data; };
    while (g.overlay) g.popOverlay();
    const before = snap();
    g.pushOverlay({ draw(ctx) { ctx.fillText('x', 10, 10); throw new Error('a broken page'); } });
    g.render(); g.popOverlay();
    const m = out.getTransform();
    const after = snap();
    let diff = 0;
    for (let i = 0; i < before.length; i += 4) if (Math.abs(before[i] - after[i]) > 8) diff++;
    g.errorsSeen.clear();
    return { identity: m.a === 1 && m.d === 1 && m.e === 0 && m.f === 0, diffShare: diff / (before.length / 4) };
  });
  expect(r.identity).toBe(true);
  expect(r.diffShare).toBeLessThan(0.02);
  // the thrown error was logged once by the game; that log is the point of this test, not a failure
  expect(errors.filter((e) => !/a broken page/.test(e))).toEqual([]);
});
