// Registry of Tiled-authored levels. Each entry becomes a normal scene: its definition is added to
// SCENES (so doors, exits, saves and validation treat it like any hand-written scene) and its layers
// come from the map instead of a procedural painter.
//
// Adding a level: save the map as assets/levels/<name>.tmj, add a line here, refresh the browser.
// A map that fails to load or convert logs a clear error and is simply not registered; the rest of
// the game is unaffected. See docs/TILED_LEVELS.md.
import { SCENES } from '../scenes.js';
import { registerPainter, clearLayerCache } from '../painters.js';
import { sceneFromTiled } from './tiledMap.js';
import { loadTiledMap, renderTiledLayers } from './tiledRender.js';
import { LEVELS } from './levelList.js';

export { LEVELS };

export const levelStatus = {}; // id -> { ok, errors, warnings }

async function loadLevel(def) {
  try {
    const loaded = await loadTiledMap(def.url);
    const { scene, errors, warnings } = sceneFromTiled(loaded.map, def.id);
    for (const w of warnings) console.warn('[tiled]', w);
    if (errors.length) {
      for (const e of errors) console.error('[tiled]', e);
      levelStatus[def.id] = { ok: false, errors, warnings };
      return false;
    }
    SCENES[def.id] = scene;
    registerPainter(def.id, (width, phase) => renderTiledLayers(loaded, phase, width));
    levelStatus[def.id] = { ok: true, errors, warnings };
    return true;
  } catch (err) {
    console.error(`[tiled] ${def.id}: ${err.message}. The level was not registered.`);
    levelStatus[def.id] = { ok: false, errors: [err.message], warnings: [] };
    return false;
  }
}

export async function loadLevels() {
  await Promise.all(LEVELS.map(loadLevel));
}

// Development: re-fetch one level (map, tilesets, images) after saving in Tiled / re-exporting
// from Pixelorama, without reloading the page. Returns true when the new version loaded.
export async function reloadLevel(id) {
  const def = LEVELS.find((l) => l.id === id);
  if (!def) throw new Error(`unknown level ${id}`);
  clearLayerCache(id);
  return loadLevel(def);
}
