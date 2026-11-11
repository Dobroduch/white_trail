// Restrained side-scrolling camera with three framing modes.
// exploration: wide (zoom 1), slight lookahead; investigation: closer, between Silas and object;
// dialogue: closest, between speakers. Horizontal position is integer-snapped for rendering.
import { W, H } from './display.js';

const MODES = {
  exploration: { zoom: 1.0, look: 26 },
  investigation: { zoom: 1.14, look: 0 },
  dialogue: { zoom: 1.28, look: 0 },
};

export class Camera {
  constructor() {
    this.x = 0; // left edge in world px (float)
    this.zoom = 1;
    this.mode = 'exploration';
    this.focusX = 160; this.focusY = 120; // world-space point of interest
    this.override = null; // { x, y } authored focus from cutscenes
    this.lookahead = 0;
    this.reduced = false;
    this.sceneW = W;
  }
  setMode(mode, focus) {
    this.mode = mode;
    this.modeFocus = focus || null;
  }
  snap(targetX, sceneW) {
    this.sceneW = sceneW;
    this.x = clamp(targetX - W / 2, 0, Math.max(0, sceneW - W));
    this.lookahead = 0;
    this.zoom = 1;
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
    const targetX = clamp(fx - W / 2, 0, Math.max(0, this.sceneW - W));
    const follow = this.override ? 2.2 : 4.0;
    this.x += (targetX - this.x) * Math.min(1, dt * follow);
    const wantZoom = this.reduced ? 1 : (this.override && this.override.zoom ? this.override.zoom : m.zoom);
    this.zoom += (wantZoom - this.zoom) * Math.min(1, dt * 2.4);
    if (Math.abs(this.zoom - wantZoom) < 0.002) this.zoom = wantZoom;
    this.focusX = fx; this.focusY = fy;
  }
  get ix() { return Math.round(this.x); }
  // Focus point in world-buffer (screen) space, for the zoom crop.
  screenFocus() {
    return { x: this.focusX - this.ix, y: clamp(this.focusY, 0, H) };
  }
}

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
