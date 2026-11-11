// Restrained side-scrolling camera with three framing modes.
// exploration: wide (zoom 1), slight lookahead; investigation: closer, between Silas and object;
// dialogue: closest, between speakers.
// The camera lives in WORLD units (it frames VIEW_W×VIEW_H of them) but scrolls on the NATIVE pixel
// grid: `pos` is snapped to multiples of 1/WORLD_SCALE, and is split into a whole world-unit part
// (`ix`, which legacy draw code subtracts and rounds against) plus a sub-unit remainder (`sub`, applied
// once as a framebuffer translation), so legacy art and the backdrop always move together.
import { VIEW_W, VIEW_H, WORLD_SCALE, snapN, Display } from './display.js';

const MODES = {
  exploration: { zoom: 1.0, look: 26 },
  investigation: { zoom: 1.14, look: 0 },
  dialogue: { zoom: 1.28, look: 0 },
};

export class Camera {
  constructor() {
    this.x = 0; // left edge in world units (float)
    this.zoom = 1;
    this.mode = 'exploration';
    this.focusX = VIEW_W / 2; this.focusY = 120; // world-space point of interest
    this.override = null; // { x, y } authored focus from cutscenes
    this.lookahead = 0;
    this.reduced = false;
    this.sceneW = VIEW_W;
  }
  setMode(mode, focus) {
    this.mode = mode;
    this.modeFocus = focus || null;
  }
  snap(targetX, sceneW) {
    this.sceneW = sceneW;
    this.x = clamp(targetX - VIEW_W / 2, 0, Math.max(0, sceneW - VIEW_W));
    this.lookahead = 0;
    this.zoom = this.minZoom();
  }
  update(dt, player) {
    const m = MODES[this.mode] || MODES.exploration;
    const wantLook = this.mode === 'exploration' ? player.facing * m.look : 0;
    this.lookahead += (wantLook - this.lookahead) * Math.min(1, dt * 1.6);
    let fx = player.x + this.lookahead;
    let fy = player.y - 16;
    if (this.modeFocus) {
      fx = (player.x + this.modeFocus.x) / 2;
      fy = (player.y - 16 + this.modeFocus.y) / 2;
    }
    if (this.override) { fx = this.override.x; fy = this.override.y; }
    const targetX = clamp(fx - VIEW_W / 2, 0, Math.max(0, this.sceneW - VIEW_W));
    const follow = this.override ? 2.2 : 4.0;
    this.x += (targetX - this.x) * Math.min(1, dt * follow);
    // A scene narrower than a wide window is zoomed just enough to fill it (never letterboxed).
    const mz = this.minZoom();
    if (mz > 1 && !this.modeFocus && !this.override) fx = Math.min(fx, this.sceneW / 2);
    const wantZoom = mz * (this.reduced ? 1 : (this.override && this.override.zoom ? this.override.zoom : m.zoom));
    this.zoom += (wantZoom - this.zoom) * Math.min(1, dt * 2.4);
    if (Math.abs(this.zoom - wantZoom) < 0.002) this.zoom = wantZoom;
    this.focusX = fx; this.focusY = fy;
  }
  minZoom() { return Math.max(1, VIEW_W / this.sceneW); }
  // Render position: left edge snapped to the native pixel grid (world units).
  get pos() { return snapN(this.x); }
  // Whole world-unit part of `pos` (legacy draw code subtracts this and rounds).
  get ix() { return Math.floor(this.pos + 1e-6); }
  // Remainder of `pos` below one world unit: 0, 1/3 or 2/3 at WORLD_SCALE 1.5.
  get sub() { return Math.max(0, this.pos - this.ix); }
  // Focus point in NATIVE screen px, for the zoom crop.
  screenFocus() {
    Display.limitW = (this.sceneW - this.pos) * WORLD_SCALE;
    return { x: (this.focusX - this.pos) * WORLD_SCALE, y: clamp(this.focusY, 0, VIEW_H) * WORLD_SCALE };
  }
}

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
