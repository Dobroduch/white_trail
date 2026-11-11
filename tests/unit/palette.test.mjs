// Unit tests: the central palette, its generated files, and the PNG codec used by the tools.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PALETTE, PAL, RAMPS } from '../../src/data/palette.js';
import { PAL as PAINT_PAL } from '../../src/world/paint.js';
import { encodePNG, decodePNG } from '../../tools/lib/png.mjs';

test('64 unique, valid colours; names unique across ramps', () => {
  const names = Object.values(RAMPS).flatMap((r) => Object.keys(r));
  assert.equal(names.length, 64);
  assert.equal(new Set(names).size, 64);
  const hexes = Object.values(PALETTE);
  assert.equal(new Set(hexes).size, 64);
  for (const h of hexes) assert.match(h, /^#[0-9a-f]{6}$/);
});

test('the painters\' PAL is part of the central palette and unchanged', () => {
  assert.equal(PAINT_PAL, PAL);
  for (const [k, v] of Object.entries(PAL)) assert.equal(PALETTE[k], v, k);
});

test('generated .gpl / .hex are in sync with palette.js (run `npm run palette` if this fails)', () => {
  const hex = readFileSync(new URL('../../assets/palette/the-white-trail.hex', import.meta.url), 'utf8').trim().split(/\r?\n/);
  const want = Object.values(RAMPS).flatMap((r) => Object.values(r)).map((h) => h.slice(1));
  assert.deepEqual(hex, want);
  const gpl = readFileSync(new URL('../../assets/palette/the-white-trail.gpl', import.meta.url), 'utf8');
  assert.match(gpl, /^GIMP Palette/);
  assert.equal(gpl.trim().split(/\r?\n/).filter((l) => /^\s*\d/.test(l)).length, 64);
});

test('PNG encode → decode round trip', () => {
  const data = new Uint8Array(3 * 2 * 4).map((_, i) => (i * 37) & 255);
  const out = decodePNG(encodePNG(3, 2, data));
  assert.equal(out.width, 3);
  assert.equal(out.height, 2);
  assert.deepEqual([...out.data], [...data]);
});
