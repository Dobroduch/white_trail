// Display: owns the 320x180 logical world buffer and the device-resolution output canvas.
//
// Scaling (16:9 is always preserved; the image is never stretched):
//  • 'auto'    (default) — pixel-perfect integer scaling when it fills the window well
//               (≥ 90% of the largest fitting size); otherwise "sharp fit": the frame is upscaled
//               with nearest-neighbour to an integer multiple, then smoothly downsampled once to
//               the exact fitting size, so it fills the window with only a hairline of filtering.
//  • 'integer' — always the largest whole-number multiple (crispest, may leave wide margins).
// Camera "framing zoom" uses the same integer-upscale-then-sample path, so zoom never shimmers.
// The canvas is sized to the game frame and centred by CSS; letterbox bars are the page background.
export const W = 320;
export const H = 180;

export class Display {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.low = makeCanvas(W, H);
    this.lowCtx = this.low.getContext('2d');
    this.lowCtx.imageSmoothingEnabled = false;
    this.mid = null; // integer-upscaled buffer for sharp fit / zoom composite
    this.mode = 'auto';
    this.scale = 1; // device pixels per logical pixel (may be fractional in sharp-fit mode)
    this.integer = true; // true when scale is a whole number
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
    const fit = Math.min(vw / W, vh / H);
    const k = Math.floor(fit);
    let outW, outH;
    if (k >= 1 && (this.mode === 'integer' || k / fit >= 0.9)) {
      outW = W * k; outH = H * k; // pixel-perfect
    } else {
      // sharp fit: largest exact 16:9 size (width a multiple of 16 so height stays integral)
      outW = Math.max(16, Math.floor((W * fit) / 16) * 16);
      outH = (outW / 16) * 9;
      if (outH > vh) { outH = Math.floor(vh / 9) * 9; outW = (outH / 9) * 16; }
    }
    this.scale = outW / W;
    this.integer = Number.isInteger(this.scale);
    this.dpr = dpr;
    this.canvas.width = outW;
    this.canvas.height = outH;
    this.canvas.style.width = outW / dpr + 'px';
    this.canvas.style.height = outH / dpr + 'px';
    this.ctx.imageSmoothingEnabled = false;
    // Upscale factor for the composite buffer: at least the output scale (times max zoom) so the
    // single bilinear step mostly downsamples, which keeps pixel edges crisp.
    const mk = Math.max(2, Math.ceil(this.scale * 1.35));
    if (!this.mid || this.midK !== mk) {
      this.midK = mk;
      this.mid = makeCanvas(W * mk, H * mk);
      this.midCtx = this.mid.getContext('2d');
      this.midCtx.imageSmoothingEnabled = false;
    }
  }

  // Composite the low-res world to the output. zoom >= 1; (fx, fy) is the logical focus point.
  present(zoom, fx, fy) {
    const ctx = this.ctx;
    const ow = this.canvas.width, oh = this.canvas.height;
    if (zoom <= 1.001 && this.integer) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.low, 0, 0, ow, oh);
      return;
    }
    const c = Display.crop(zoom, fx, fy);
    const k = this.midK;
    this.midCtx.drawImage(this.low, 0, 0, W * k, H * k);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.mid, c.x * k, c.y * k, c.w * k, c.h * k, 0, 0, ow, oh);
    ctx.imageSmoothingEnabled = false;
  }

  // The region of the 320x180 world buffer that is visible at a given framing zoom.
  static crop(zoom, fx, fy) {
    if (zoom <= 1.001) return { x: 0, y: 0, w: W, h: H };
    const cw = W / zoom, ch = H / zoom;
    return {
      x: Math.min(Math.max(fx - cw / 2, 0), W - cw),
      y: Math.min(Math.max(fy - ch / 2, 0), H - ch),
      w: cw, h: ch,
    };
  }

  // Map a logical (pre-zoom) world-buffer point to post-zoom logical screen coordinates.
  static projectZoom(px, py, zoom, fx, fy) {
    const c = Display.crop(zoom, fx, fy);
    return { x: (px - c.x) * (W / c.w), y: (py - c.y) * (H / c.h) };
  }
  // Inverse of projectZoom: logical screen point -> world-buffer point.
  static unprojectZoom(sx, sy, zoom, fx, fy) {
    const c = Display.crop(zoom, fx, fy);
    return { x: c.x + sx * (c.w / W), y: c.y + sy * (c.h / H) };
  }

  // Browser client coordinates (e.g. a mouse event) -> logical 320x180 screen coordinates.
  // Works at any scale, DPR, letterbox offset or fullscreen state. Returns null outside the frame.
  clientToLogical(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    const x = ((clientX - r.left) / r.width) * W;
    const y = ((clientY - r.top) / r.height) * H;
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    return { x, y };
  }
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
