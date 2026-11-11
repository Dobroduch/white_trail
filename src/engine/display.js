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
// ── Responsive width ────────────────────────────────────────────────────────────────────────────
// The logical HEIGHT is fixed (270 native px = 180 world units, so vertical composition never
// changes). The logical WIDTH follows the browser's aspect ratio: a wider window shows more of the
// world to the left/right instead of letterboxing, a narrower one shows less. NATIVE_W is always a
// multiple of 3 (whole world units at WORLD_SCALE 1.5) and is clamped to [MIN_NATIVE_W, MAX_NATIVE_W];
// only beyond that range (portrait or >2.67:1 windows) does a thin letterbox appear.
// These are live ES-module bindings: importers always see the current values after a resize.
export const NATIVE_H = 270;
export const MIN_NATIVE_W = 360; // 4:3
export const MAX_NATIVE_W = 720; // 2.67:1
export const WORLD_SCALE = 1.5; // native px per world unit
export const VIEW_H = NATIVE_H / WORLD_SCALE; // 180
export const MAX_VIEW_W = MAX_NATIVE_W / WORLD_SCALE; // 480: parallax layers are painted this wide
export const FB_SCALE = 2; // framebuffer px per native px
export const FB_H = NATIVE_H * FB_SCALE;
export const FB_PER_WORLD = FB_SCALE * WORLD_SCALE; // 3: framebuffer px per world unit (legacy pixel)
export let NATIVE_W = 480;
export let VIEW_W = NATIVE_W / WORLD_SCALE; // world units visible horizontally at zoom 1
export let FB_W = NATIVE_W * FB_SCALE;
// UI layout: a fixed 320x180-unit frame (menus, dialogue, notebook keep their proven layout) centred
// horizontally on the screen. UI_OX is the frame's left offset in UI units (0 at 16:9, positive on
// wider screens, negative on narrower), so HUD elements can anchor to the real screen edges with
// UI_LEFT / UI_RIGHT.
export const UI_W = 320;
export const UI_H = 180;
export const UI_SCALE = NATIVE_H / UI_H; // 1.5 native px per UI unit
export let UI_OX = 0;
export let UI_OY = 0;
export let UI_LEFT = 0;
export let UI_RIGHT = UI_W;
export let UI_TOP = 0;
export let UI_BOTTOM = UI_H;
export let UI_DEV = 1; // device px per UI unit
// The 320x180 frame is scaled to fit the screen (by height on wide screens, by width on narrow
// ones) and centred. Called from Display.resize with the output size and device px per native px.
function setUIFrame(ow, oh, devPerNative) {
  UI_DEV = Math.min(oh / UI_H, ow / UI_W);
  UI_OX = (ow / UI_DEV - UI_W) / 2;
  UI_OY = (oh / UI_DEV - UI_H) / 2;
  UI_LEFT = -UI_OX; UI_RIGHT = UI_W + UI_OX;
  UI_TOP = -UI_OY; UI_BOTTOM = UI_H + UI_OY;
  uiPerNative = devPerNative / UI_DEV;
}
let uiPerNative = 1 / 1.5;
// NATIVE screen px -> UI layout units (accounts for the centred, fitted frame).
export function nativeToUI(nx, ny) { return { x: nx * uiPerNative - UI_OX, y: ny * uiPerNative - UI_OY }; }
const sizeListeners = new Set();
export function onLogicalResize(fn) { sizeListeners.add(fn); }
function setLogicalWidth(nw) {
  if (nw === NATIVE_W) return false;
  NATIVE_W = nw;
  VIEW_W = nw / WORLD_SCALE;
  FB_W = nw * FB_SCALE;
  for (const fn of sizeListeners) { try { fn(nw); } catch (e) { console.error('[display] resize listener:', e); } }
  return true;
}

// Snap a world-unit value to the native pixel grid (multiples of 1/WORLD_SCALE).
export const snapN = (v) => Math.round(v * WORLD_SCALE) / WORLD_SCALE;

export class Display {
  static limitW = Infinity; // native px of the current scene (the zoom crop never shows beyond it)
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fb = null; // allocated in resize() once the logical width is known
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
    setLogicalWidth(out.nw);
    if (!this.fb || this.fb.width !== FB_W) {
      this.fb = makeCanvas(FB_W, FB_H);
      this.fbCtx = this.fb.getContext('2d');
      this.fbCtx.imageSmoothingEnabled = false;
    }
    this.scale = out.h / NATIVE_H; // device px per native px (uniform on both axes)
    this.fbFactor = out.h / FB_H;
    this.integer = Number.isInteger(this.fbFactor) && out.w === FB_W * this.fbFactor;
    this.dpr = dpr;
    this.canvas.width = out.w;
    this.canvas.height = out.h;
    this.canvas.style.width = out.w / dpr + 'px';
    this.canvas.style.height = out.h / dpr + 'px';
    this.ctx.imageSmoothingEnabled = false;
    setUIFrame(out.w, out.h, this.scale);
    // Upscale factor for the composite buffer: at least the output factor (times max zoom) so the
    // single bilinear step mostly downsamples, which keeps pixel edges crisp.
    const mk = Math.max(2, Math.ceil(this.fbFactor * 1.35));
    if (!this.mid || this.midK !== mk || this.mid.width !== FB_W * mk) {
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
    // never show past the scene's right edge (scenes narrower than the view are zoomed to fit)
    const maxX = Math.max(0, Math.min(NATIVE_W, Display.limitW) - cw);
    return {
      x: Math.min(Math.max(fx - cw / 2, 0), maxX),
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
    return n && nativeToUI(n.x, n.y);
  }
}

// Output size in device px for a device-px viewport, plus the logical width `nw` (native px).
// 'auto' fills the window: the height sets a uniform scale and the logical width extends to the
// window's aspect ratio. 'integer' keeps a whole-number scale (crispest; may leave margins).
// Exposed for tests/tooling.
export function fitSize(vw, vh, mode = 'auto') {
  if (mode === 'integer') {
    const k = Math.max(1, Math.min(Math.floor(vh / NATIVE_H), Math.floor(vw / MIN_NATIVE_W)));
    const nw = Math.min(MAX_NATIVE_W, Math.max(MIN_NATIVE_W, Math.floor(vw / k / 3) * 3));
    return { w: nw * k, h: NATIVE_H * k, nw, integer: true };
  }
  let s = vh / NATIVE_H; // device px per native px
  let nw = Math.max(3, Math.round(vw / s / 3) * 3);
  if (nw > MAX_NATIVE_W) nw = MAX_NATIVE_W; // ultra-wide: thin side margins
  if (nw < MIN_NATIVE_W) { nw = MIN_NATIVE_W; s = vw / nw; } // portrait-ish: thin top/bottom margins
  const h = Math.min(vh, Math.round(NATIVE_H * s));
  const w = Math.min(vw, Math.round(nw * s));
  return { w, h, nw, integer: false };
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
