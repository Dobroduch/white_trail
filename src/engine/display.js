// Display: resolution configuration, the world framebuffer, and the device-resolution output canvas.
//
// ── Coordinate spaces (keep these distinct) ─────────────────────────────────────────────────────
//  • NATIVE     480×270  The game's logical pixel grid. Camera scrolling, sprite placement, lighting,
//                        snow and pointer input resolve to this grid. New art (e.g. Pixelorama exports)
//                        should be authored at this density: 1 asset pixel = 1 native pixel.
//  • WORLD      units    Positions, speeds, collision, scene widths and all legacy art. One world unit
//                        is one pixel of the original 320×180 art, shown at WORLD_SCALE = 1.5 native
//                        px, so the camera still frames VIEW_W×VIEW_H = 320×180 world units: the same
//                        composition as before, not a zoomed-out view.
//  • FRAMEBUFFER 960×540 Where the world is composited (FB_SCALE = 2 px per native px). This is the
//                        smallest grid on which BOTH legacy pixels (exactly 3 px) and native pixels
//                        (exactly 2 px) are whole, so nothing is resampled unevenly or blurred.
//  • UI         units    HUD/menus/dialogue layout units, UI_W×UI_H = 320×180 (UI_SCALE = 1.5 native px
//                        per unit). Text is vector-rendered at device resolution, so readability depends
//                        only on apparent size, which this keeps identical to the previous build.
//  • DEVICE     px       The output canvas backing store (CSS size × devicePixelRatio).
//  • CSS        px       The canvas's on-page size and pointer-event coordinates.
//
// Scaling (16:9 always preserved, never stretched; letterbox = page background):
//  • 'auto'    (default) — the largest whole multiple of 480×270 when it fills ≥ 90% of the window;
//               otherwise "sharp fit": nearest-neighbour upscale to a whole multiple, then one
//               smooth downsample to the exact fitting size (fills the window, only a hairline of
//               filtering).
//  • 'integer' — always the largest whole multiple of 480×270 (crispest; may leave wide margins).
// Camera framing zoom uses the same integer-upscale-then-sample path, so zoom never shimmers.
export const NATIVE_W = 480;
export const NATIVE_H = 270;
export const WORLD_SCALE = 1.5; // native px per world unit
export const VIEW_W = NATIVE_W / WORLD_SCALE; // 320 world units visible at zoom 1
export const VIEW_H = NATIVE_H / WORLD_SCALE; // 180
export const FB_SCALE = 2; // framebuffer px per native px
export const FB_W = NATIVE_W * FB_SCALE;
export const FB_H = NATIVE_H * FB_SCALE;
export const FB_PER_WORLD = FB_SCALE * WORLD_SCALE; // 3: framebuffer px per world unit (legacy pixel)
export const UI_W = 320;
export const UI_H = 180;
export const UI_SCALE = NATIVE_W / UI_W; // native px per UI unit

// Snap a world-unit value to the native pixel grid (multiples of 1/WORLD_SCALE).
export const snapN = (v) => Math.round(v * WORLD_SCALE) / WORLD_SCALE;

