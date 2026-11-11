// Native-density scene art (1 image px = 1 NATIVE px = 2/3 world unit), authored in Pixelorama:
// sources in assets/source/pixelorama/environments/*.pxo (+ scripts/*.gd), exports in
// assets/export/environments/<scene>/. Each scene lists the layer PNGs it needs; if any is missing
// the loader logs a clear error and that scene keeps its previous painter.
const SCENES = {
  PARLOR: { dir: 'parlor', files: ['main', 'light_evening', 'glow_evening'] },
  ROOM4: { dir: 'room4', files: ['main', 'light_evening', 'light_night', 'glow_evening', 'glow_night'] },
  CREEK: { dir: 'creek', files: ['main'] }, // playfield only; parallax layers stay procedural
  ROAD: { dir: 'road', files: ['main'] }, // playfield only; parallax layers stay procedural
};

// Native-density parallax layers (sky, ranges, pine belts, distant roofs, haze, foreground
// silhouettes), painted by assets/source/pixelorama/environments/scripts/parallax.gd and exported
// as assets/export/environments/parallax/<scene>_<layer>.png. Loaded one by one: a missing file
// only drops that layer back to its older painter.
const PARALLAX = {
  station: ['train', 'train_glow'], // the train prop (scripts/train.gd); the rest of the station is a Tiled map
  town: ['sky_evening', 'sky_night', 'mountains', 'far_trees', 'far_rooftops', 'far_lights_evening', 'fog'],
  road: ['sky', 'mountains_far', 'mountains_near', 'lights', 'lights_glow', 'pines_far', 'pines_near', 'front'],
  creek: ['sky', 'mountains_far', 'mountains_near', 'mill', 'pines', 'front'],
};
const para = {};

const art = {};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url + '?v=1';
  });
}

export async function loadNativeSceneArt(base = 'assets/export/environments/') {
  await Promise.all(Object.entries(SCENES).map(async ([id, def]) => {
    try {
      const imgs = await Promise.all(def.files.map((f) => loadImage(`${base}${def.dir}/${f}.png`)));
      art[id] = {};
      def.files.forEach((f, i) => { art[id][f] = imgs[i]; });
    } catch (err) {
      console.error(`[nativeArt] ${id}: ${err.message}. Falling back to the previous painter.`);
    }
  }));
  await Promise.all(Object.entries(PARALLAX).flatMap(([scene, names]) => names.map(async (n) => {
    try {
      para[`${scene}/${n}`] = await loadImage(`${base}parallax/${scene}_${n}.png`);
    } catch (err) {
      console.error(`[nativeArt] parallax ${scene}/${n}: ${err.message}. That layer keeps its previous painter.`);
    }
  })));
}

// A native parallax layer image, or null (missing, or legacy art mode).
export function parallaxArt(scene, name) { return artMode.legacy || artMode.legacyParallax ? null : para[`${scene}/${name}`] || null; }

import { artMode } from './artMode.js';
// Compose a native scene's layers for a story phase: main + light_<phase> baked together, and
// glow_<phase> as the emissive layer (depth-masked by the renderer like every glow).
import { makeCanvas } from '../engine/display.js';
export function nativeLayers(A, phase) {
  const ph = phase === 'NIGHT' ? 'night' : 'evening';
  const m = makeCanvas(A.main.width, A.main.height);
  const mx = m.getContext('2d');
  mx.imageSmoothingEnabled = false;
  mx.drawImage(A.main, 0, 0);
  if (A['light_' + ph]) mx.drawImage(A['light_' + ph], 0, 0);
  return { back: [], main: { canvas: m, glow: A['glow_' + ph] || null, native: true }, front: [] };
}
export function nativeArt(id) { return artMode.legacy ? null : art[id] || null; }
