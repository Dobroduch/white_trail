// Display: owns the 320x180 logical world buffer and the device-resolution output canvas.
// World pixels are scaled by an integer factor (letterboxed). Camera "framing zoom" is done by
// first upscaling the crisp world with nearest-neighbour to an integer multiple, then sampling a
// cropped region with bilinear filtering. This keeps zoom transitions smooth without pixel shimmer.
export const W = 320;
export const H = 180;

export class Display {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.low = makeCanvas(W, H);
    this.lowCtx = this.low.getContext('2d');
    this.lowCtx.imageSmoothingEnabled = false;
    this.mid = null; // upscaled buffer for zoom composite
    this.scale = 1; // device pixels per logical pixel (integer)
    this.dpr = 1;
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  // Cheap per-frame guard: some environments change the viewport without a resize event.
  ensureSize() {
    const key = window.innerWidth + 'x' + window.innerHeight + '@' + window.devicePixelRatio;
    if (key !== this.sizeKey) this.resize();
  }

  resize() {
    this.sizeKey = window.innerWidth + 'x' + window.innerHeight + '@' + window.devicePixelRatio;
    // ?dpr=N overrides the device pixel ratio (debug / capture tooling only).
    const forced = Number(new URLSearchParams(location.search).get('dpr'));
    const dpr = forced > 0 ? forced : window.devicePixelRatio || 1;
    const vw = Math.max(1, window.innerWidth * dpr);
    const vh = Math.max(1, window.innerHeight * dpr);
    const scale = Math.max(1, Math.floor(Math.min(vw / W, vh / H)));
    this.scale = scale;
    this.dpr = dpr;
    this.canvas.width = W * scale;
    this.canvas.height = H * scale;
    this.canvas.style.width = (W * scale) / dpr + 'px';
    this.canvas.style.height = (H * scale) / dpr + 'px';
    this.ctx.imageSmoothingEnabled = false;
    // Upscale factor for the zoom buffer: big enough that bilinear sampling mostly downsamples.
    const k = Math.max(2, Math.ceil(scale * 1.35));
    if (!this.mid || this.mid.width !== W * k) {
      this.midK = k;
      this.mid = makeCanvas(W * k, H * k);
      this.midCtx = this.mid.getContext('2d');
      this.midCtx.imageSmoothingEnabled = false;
    }
  }

  // Composite the low-res world to the output. zoom >= 1; (fx, fy) is the logical focus point.
  present(zoom, fx, fy) {
    const ctx = this.ctx;
    const S = this.scale;
    if (zoom <= 1.001) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.low, 0, 0, W * S, H * S);
      return;
    }
    const cw = W / zoom;
    const ch = H / zoom;
    let cx = Math.min(Math.max(fx - cw / 2, 0), W - cw);
    let cy = Math.min(Math.max(fy - ch / 2, 0), H - ch);
    const k = this.midK;
    this.midCtx.drawImage(this.low, 0, 0, W * k, H * k);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.mid, cx * k, cy * k, cw * k, ch * k, 0, 0, W * S, H * S);
    ctx.imageSmoothingEnabled = false;
  }

  // Map a logical (pre-zoom) world-buffer point to post-zoom logical screen coordinates.
  static projectZoom(px, py, zoom, fx, fy) {
    if (zoom <= 1.001) return { x: px, y: py };
    const cw = W / zoom, ch = H / zoom;
    const cx = Math.min(Math.max(fx - cw / 2, 0), W - cw);
    const cy = Math.min(Math.max(fy - ch / 2, 0), H - ch);
    return { x: (px - cx) * zoom, y: (py - cy) * zoom };
  }
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}
