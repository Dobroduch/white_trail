// Frame-time and memory measurement in a real browser (Playwright + Edge, the same browser the test suite uses).
//
//   node tools/perf.mjs [--label before] [--secs 8] [--port 8094]
//
// The game must be served (node tools/serve.mjs 8094, or the Playwright web server). For each scenario the game runs on
// its real requestAnimationFrame loop (seeded: ?test=1&live=1), Silas walks right and back with the lantern lit, and
// the script records:
//   - frame intervals (rAF to rAF): median, p95, p99, worst, and the share of frames over 20 ms / 33 ms;
//   - CPU per frame: the time spent inside one game.update() + game.render() pass (median, p95);
//   - JS heap at the start and end of a longer walk (Chromium's performance.memory), to spot growth.
// Scenarios run at desktop 1280×720 (DPR 1) and a phone in landscape (844×390, DPR 3, touch), each with no CPU
// throttling and with 4× throttling (Chrome DevTools' "mid-tier mobile" stand-in; not a real phone).
// Results are printed as a table and appended to test-results/perf/<label>.json.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const label = arg('label', 'run');
const secs = Number(arg('secs', 8));
const port = Number(arg('port', 8094));
// the same Edge lookup as playwright.config.mjs (newer installs keep the binary in EdgeCore/<version>/)
const edgeCore = (dir) => { try { return readdirSync(dir).filter((v) => /^\d+(\.\d+)+$/.test(v)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })).map((v) => `${dir}/${v}/msedge.exe`); } catch { return []; } };
const EDGE = [process.env.PW_EXECUTABLE, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ...edgeCore('C:/Program Files (x86)/Microsoft/EdgeCore'), ...edgeCore('C:/Program Files/Microsoft/EdgeCore')].find((p) => p && existsSync(p));

const SCENES = [
  { scene: 'VILLAGE', phase: 'NIGHT' }, // exterior: parallax, snow, fog, lantern, lights
  { scene: 'SAWMILL', phase: 'NIGHT' }, // the heaviest exterior
  { scene: 'PARLOR', phase: 'EVENING' }, // interior: fire, lamps, patrons
];
const DEVICES = [
  { name: 'desktop 1280x720', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  { name: 'phone 844x390 dpr3', viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
];
const THROTTLE = [1, 4];

const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const r1 = (x) => Math.round(x * 10) / 10;

const browser = await chromium.launch(EDGE ? { executablePath: EDGE } : { channel: 'msedge' });
const results = [];
for (const dev of DEVICES) {
  for (const sc of SCENES) {
    for (const cpu of THROTTLE) {
      const ctx = await browser.newContext({ viewport: dev.viewport, deviceScaleFactor: dev.deviceScaleFactor, isMobile: !!dev.isMobile, hasTouch: !!dev.hasTouch });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(`http://localhost:${port}/?test=1&live=1&nopause=1&scene=${sc.scene}&phase=${sc.phase}`);
      await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 30_000 });
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      const r = await page.evaluate(async (secs) => {
        const g = window.TWT;
        // CPU cost of each update+render pass, and the rAF intervals
        const cost = [], gaps = [];
        const up = g.update.bind(g), re = g.render.bind(g);
        let t0 = 0, inFrame = false;
        g.update = (dt) => { if (!inFrame) { inFrame = true; t0 = performance.now(); } up(dt); };
        g.render = (a) => { if (!inFrame) t0 = performance.now(); re(a); cost.push(performance.now() - t0); inFrame = false; };
        if (!g.state.lanternOn) g.toggleLantern ? g.toggleLantern() : (g.state.lanternOn = true);
        const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code }));
        await new Promise((res) => setTimeout(res, 1000)); // settle (fade in, first frames)
        cost.length = 0;
        const heap0 = performance.memory ? performance.memory.usedJSHeapSize : 0;
        let last = performance.now(), dir = 'KeyD', flip = performance.now();
        key(dir, true);
        await new Promise((res) => {
          const end = performance.now() + secs * 1000;
          const f = (now) => {
            gaps.push(now - last); last = now;
            if (now - flip > 2500) { key(dir, false); dir = dir === 'KeyD' ? 'KeyA' : 'KeyD'; key(dir, true); flip = now; }
            if (now < end) requestAnimationFrame(f); else res();
          };
          requestAnimationFrame(f);
        });
        key(dir, false);
        const heap1 = performance.memory ? performance.memory.usedJSHeapSize : 0;
        g.update = up; g.render = re;
        return { gaps: gaps.slice(2), cost, heap0, heap1, errors: [...g.errorsSeen] };
      }, secs);
      const row = {
        device: dev.name, scene: `${sc.scene}/${sc.phase}`, cpu: `${cpu}x`,
        frames: r.gaps.length, fps: r1(r.gaps.length / (r.gaps.reduce((a, b) => a + b, 0) / 1000)),
        gapMed: r1(q(r.gaps, 0.5)), gapP95: r1(q(r.gaps, 0.95)), gapP99: r1(q(r.gaps, 0.99)), gapMax: r1(Math.max(...r.gaps)),
        over20: r1(100 * r.gaps.filter((x) => x > 20).length / r.gaps.length), over33: r1(100 * r.gaps.filter((x) => x > 33.4).length / r.gaps.length),
        cpuMed: r1(q(r.cost, 0.5)), cpuP95: r1(q(r.cost, 0.95)),
        heapMB: r1(r.heap0 / 1048576), heapGrowMB: r1((r.heap1 - r.heap0) / 1048576),
        errors: [...errors, ...r.errors].length,
      };
      results.push(row);
      console.log(Object.values(row).join('\t'));
      await ctx.close();
    }
  }
}
await browser.close();
mkdirSync('test-results/perf', { recursive: true });
writeFileSync(`test-results/perf/${label}.json`, JSON.stringify({ label, at: new Date().toISOString(), secs, results }, null, 1));
console.log(`\ncolumns: ${Object.keys(results[0]).join('\t')}\nwritten test-results/perf/${label}.json`);
