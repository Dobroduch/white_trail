// localStorage checkpoints. Saved only at intentional points (scene entry, recorded evidence,
// story beats) — never per frame. Versioned, with a safe fallback for malformed data.
import { SAVE_VERSION, newState } from './storyState.js';

const KEY = 'thewhitetrail.save.v1';
const SETTINGS_KEY = 'thewhitetrail.settings.v1';

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function saveGame(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), state }));
    return true;
  } catch (err) {
    console.warn('[save] could not write save:', err.message);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const s = data && data.state;
    if (!s || typeof s !== 'object') throw new Error('no state');
    if (s.version !== SAVE_VERSION) throw new Error(`version ${s.version} != ${SAVE_VERSION}`);
    // Merge onto a fresh state so missing fields get sane defaults.
    const base = newState();
    const merged = Object.assign(base, s);
    merged.flags = Object.assign(base.flags, s.flags || {});
    merged.chars = Object.assign(newState().chars, s.chars || {});
    // A character recorded dead stays dead, whatever defaults say.
    for (const [id, c] of Object.entries(s.chars || {})) if (c && c.alive === false) merged.chars[id].alive = false;
    return merged;
  } catch (err) {
    console.warn('[save] save data unreadable, ignoring it:', err.message);
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export const DEFAULT_SETTINGS = {
  master: 0.8, ambience: 0.8, effects: 0.85, music: 0.6,
  textSpeed: 'normal', reducedMotion: false, scanlines: false, vignette: false,
  scaling: 'auto', // 'auto' = fill the window (pixel-perfect when it fits well) | 'integer' = whole multiples only
};
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return Object.assign({}, DEFAULT_SETTINGS, raw ? JSON.parse(raw) : {});
  } catch { return Object.assign({}, DEFAULT_SETTINGS); }
}
export function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
