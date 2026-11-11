// Exploration state for Silas's map. Lives in the serializable story state (state.map), so it is
// saved at every checkpoint and restored with the rest of the game. Returns the names of anything
// newly drawn so the HUD can acknowledge it.
import { LOCATIONS, PATHS } from '../data/mapData.js';

export function ensureMapState(s) {
  if (!s.map || typeof s.map !== 'object') s.map = { visited: [], paths: [] };
  if (!Array.isArray(s.map.visited)) s.map.visited = [];
  if (!Array.isArray(s.map.paths)) s.map.paths = [];
  return s.map;
}

// Silas is in `sceneId` at world x. Marks every location whose scene (and x-range) matches.
export function discoverAt(s, sceneId, x) {
  const m = ensureMapState(s);
  const found = [];
  for (const L of LOCATIONS) {
    if (m.visited.includes(L.id) || !L.scenes.includes(sceneId)) continue;
    if (L.xMin != null && !(x >= L.xMin)) continue;
    if (L.xMax != null && !(x <= L.xMax)) continue;
    m.visited.push(L.id);
    found.push(L.name);
  }
  return found;
}

// Silas has just travelled from one scene to another: draw the way between them, if it is a mapped path.
export function discoverPath(s, fromScene, toScene) {
  const m = ensureMapState(s);
  const p = PATHS.find((q) => q.between.includes(fromScene) && q.between.includes(toScene) && fromScene !== toScene);
  if (!p || m.paths.includes(p.id)) return false;
  m.paths.push(p.id);
  return true;
}
