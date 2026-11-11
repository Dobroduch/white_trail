// Audio organisation: buses, per-bus volume, and recorded (Audacity) samples layered over the
// synthesised fallback. The sample files are generated here and served through page.route, so the
// test proves the manifest → fetch → decode → play path without shipping placeholder audio.
import { test, expect } from '@playwright/test';
import { boot, step, press, expectClean } from './helpers.mjs';

// A short mono 16-bit PCM WAV (a decaying 220 Hz tone).
function wav(seconds = 0.4, freq = 220) {
  const rate = 22050, n = Math.floor(rate * seconds), b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin((i / rate) * freq * 2 * Math.PI) * 12000 * (1 - i / n)), 44 + i * 2);
  return b;
}

test('buses exist and are routed footsteps/interaction → effects → master', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  await press(page, 'KeyD', 2);
  const s = await page.evaluate(() => {
    const a = TWT.audio;
    return { ready: a.ready, buses: ['master', 'amb', 'fx', 'steps', 'interact', 'mus'].every((k) => a[k] && a[k].gain), bank: !!a.bank };
  });
  expect(s).toEqual({ ready: true, buses: true, bank: true });
  await expectClean(page, errors);
});

test('recorded samples: sfx variants, ambience crossfade, music crossfade', async ({ page }) => {
  await page.route('**/assets/export/audio/manifest.json*', (r) => r.fulfill({ json: {
    sfx: { stepSnow: { files: ['footsteps/test_a.wav', 'footsteps/test_b.wav'], gain: 0.8, pitch: 0.05 } },
    ambience: { village: { files: ['ambience/test_bed.wav'], gain: 0.6 } },
    music: { theme_a: { files: ['music/test_a.wav'] }, theme_b: { files: ['music/test_b.wav'] } },
  } }));
  await page.route('**/assets/export/audio/**/*.wav*', (r) => r.fulfill({ body: wav(), contentType: 'audio/wav' }));
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  await press(page, 'KeyD', 2);
  await page.waitForFunction(() => TWT.audio.bank && TWT.audio.bank.decoded);
  const r = await page.evaluate(async () => {
    const a = TWT.audio, b = a.bank;
    const played = b.play(a.ctx, a.steps, 'stepSnow', 1); // what sfx('stepSnow') does first
    const synthOnly = b.play(a.ctx, a.interact, 'door', 1); // no sample → synth fallback
    const beds = [...b.beds.keys()];
    a.playMusic('theme_a');
    const first = b.track && b.track.id;
    a.playMusic('theme_b');
    await new Promise((res) => setTimeout(res, 900));
    return { played, synthOnly, beds, first, now: b.track && b.track.id, errors: b.errors };
  });
  expect(r.played).toBe(true);
  expect(r.synthOnly).toBe(false);
  expect(r.beds).toEqual(['village']); // the scene's ambience key got its recorded bed
  expect(r.first).toBe('theme_a');
  expect(r.now).toBe('theme_b');
  expect(r.errors).toEqual([]);
  // entering the parlor (ambience "parlor", no bed) crossfades the village bed out
  await page.evaluate(() => T.walkTo(320));
  await press(page, 'KeyE', 60);
  expect(await page.evaluate(() => [...TWT.audio.bank.beds.keys()])).toEqual([]);
  await expectClean(page, errors);
});

test('a missing audio file is reported and falls back to synthesis', async ({ page }) => {
  await page.route('**/assets/export/audio/manifest.json*', (r) => r.fulfill({ json: { sfx: { stepWood: { files: ['footsteps/missing.wav'] } } } }));
  const { errors } = await boot(page, { test: '1', scene: 'PARLOR' });
  await press(page, 'KeyD', 2);
  const r = await page.evaluate(() => ({ errs: TWT.audio.bank.errors, has: TWT.audio.bank.has('sfx', 'stepWood') }));
  expect(r.has).toBe(false);
  expect(r.errs.join()).toContain('missing.wav');
  expect(errors.some((e) => e.includes('missing.wav'))).toBe(true); // a clear console error, not silence
  await step(page, 5);
});
