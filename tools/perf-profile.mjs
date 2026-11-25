// CPU profile and long-walk memory check for one scene (companion to tools/perf.mjs).
//   node tools/perf-profile.mjs --scene PARLOR --phase EVENING [--cpu 4] [--secs 6] [--memsecs 60]
// Prints the self-time top functions over a walk, then the JS heap after a forced GC at the start and at the end of a
// longer walk (a leak shows as steady growth after GC; plain garbage does not).
import { chromium } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const scene = arg('scene', 'PARLOR'), phase = arg('phase', 'EVENING'), cpu = Number(arg('cpu', 4)), secs = Number(arg('secs', 6)), memsecs = Number(arg('memsecs', 60));
const port = Number(arg('port', 8094));
const vw = Number(arg('w', 844)), vh = Number(arg('h', 390)), dpr = Number(arg('dpr', 3));
const edgeCore = (dir) => { try { return readdirSync(dir).filter((v) => /^\d+(\.\d+)+$/.test(v)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })).map((v) => `${dir}/${v}/msedge.exe`); } catch { return []; } };
const EDGE = [process.env.PW_EXECUTABLE, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ...edgeCore('C:/Program Files (x86)/Microsoft/EdgeCore'), ...edgeCore('C:/Program Files/Microsoft/EdgeCore')].find((p) => p && existsSync(p));

const browser = await chromium.launch({ executablePath: EDGE });
const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
const page = await ctx.newPage();
await page.goto(`http://localhost:${port}/?test=1&live=1&nopause=1&scene=${scene}&phase=${phase}`);
await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
const walk = (s) => page.evaluate(async (s) => {
  const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code }));
  let dir = 'KeyD'; key(dir, true);
  const end = performance.now() + s * 1000;
  while (performance.now() < end) { await new Promise((r) => setTimeout(r, 2500)); key(dir, false); dir = dir === 'KeyD' ? 'KeyA' : 'KeyD'; key(dir, true); }
  key(dir, false);
}, s);
await page.waitForTimeout(1000);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await cdp.send('Profiler.start');
await walk(secs);
const { profile } = await cdp.send('Profiler.stop');
// self time per function
const dt = {}; const byId = new Map(profile.nodes.map((n) => [n.id, n]));
for (let i = 0; i < profile.samples.length; i++) {
  const n = byId.get(profile.samples[i]); const f = n.callFrame;
  const k = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/')}:${f.lineNumber + 1}`;
  dt[k] = (dt[k] || 0) + (profile.timeDeltas[i] || 0);
}
const total = Object.values(dt).reduce((a, b) => a + b, 0);
console.log(`CPU profile ${scene}/${phase}, ${cpu}x, ${vw}x${vh}@${dpr}: top self time`);
for (const [k, v] of Object.entries(dt).sort((a, b) => b[1] - a[1]).slice(0, 22)) console.log(`${(100 * v / total).toFixed(1).padStart(5)}%  ${k}`);
// memory after GC, over a long walk
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await cdp.send('HeapProfiler.enable');
const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); return (await cdp.send('Runtime.getHeapUsage')).usedSize / 1048576; };
const h0 = await heap();
await walk(memsecs / 2);
const h1 = await heap();
await walk(memsecs / 2);
const h2 = await heap();
console.log(`heap after GC: start ${h0.toFixed(2)} MB, +${memsecs / 2}s ${h1.toFixed(2)} MB, +${memsecs}s ${h2.toFixed(2)} MB`);
await browser.close();
