// Minimal HUD: location/time label, contextual interaction prompt, hints, barks, "noted" toast,
// and small lantern / cold cues. No bars, scores, markers or counters.
import { UI, font, text, spaced, panel, keycap, wrap, UI_W, UI_H, UI_CX, UI_LEFT, UI_RIGHT } from './text.js';
import { timeString } from '../systems/storyState.js';
import { EVIDENCE } from '../data/evidence.js';
import { drawItemIcon } from './itemIcons.js';
import { touchify } from './touchText.js';

// Dedicated panel buttons (top-right): Notebook, Inventory, Map. Pixel icons from
// assets/export/ui/hud_icons.png (assets/source/pixelorama/ui/hud_icons.pxo): three 16x16 icons.
export const HUD_BUTTONS = [
  { kind: 'notebook', key: 'N', label: 'Notebook' },
  { kind: 'inventory', key: 'I', label: 'Inventory' },
  { kind: 'map', key: 'M', label: 'Map' },
];
let icons = null;
export function loadHudIcons(url = 'assets/export/ui/hud_icons.png') {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { icons = img; resolve(); };
    img.onerror = () => { console.error(`[hud] could not load ${url}; panel buttons will show letters only.`); resolve(); };
    img.src = url + '?v=1';
  });
}
const BTN = 14, GAP = 3; // UI units
export function hudButtonRects() {
  const n = HUD_BUTTONS.length;
  const x0 = UI_RIGHT - 6 - n * BTN - (n - 1) * GAP;
  return HUD_BUTTONS.map((b, i) => ({ ...b, x: x0 + i * (BTN + GAP), y: 5, w: BTN, h: BTN }));
}
export function hudButtonAt(ux, uy) {
  return hudButtonRects().find((r) => ux >= r.x && ux <= r.x + r.w && uy >= r.y && uy <= r.y + r.h) || null;
}

export class HUD {
  constructor(game) {
    this.game = game;
    this.label = null; this.hintMsg = null; this.barkMsg = null; this.toasts = []; this.titleT = null;
  }
  showLabel(scene, state) {
    this.label = { text: `${scene.name}  —  ${timeString(state.time)}`, t: 0 };
  }
  showTitle() { this.titleT = 0; }
  hint(msg, dur = 6) { this.hintMsg = { text: this.game.touchUI && this.game.touchUI() ? touchify(msg) : msg, t: 0, dur }; }
  bark(msg, dur = 4.2) { this.barkMsg = { text: msg, t: 0, dur }; }
  noted(id, detail) {
    const ev = EVIDENCE[id];
    if (!ev) return;
    const kind = ev.category === 'TESTIMONY' ? 'Statement noted' : detail ? 'Noted — closer look' : 'Noted';
    this.toasts.push({ head: kind, text: ev.title, t: 0 });
    if (this.toasts.length > 3) this.toasts.shift();
  }
  item(name, id) { this.toasts.push({ head: 'Taken', text: name, icon: id, t: 0 }); }
  clear() { this.label = null; this.hintMsg = null; this.barkMsg = null; this.toasts = []; this.titleT = null; }

  update(dt) {
    if (this.label) { this.label.t += dt; if (this.label.t > 6) this.label = null; }
    if (this.hintMsg) { this.hintMsg.t += dt; if (this.hintMsg.t > this.hintMsg.dur) this.hintMsg = null; }
    if (this.barkMsg) { this.barkMsg.t += dt; if (this.barkMsg.t > this.barkMsg.dur) this.barkMsg = null; }
    for (const t of this.toasts) t.t += dt;
    this.toasts = this.toasts.filter((t) => t.t < 3.6);
    if (this.titleT != null) { this.titleT += dt; if (this.titleT > 7) this.titleT = null; }
  }

