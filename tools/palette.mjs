// Palette tooling. Source of truth: src/data/palette.js
//
//   node tools/palette.mjs                    write assets/palette/the-white-trail.{gpl,hex,png}
//   node tools/palette.mjs --check            audit every PNG under assets/export (report only)
//   node tools/palette.mjs --check <files…>   audit specific PNGs/folders
//   node tools/palette.mjs --check --strict <files…>   exit 1 if any opaque pixel is off-palette
//
// "Exact" = the pixel's RGB is one of the 64 palette colours. "Near" = within a small perceptual
// distance (baked lighting/dither in older exports). New art should be 100% exact.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTE, RAMPS, PALETTE_NAME } from '../src/data/palette.js';
import { decodePNG, encodePNG } from './lib/png.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outDir = join(root, 'assets/palette');
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const entries = Object.values(RAMPS).flatMap((r) => Object.entries(r));
const NEAR = 24;

function dist(a, b) { // "redmean" perceptual approximation
  const rm = (a[0] + b[0]) / 2, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

function write() {
  mkdirSync(outDir, { recursive: true });
  const gpl = ['GIMP Palette', `Name: ${PALETTE_NAME}`, 'Columns: 8', '#',
    ...entries.map(([name, h]) => { const [r, g, b] = rgb(h); return `${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}\t${name}`; })];
  writeFileSync(join(outDir, 'the-white-trail.gpl'), gpl.join('\n') + '\n');
  writeFileSync(join(outDir, 'the-white-trail.hex'), entries.map(([, h]) => h.slice(1)).join('\n') + '\n');
  const data = new Uint8Array(entries.length * 4);
  entries.forEach(([, h], i) => { data.set([...rgb(h), 255], i * 4); });
  writeFileSync(join(outDir, 'the-white-trail.png'), encodePNG(entries.length, 1, data));
  console.log(`Wrote ${entries.length} colours to assets/palette/the-white-trail.{gpl,hex,png}`);
}

function collect(p, out) {
  if (!existsSync(p)) { console.error(`  missing: ${p}`); return; }
  if (statSync(p).isDirectory()) for (const f of readdirSync(p)) collect(join(p, f), out);
  else if (p.toLowerCase().endsWith('.png')) out.push(p);
}

function check(targets, strict) {
  const pal = Object.values(PALETTE).map(rgb);
  const exactSet = new Set(Object.values(PALETTE).map((h) => h.toLowerCase()));
  const files = [];
  for (const t of targets.length ? targets : [join(root, 'assets/export')]) collect(resolve(t), files);
  let bad = 0;
  const memo = new Map();
  console.log('exact%  near%  off-px  file');
  for (const f of files) {
    let img;
    try { img = decodePNG(readFileSync(f)); } catch (e) { console.log(`  ?      ?      ?     ${relative(root, f)}  (${e.message})`); continue; }
    let opaque = 0, exact = 0, near = 0;
    const off = new Map();
    for (let i = 0; i < img.width * img.height; i++) {
      const d = i * 4;
      if (img.data[d + 3] === 0) continue;
      opaque++;
      const c = [img.data[d], img.data[d + 1], img.data[d + 2]];
      const h = '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
      if (exactSet.has(h)) { exact++; near++; continue; }
      let m = memo.get(h);
      if (m == null) { m = Math.min(...pal.map((p) => dist(c, p))); memo.set(h, m); }
      if (m <= NEAR) near++;
      off.set(h, (off.get(h) || 0) + 1);
    }
    const offPx = opaque - exact;
    if (offPx) bad++;
    const pct = (v) => (opaque ? (100 * v / opaque).toFixed(1) : '100.0').padStart(5);
    const top = [...off].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, n]) => `${h}×${n}`).join(' ');
    console.log(`${pct(exact)}  ${pct(near)}  ${String(offPx).padStart(6)}  ${relative(root, f)}${top ? '   e.g. ' + top : ''}`);
  }
  console.log(`\n${files.length} file(s), ${bad} with off-palette pixels.`);
  if (strict && bad) process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes('--check')) check(args.filter((a) => !a.startsWith('--')), args.includes('--strict'));
else write();
