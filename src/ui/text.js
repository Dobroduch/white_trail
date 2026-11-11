// UI drawing helpers. The interface is drawn on the output canvas (device resolution) in UI layout
// units: a UI_W×UI_H (320×180) 16:9 frame, 1 unit = UI_SCALE (1.5) native px. Keeping the layout
// units fixed across the 480×270 migration keeps every panel and font at its previous apparent size;
// text is rendered as vector glyphs at device resolution, so it is as sharp as the display allows.
// New UI that should sit on the native pixel grid can multiply native coordinates by 1 / UI_SCALE.
import { UI_W, UI_H, UI_SCALE } from '../engine/display.js';
export { UI_W, UI_H, UI_SCALE };
export const UI_CX = UI_W / 2;
export const SERIF = "Georgia, 'Times New Roman', Times, serif";
export const UI = {
  bone: '#f1f5f9', dim: '#94a3b8', faint: '#64748b', amber: '#f59e0b', amberDim: '#b45309',
  panel: 'rgba(9,13,22,0.9)', edge: '#334155', edgeHi: '#475569',
  paper: '#d8ccb0', paperDark: '#c4b694', ink: '#2a2118', inkDim: '#5a4a38', inkRed: '#7f1d1d', rule: '#b3a27c',
};

export function font(ctx, size, { italic = false, bold = false, family = SERIF } = {}) {
  ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px ${family}`;
}

const wrapCache = new Map();
export function wrap(ctx, text, maxW) {
  const key = ctx.font + '|' + maxW + '|' + text;
  const hit = wrapCache.get(key);
  if (hit) return hit;
  const out = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
    }
    out.push(line);
  }
  if (wrapCache.size > 600) wrapCache.clear();
  wrapCache.set(key, out);
  return out;
}

export function text(ctx, str, x, y, col, align = 'left') {
  ctx.fillStyle = col;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

// letter-spaced caps (titles, labels)
export function spaced(ctx, str, x, y, col, spacing, align = 'left') {
  ctx.fillStyle = col;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let w = 0;
  for (const ch of str) w += ctx.measureText(ch).width + spacing;
  w -= spacing;
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  for (const ch of str) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; }
  return w;
}

// Pixel-notched panel
export function panel(ctx, x, y, w, h, fill = UI.panel, edge = UI.edge) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  if (!edge) return;
  ctx.fillStyle = edge;
  ctx.fillRect(x + 2, y, w - 4, 1);
  ctx.fillRect(x + 2, y + h - 1, w - 4, 1);
  ctx.fillRect(x, y + 2, 1, h - 4);
  ctx.fillRect(x + w - 1, y + 2, 1, h - 4);
  ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + w - 2, y + 1, 1, 1);
  ctx.fillRect(x + 1, y + h - 2, 1, 1); ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
}

export function keycap(ctx, label, x, y, col = UI.bone) {
  font(ctx, 4.6, { bold: true });
  const w = Math.max(6, ctx.measureText(label).width + 3);
  panel(ctx, x, y - 5.5, w, 7, 'rgba(241,245,249,0.08)', col);
  text(ctx, label, x + w / 2, y, col, 'center');
  return w;
}
