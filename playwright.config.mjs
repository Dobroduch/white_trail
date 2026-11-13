// Playwright configuration for THE WHITE TRAIL.
//
// Browser: the locally installed Microsoft Edge (channel "msedge") by default, so no browser
// download is needed. Override with PW_CHANNEL=chrome, or PW_CHANNEL=chromium after running
// `npx playwright install chromium` (the bundled build; needed on CI/Linux).
//
// The game is served by tools/serve.mjs on port 8094 (PW_PORT to change), started automatically
// and reused if already running.
import { defineConfig } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';

const port = Number(process.env.PW_PORT || 8094);
const channel = process.env.PW_CHANNEL || 'msedge';
// Playwright's msedge channel only looks in one location. Also find a system-wide install, including
// newer Edge layouts that keep the binary in EdgeCore/<version>/ (newest version wins).
const edgeCore = (dir) => {
  try {
    return readdirSync(dir).filter((v) => /^\d+(\.\d+)+$/.test(v))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true })).map((v) => `${dir}/${v}/msedge.exe`);
  } catch { return []; }
};
const EDGE = [
  process.env.PW_EXECUTABLE,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ...edgeCore('C:/Program Files (x86)/Microsoft/EdgeCore'),
  ...edgeCore('C:/Program Files/Microsoft/EdgeCore'),
].find((p) => p && existsSync(p));
const browserUse = channel === 'chromium' ? { browserName: 'chromium' }
  : channel === 'msedge' && EDGE ? { browserName: 'chromium', launchOptions: { executablePath: EDGE } }
  : { browserName: 'chromium', channel };

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.mjs',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    // Visual baselines are per platform/browser (fonts and GPU differ); see docs/TESTING.md.
    toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled', caret: 'hide', scale: 'css' },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}-{platform}/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  workers: process.env.CI ? 1 : 3,
  retries: 1, // absorbs rare browser-launch flakes; a retried test is reported as "flaky"
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'test-results/report' }]],
  outputDir: 'test-results/artifacts',
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Desktop (keyboard + mouse) runs every spec except the mobile one. The three mobile projects emulate phones in
  // landscape (viewport, device pixel ratio, isMobile, touch input) on the same Chromium-based browser and run only
  // tests/e2e/mobile.spec.mjs. Emulation is not a real iOS / Android device: see docs/TESTING.md.
  projects: [
    { name: channel, use: browserUse, testIgnore: '**/mobile.spec.mjs' },
    { name: 'mobile-android-small', testMatch: '**/mobile.spec.mjs', use: { ...browserUse, viewport: { width: 640, height: 360 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: 'mobile-android-large', testMatch: '**/mobile.spec.mjs', use: { ...browserUse, viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true } },
    { name: 'mobile-iphone', testMatch: '**/mobile.spec.mjs', use: { ...browserUse, viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' } },
  ],
  webServer: {
    command: `node tools/serve.mjs ${port}`,
    url: `http://localhost:${port}/index.html`,
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
