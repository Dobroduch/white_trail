// Hand-painted Crow's Hollow (main street) art, authored in Pixelorama
// (assets/draft/crows_hollow/crows_hollow_town.pxo) and exported one PNG per layer into
// assets/backgrounds/town/. Layers are 706×180 world units: the scene is 640 wide and the extra width
// is only used by the foreground parallax layer (factor 1.2). If any file is missing the loader logs
// a clear error and the scene falls back to the procedural painter in painters.js.
const NAMES = [
  'sky_evening', 'sky_night', 'mountains', 'far_trees', 'far_rooftops', 'far_lights_evening', 'fog',
  'buildings', 'ground', 'props', 'shadows', 'windows_evening', 'windows_night', 'lamps', 'drifts',
];
let art = null;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url + '?v=1';
  });
}

export async function loadTownArt(base = 'assets/backgrounds/town/') {
  try {
    const imgs = await Promise.all(NAMES.map((n) => loadImage(`${base}${n}.png`)));
    art = {};
    NAMES.forEach((n, i) => { art[n] = imgs[i]; });
  } catch (err) {
    art = null;
    console.error(`[townArt] ${err.message}. Falling back to the procedural town background.`);
  }
}

// Returns the loaded painted layers, or null if unavailable.
import { artMode } from './artMode.js';
export function townArt() { return artMode.legacy ? null : art; }
