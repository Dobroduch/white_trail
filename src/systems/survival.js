// Lantern, warmth and revolver state. Deliberately low-pressure in this milestone.

// ---- Lantern ----
// Oil consumption is DISABLED for the prototype (oilPerMinute = 0). The hook is here so a later
// milestone can balance it; clues must never become invisible solely for lack of oil.
export const LANTERN = { radius: 60, warm: 0.3, oilPerMinute: 0, selfLightRadius: 20 };

export function toggleLantern(state) {
  if (!state.lanternOn && state.lanternOil <= 0) return false;
  state.lanternOn = !state.lanternOn;
  return true;
}
export function updateLantern(state, dt) {
  if (!state.lanternOn || LANTERN.oilPerMinute <= 0) return;
  state.lanternOil = Math.max(0, state.lanternOil - (LANTERN.oilPerMinute / 60) * dt);
  if (state.lanternOil <= 0) state.lanternOn = false;
}

// ---- Warmth ----
// A slow supporting value: drains gently outdoors, recovers indoors. No damage, no death, and
// never connected to hallucinations. Low warmth only makes Silas shiver and shows a small cue.
export const WARMTH = { drainPerSecond: 0.12, windFactor: 0.12, restorePerSecond: 2.5, fireBonus: 4, floor: 25 };
export function updateWarmth(state, dt, scene, wind, nearFire) {
  if (scene.exterior) {
    state.warmth = Math.max(WARMTH.floor, state.warmth - (WARMTH.drainPerSecond + wind * WARMTH.windFactor) * dt);
  } else {
    state.warmth = Math.min(100, state.warmth + (WARMTH.restorePerSecond + (nearFire ? WARMTH.fireBonus : 0)) * dt);
  }
}

// ---- Revolver ----
// Silas owns one revolver: six chambers, three cartridges. There are no other weapons, no
// ammunition drops and no shops. Firing is intentionally NOT implemented in this milestone.
// TODO(milestone: authored confrontation): implement draw / aim / fire / manual reload here, used
// only by an authored scene with a named character, a motive, and non-lethal alternatives.
export function revolverDescription(state) {
  const r = state.revolver;
  return `Single-action. ${r.capacity} chambers; ${r.loaded} cartridges loaded${r.reserve ? `, ${r.reserve} spare` : ', none spare'}. No more to be had up here. I would as soon bring all of them home.`;
}
export function canFire() { return false; }