  drawButtons(ctx) {
    const g = this.game;
    if (g.mode !== 'play' || g.touchUI()) return; // touch: larger on-screen buttons take their place
    const active = g.overlay && g.overlay.panelKind;
    const usable = active || g.canOpenPanel();
    for (const r of hudButtonRects()) {
      const on = active === r.kind;
      const hov = g.hoverButton === r.kind;
      ctx.globalAlpha = usable ? 1 : 0.4;
      panel(ctx, r.x, r.y, r.w, r.h, on ? 'rgba(40,26,14,0.92)' : 'rgba(9,13,22,0.78)', on || hov ? UI.amber : UI.edgeHi);
      const i = HUD_BUTTONS.findIndex((b) => b.kind === r.kind);
      if (icons) {
        const sm = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(icons, i * 16, 0, 16, 16, r.x + 1, r.y + 1, 12, 12);
        ctx.imageSmoothingEnabled = sm;
      } else { font(ctx, 6); text(ctx, r.key, r.x + r.w / 2, r.y + 9.5, UI.bone, 'center'); }
      font(ctx, 3.6);
      text(ctx, r.key, r.x + r.w / 2, r.y + r.h + 4.6, hov || on ? UI.amber : UI.faint, 'center');
      if (hov && !on) { font(ctx, 4.2, { italic: true }); text(ctx, r.label, r.x + r.w / 2, r.y + r.h + 10, UI.dim, 'center'); }
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx) {
    const g = this.game;
    const fadeIO = (t, inT, hold, outT) => t < inT ? t / inT : t < inT + hold ? 1 : Math.max(0, 1 - (t - inT - hold) / outT);
    // title over the opening
    if (this.titleT != null) {
      const a = fadeIO(this.titleT, 1.6, 3.2, 2.2);
      ctx.globalAlpha = a;
      font(ctx, 15);
      spaced(ctx, 'THE WHITE TRAIL', UI_CX, 46, UI.bone, 3.2, 'center');
      ctx.globalAlpha = 1;
    }
    // location / time label
    if (this.label && !g.dialogue.active) {
      const a = fadeIO(this.label.t, 0.8, 3.6, 1.6);
      ctx.globalAlpha = a;
      font(ctx, 5.2);
      spaced(ctx, this.label.text, 12, 16, UI.bone, 0.9);
      ctx.fillStyle = UI.amberDim;
      ctx.fillRect(12, 19, 24, 0.6);
      ctx.globalAlpha = 1;
    }
    // interaction prompt near the target
    const p = g.prompt;
    const touch = g.touchUI();
    if (p && g.canInteractUI()) {
      font(ctx, 5);
      const label = p.label;
      const tw = ctx.measureText(label).width;
      const kw = touch ? 0 : 10; // touch: the act button carries the verb, so no key cap
      const w = tw + 10 + kw, h = 9;
      let x = Math.round(p.sx - w / 2), y = Math.round(p.sy - h - 3);
      x = Math.max(UI_LEFT + 4, Math.min(UI_RIGHT - 4 - w, x)); y = Math.max(22, Math.min(118, y));
      panel(ctx, x, y, w, h, 'rgba(9,13,22,0.82)', touch ? UI.amberDim : UI.edgeHi);
      if (!touch) keycap(ctx, 'E', x + 3, y + 7, UI.amber);
      text(ctx, label, x + 3 + kw, y + 6.6, UI.bone);
    }
    // hint (tutorial-style, bottom-left; above the walk buttons in touch mode)
    if (this.hintMsg && !g.dialogue.active) {
      const a = fadeIO(this.hintMsg.t, 0.5, this.hintMsg.dur - 1.5, 1);
      ctx.globalAlpha = a * 0.95;
      font(ctx, 4.9);
      const lines = wrap(ctx, this.hintMsg.text, 180);
      const h = lines.length * 6.5 + 4;
      const bottom = touch ? 134 : 170;
      const x0 = touch ? Math.max(8, UI_LEFT + 10) : 8;
      panel(ctx, x0, bottom - h, 188, h, 'rgba(9,13,22,0.7)', null);
      lines.forEach((l, i) => text(ctx, l, x0 + 4, bottom - h + 7 + i * 6.5, UI.dim));
      ctx.globalAlpha = 1;
    }
    // bark: Silas's passing observation
    if (this.barkMsg && !g.dialogue.active) {
      const a = fadeIO(this.barkMsg.t, 0.4, this.barkMsg.dur - 1.2, 0.8);
      ctx.globalAlpha = a;
      font(ctx, 5.6, { italic: true });
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 2;
      text(ctx, this.barkMsg.text, UI_CX, 104, UI.bone, 'center');
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    // "noted" toasts — quiet, top-right
    this.toasts.forEach((t, i) => {
      const a = fadeIO(t.t, 0.3, 2.5, 0.8);
      ctx.globalAlpha = a;
      font(ctx, 4.5, { italic: true });
      const head = t.head;
      font(ctx, 5.2);
      const iw = t.icon ? 14 : 0; // a taken item shows its own illustration
      const w = Math.max(60, ctx.measureText(t.text).width + 12 + iw);
      // touch: top-right under the panel buttons, clear of the act button in the bottom-right corner
      const y = touch ? 30 + i * 17 : 146 - (this.toasts.length - 1 - i) * 17;
      panel(ctx, UI_RIGHT - 8 - w, y, w, 15, 'rgba(9,13,22,0.78)', UI.edge);
      if (t.icon) drawItemIcon(ctx, t.icon, UI_RIGHT - 8 - w + 10, y + 7.5, 13);
      font(ctx, 4.3, { italic: true });
      text(ctx, head, UI_RIGHT - 8 - w + 6 + iw, y + 6, UI.amber);
      font(ctx, 5.2);
      text(ctx, t.text, UI_RIGHT - 8 - w + 6 + iw, y + 12, UI.bone);
      ctx.globalAlpha = 1;
    });
    this.drawButtons(ctx);
    // a hint can be asked for (only after the stuck delay; nothing is shown unasked)
    const tier = g.hints ? g.hints.available() : 0;
    if (tier && g.canInteractUI() && !this.hintMsg && !touch) { // touch: the hint button glows instead
      const a = 0.55 + Math.sin(g.time * 2) * 0.15;
      ctx.globalAlpha = a;
      const w = keycap(ctx, 'H', 10, 170, UI.amber);
      font(ctx, 4.7, { italic: true });
      text(ctx, tier === 1 ? 'Something comes to mind.' : 'Something more comes to mind.', 13 + w, 169.6, UI.dim);
      ctx.globalAlpha = 1;
    }
    // small status cues
    const s = g.state;
    if (g.mode === 'play' && !g.dialogue.active && touch) {
      // touch: the lantern button shows its own state; the cold cue moves to the top-left, under the place name
      if (s.warmth < 35) { font(ctx, 4.4, { italic: true }); text(ctx, 'cold', Math.max(12, UI_LEFT + 12), 28, '#94a3b8'); }
    } else if (g.mode === 'play' && !g.dialogue.active) {
      let cx = UI_RIGHT - 8;
      if (s.lanternOn) {
        ctx.fillStyle = UI.amber; ctx.globalAlpha = 0.8;
        ctx.fillRect(cx - 3, 168, 3, 4); ctx.fillRect(cx - 4, 167, 5, 1); ctx.fillRect(cx - 2, 166, 1, 1);
        ctx.globalAlpha = 1;
        cx -= 9;
      }
      if (s.warmth < 35) {
        font(ctx, 4.4, { italic: true });
        text(ctx, 'cold', cx, 172, '#94a3b8', 'right');
      }
    }
  }
}
