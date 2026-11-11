// Hand-painted Blackwood Station art, authored in Pixelorama (assets/draft/blackwood_station/*.pxo)
// and exported one PNG per layer into assets/backgrounds/station/. Every layer is 560×180 world units
// (the scene's size), except the train sprites (220×52, drawn at y=100). If any file is missing the
// loader logs a clear error and the scene falls back to the procedural painter in painters.js.
const NAMES = [
  'sky', 'mountains_far', 'mountains_near', 'pines', 'haze', 'ground', 'building', 'props',
  'shadows', 'emissive', 'drifts', 'train', 'train_glow',
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

export async function loadStationArt(base = 'assets/backgrounds/station/') {
  try {
    const imgs = await Promise.all(NAMES.map((n) => loadImage(`${base}${n}.png`)));
    art = {};
    NAMES.forEach((n, i) => { art[n] = imgs[i]; });
  } catch (err) {
    art = null;
    console.error(`[stationArt] ${err.message}. Falling back to the procedural station background.`);
  }
}

// Returns the loaded painted layers, or null if unavailable.
export function stationArt() { return art; }