export class Display {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fb = makeCanvas(FB_W, FB_H);
    this.fbCtx = this.fb.getContext('2d');
    this.fbCtx.imageSmoothingEnabled = false;
    this.mid = null; // integer-upscaled framebuffer for sharp fit / zoom composite
    this.mode = 'auto';
    this.scale = 1; // device px per NATIVE px (may be fractional in sharp-fit mode)
    this.integer = true; // true when the framebuffer maps to the output by a whole factor
    this.dpr = 1;
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    document.addEventListener('fullscreenchange', this.resize);
    this.resize();
  }

  setMode(mode) {
    const m = mode === 'integer' ? 'integer' : 'auto';
    if (m !== this.mode) { this.mode = m; this.resize(); }
  }

  // Cheap per-frame guard: some environments change the viewport without a resize event.
  ensureSize() {
    if (this.currentKey() !== this.sizeKey) this.resize();
  }
  currentKey() { return window.innerWidth + 'x' + window.innerHeight + '@' + window.devicePixelRatio + ':' + this.mode; }

  resize() {
    this.sizeKey = this.currentKey();
    // ?dpr=N overrides the device pixel ratio (debug / capture tooling only).
    const forced = Number(new URLSearchParams(location.search).get('dpr'));
    const dpr = forced > 0 ? forced : window.devicePixelRatio || 1;
    const vw = Math.max(1, Math.floor(window.innerWidth * dpr));
    const vh = Math.max(1, Math.floor(window.innerHeight * dpr));
    const out = fitSize(vw, vh, this.mode);
    this.scale = out.w / NATIVE_W;
    this.fbFactor = out.w / FB_W;
    this.integer = Number.isInteger(this.fbFactor);
    this.dpr = dpr;
    this.canvas.width = out.w;
    this.canvas.height = out.h;
    this.canvas.style.width = out.w / dpr + 'px';
    this.canvas.style.height = out.h / dpr + 'px';
    this.ctx.imageSmoothingEnabled = false;
    // Upscale factor for the composite buffer: at least the output factor (times max zoom) so the
    // single bilinear step mostly downsamples, which keeps pixel edges crisp.
    const mk = Math.max(2, Math.ceil(this.fbFactor * 1.35));
    if (!this.mid || this.midK !== mk) {
      this.midK = mk;
      this.mid = makeCanvas(FB_W * mk, FB_H * mk);
      this.midCtx = this.mid.getContext('2d');
      this.midCtx.imageSmoothingEnabled = false;
    }
  }

  // Composite the framebuffer to the output. zoom >= 1; (fx, fy) is the focus point in NATIVE px.
  present(zoom, fx, fy) {
    const ctx = this.ctx;
    const ow = this.canvas.width, oh = this.canvas.height;
    if (zoom <= 1.001 && this.integer) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.fb, 0, 0, ow, oh);
      return;
    }
    const c = Display.crop(zoom, fx, fy);
    const k = this.midK * FB_SCALE; // mid px per native px
    this.midCtx.drawImage(this.fb, 0, 0, this.mid.width, this.mid.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.mid, c.x * k, c.y * k, c.w * k, c.h * k, 0, 0, ow, oh);
    ctx.imageSmoothingEnabled = false;
  }

  // The region of the native frame (NATIVE px) that is visible at a given framing zoom.
  static crop(zoom, fx, fy) {
    if (zoom <= 1.001) return { x: 0, y: 0, w: NATIVE_W, h: NATIVE_H };
    const cw = NATIVE_W / zoom, ch = NATIVE_H / zoom;
    return {
      x: Math.min(Math.max(fx - cw / 2, 0), NATIVE_W - cw),
      y: Math.min(Math.max(fy - ch / 2, 0), NATIVE_H - ch),
      w: cw, h: ch,
    };
  }

  // Map a pre-zoom native point to the post-zoom native screen point (and back).
  static projectZoom(px, py, zoom, fx, fy) {
    const c = Display.crop(zoom, fx, fy);
    return { x: (px - c.x) * (NATIVE_W / c.w), y: (py - c.y) * (NATIVE_H / c.h) };
  }
  static unprojectZoom(sx, sy, zoom, fx, fy) {
    const c = Display.crop(zoom, fx, fy);
    return { x: c.x + sx * (c.w / NATIVE_W), y: c.y + sy * (c.h / NATIVE_H) };
  }

  // Browser client (CSS) coordinates -> NATIVE 480×270 screen coordinates. Works at any scale,
  // DPR, letterbox offset or fullscreen state (it measures the canvas's actual on-page box).
  // Returns null outside the frame.
  clientToNative(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    const x = ((clientX - r.left) / r.width) * NATIVE_W;
    const y = ((clientY - r.top) / r.height) * NATIVE_H;
    if (x < 0 || y < 0 || x >= NATIVE_W || y >= NATIVE_H) return null;
    return { x, y };
  }
  // Browser client coordinates -> UI layout units (dialogue choices, menus).
  clientToUI(clientX, clientY) {
    const n = this.clientToNative(clientX, clientY);
    return n && { x: n.x / UI_SCALE, y: n.y / UI_SCALE };
  }
}

// Output size in device px for a device-px viewport. Exposed for tests/tooling.
export function fitSize(vw, vh, mode = 'auto') {
  const fit = Math.min(vw / NATIVE_W, vh / NATIVE_H);
  const k = Math.floor(fit);
  if (k >= 1 && (mode === 'integer' || k / fit >= 0.9)) return { w: NATIVE_W * k, h: NATIVE_H * k, integer: true };
  // sharp fit: largest exact 16:9 size (width a multiple of 16 so height stays integral)
  let w = Math.max(16, Math.floor((NATIVE_W * fit) / 16) * 16);
  let h = (w / 16) * 9;
  if (h > vh) { h = Math.max(9, Math.floor(vh / 9) * 9); w = (h / 9) * 16; }
  return { w, h, integer: false };
}

// ---------------- fullscreen ----------------
export function isFullscreen() { return !!document.fullscreenElement; }
export function toggleFullscreen() {
  try {
    if (document.fullscreenElement) return document.exitFullscreen();
    const el = document.documentElement;
    if (!el.requestFullscreen) { console.warn('[display] Fullscreen API not available in this browser.'); return null; }
    return el.requestFullscreen({ navigationUI: 'hide' }).catch((err) => console.warn('[display] fullscreen refused:', err.message));
  } catch (err) {
    console.warn('[display] fullscreen failed:', err.message);
    return null;
  }
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}
