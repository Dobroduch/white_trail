// Touch controls for phones and tablets in landscape (styles: src/ui/touch.css).
//
// The on-screen buttons press the same key codes as the keyboard (Input.virtualDown / virtualUp), so every
// system that reads actions (movement, interaction, dialogue, menus, the notebook, the case review, the map)
// works unchanged, and keyboard and mouse keep working alongside. Taps on the canvas itself are ordinary
// pointer clicks: tap the ground to walk there, tap a person or a clue to go to it and use it, tap dialogue to
// continue, tap a choice or a menu line to pick it.
//
// Which buttons show depends on what the game is doing (see context()):
//   world     ◀ ▶ walk · act (labelled with what it will do) · lantern · hint · Notebook / Inventory / Map · pause
//   dialogue  only pause (tap the text to continue);  choice  ▲ ▼ and OK beside the tappable choices
//   cutscene  only pause, dimmed;  menu  D-pad, OK, Back;  panel  D-pad, OK, Back, the panel tabs (+ notebook keys)
// Buttons sit in the screen corners, never over the middle of the frame where Silas, the clues and the
// dialogue box are; they are laid out from the canvas's real on-page box, inside the safe area.
//
// Touch mode turns on by itself on a coarse-pointer device or after the first touch, and can be forced with
// the Touch controls setting or ?touch=1 / ?touch=0. In portrait on a touch device the game is suspended
// behind a rotate prompt (#rotate) and resumes exactly where it was.
import { isCoarsePointer, toggleFullscreen } from '../engine/display.js';

const SVG = {
  left: '<svg viewBox="0 0 8 8"><path d="M5.5 1L2 4l3.5 3z"/></svg>',
  right: '<svg viewBox="0 0 8 8"><path d="M2.5 1L6 4 2.5 7z"/></svg>',
  up: '<svg viewBox="0 0 8 8"><path d="M1 5.5L4 2l3 3.5z"/></svg>',
  down: '<svg viewBox="0 0 8 8"><path d="M1 2.5h6L4 6z"/></svg>',
  pause: '<svg viewBox="0 0 8 8"><path d="M1 1h6v1H1zM1 3.5h6v1H1zM1 6h6v1H1z"/></svg>',
  hand: '<svg viewBox="0 0 8 8" style="shape-rendering:auto"><circle cx="3.3" cy="3.3" r="2.1" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M4.8 4.8L7.2 7.2" stroke="currentColor" stroke-width="1.4"/></svg>',
  lantern: '<svg viewBox="0 0 8 8"><path d="M3 0h2v1h1v1H2V1h1zM2 2h4v4H2zM1 6h6v1H1z"/><path fill="#05070c" d="M3 3h2v2H3z"/></svg>',
  hint: '<svg viewBox="0 0 8 8"><path d="M2 1h4v1h1v2H6v1H5v1H3V4h1V3h1V2H3v1H2V2h0zM3 7h2v1H3z"/></svg>',
  back: '<svg viewBox="0 0 8 8"><path d="M3 1h1v1h3v4H6V3H4v1H3V3H2V2h1z"/><path d="M2 2h1v1H2z"/></svg>',
  ok: '<svg viewBox="0 0 8 8"><path d="M6 1h1v2H6v1H5v1H4v1H3v1H2V6H1V4h1v1h1V4h1V3h1V2h1z"/></svg>',
};

// [group, contexts it shows in]
const GROUPS = {
  move: ['world'],
  act: ['world'],
  panels: ['world', 'panel'],
  sysTop: ['world'],
  sysLow: ['dialogue', 'cutscene'],
  dpad: ['menu', 'choice'],
  okback: ['menu'],
  okonly: ['choice'],
  // Notebook / Inventory / Map: the page itself is tappable (tabs, lines, slots, mind-map nodes), so instead of
  // a D-pad over the writing there is one slim bar along the bottom: ▲ ▼ to scroll, the panel tabs, Back.
  updown: ['panel'],
  backonly: ['panel'],
  nbx: ['panel-notebook'],
};

export class TouchControls {
  constructor(game, root = document.getElementById('touch')) {
    this.game = game;
    this.input = game.input;
    this.root = root;
    this.ctx = null;
    this.held = new Map(); // pointerId -> { btn, code }
    this.active = false;
    this.blocked = false;
    this.layoutKey = '';
    this.state = {};
    const q = new URLSearchParams(location.search);
    this.forced = q.has('touch') ? q.get('touch') !== '0' : null;
    this.sawTouch = false;
    if (root) this.build();
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && !this.sawTouch) { this.sawTouch = true; this.refreshMode(); }
    }, { capture: true });
    const recheck = () => { this.layoutKey = ''; this.refreshMode(); };
    window.addEventListener('resize', recheck);
    window.addEventListener('orientationchange', recheck);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', recheck);
    // a blur or a hidden tab must never leave Silas walking on a held button
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseAll(); });
    this.refreshMode();
  }

  // ---------------- mode / orientation ----------------
  wanted() {
    const pref = this.game.settings.touchControls || 'auto';
    if (this.forced != null) return this.forced;
    if (pref === 'on') return true;
    if (pref === 'off') return false;
    return isCoarsePointer() || this.sawTouch;
  }
  refreshMode() {
    const on = this.wanted();
    if (on !== this.active) {
      this.active = on;
      document.documentElement.classList.toggle('touch', on);
      if (!on) this.releaseAll();
      this.layoutKey = '';
    }
    // Portrait on a touch device: suspend the game behind the rotate prompt (nothing is lost; the simulation
    // simply does not step). Desktop windows that happen to be tall are left alone (they letterbox, as before).
    const portrait = window.innerHeight > window.innerWidth;
    const block = on && portrait && (isCoarsePointer() || this.sawTouch || this.forced === true);
    if (block !== this.blocked) {
      this.blocked = block;
      document.documentElement.classList.toggle('portrait-block', block);
      this.game.suspended = block;
      this.releaseAll();
      if (block) this.game.audio.suspend(); else this.game.audio.resume();
    }
  }

  // ---------------- DOM ----------------
  build() {
    const r = this.root;
    r.innerHTML = '';
    const group = (name) => { const g = document.createElement('div'); g.className = 'tc tc-' + name; g.dataset.group = name; r.appendChild(g); return g; };
    const btn = (g, { code, hold = false, repeat = false, icon, label, cls = '', aria }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.dataset.code = code;
      if (hold) b.dataset.hold = '1';
      if (repeat) b.dataset.repeat = '1';
      b.setAttribute('aria-label', aria || label || code);
      b.innerHTML = (icon || '') + (label ? `<span class="lbl">${label}</span>` : '');
      g.appendChild(b);
      this.wire(b);
      return b;
    };
    this.groups = {};
    let g = this.groups.move = group('move');
    this.btnLeft = btn(g, { code: 'ArrowLeft', hold: true, icon: SVG.left, aria: 'Walk left', cls: 'move' });
    this.btnRight = btn(g, { code: 'ArrowRight', hold: true, icon: SVG.right, aria: 'Walk right', cls: 'move' });
    g = this.groups.act = group('act');
    this.btnHint = btn(g, { code: 'KeyH', icon: SVG.hint, aria: 'Hint', cls: 'small hint' });
    this.btnLantern = btn(g, { code: 'KeyF', icon: SVG.lantern, aria: 'Lantern', cls: 'small lantern' });
    this.btnAct = btn(g, { code: 'KeyE', icon: SVG.hand, label: 'Look', aria: 'Interact', cls: 'act idle' });
    this.actLabel = this.btnAct.querySelector('.lbl');
    g = this.groups.panels = group('panels');
    const icon = (i) => `<span class="icon16" style="background-position:${i * 50}% 0"></span>`;
    this.btnNotebook = btn(g, { code: 'KeyN', icon: icon(0), aria: 'Notebook', cls: 'panel notebook' });
    this.btnInventory = btn(g, { code: 'KeyI', icon: icon(1), aria: 'Inventory', cls: 'panel inventory' });
    this.btnMap = btn(g, { code: 'KeyM', icon: icon(2), aria: 'Map', cls: 'panel map' });
    g = this.groups.sysTop = group('sysTop'); g.classList.add('tc-sys');
    btn(g, { code: 'Escape', icon: SVG.pause, aria: 'Pause menu', cls: 'pause' });
    g = this.groups.sysLow = group('sysLow'); g.classList.add('tc-sys');
    btn(g, { code: 'Escape', icon: SVG.pause, aria: 'Pause menu', cls: 'pause' });
    g = this.groups.dpad = group('dpad');
    this.dUp = btn(g, { code: 'ArrowUp', repeat: true, icon: SVG.up, aria: 'Up', cls: 'd up' });
    this.dLeft = btn(g, { code: 'ArrowLeft', repeat: true, icon: SVG.left, aria: 'Left', cls: 'd left' });
    this.dRight = btn(g, { code: 'ArrowRight', repeat: true, icon: SVG.right, aria: 'Right', cls: 'd right' });
    this.dDown = btn(g, { code: 'ArrowDown', repeat: true, icon: SVG.down, aria: 'Down', cls: 'd down' });
    g = this.groups.okback = group('okback');
    btn(g, { code: 'Escape', icon: SVG.back, label: 'Back', aria: 'Back', cls: 'back' });
    btn(g, { code: 'KeyE', icon: SVG.ok, label: 'OK', aria: 'OK', cls: 'ok' });
    g = this.groups.okonly = group('okonly');
    btn(g, { code: 'KeyE', icon: SVG.ok, label: 'OK', aria: 'OK', cls: 'ok' });
    g = this.groups.updown = group('updown');
    btn(g, { code: 'ArrowUp', repeat: true, icon: SVG.up, aria: 'Up', cls: 'd up' });
    btn(g, { code: 'ArrowDown', repeat: true, icon: SVG.down, aria: 'Down', cls: 'd down' });
    g = this.groups.backonly = group('backonly');
    btn(g, { code: 'Escape', icon: SVG.back, label: 'Back', aria: 'Back', cls: 'back' });
    g = this.groups.nbx = group('nbx');
    this.btnQuestion = btn(g, { code: 'KeyQ', label: 'Next question', aria: 'Next question', cls: 'text' });
    btn(g, { code: 'KeyC', label: 'Review case', aria: 'Review the case', cls: 'text' });
  }

  wire(b) {
    const code = b.dataset.code;
    const hold = !!b.dataset.hold;
    const press = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (b.disabled) return;
      try { b.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
      this.held.set(e.pointerId, { btn: b, code });
      b.classList.add('is-down');
      this.input.virtualDown(code);
      this.unlockAudio();
      if (b.dataset.repeat) { // menu auto-repeat, like a held arrow key
        clearTimeout(b._rep); clearInterval(b._rep);
        b._rep = setTimeout(() => { b._rep = setInterval(() => { this.input.pressedCodes.add(code); }, 110); }, 380);
      }
    };
    const release = (e) => {
      const h = this.held.get(e.pointerId);
      if (!h || h.btn !== b) return;
      this.held.delete(e.pointerId);
      this.releaseButton(b, code);
    };
    b.addEventListener('pointerdown', press);
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    b.addEventListener('lostpointercapture', release);
    // Slide between ◀ and ▶ without lifting the finger.
    if (hold) {
      b.addEventListener('pointermove', (e) => {
        const h = this.held.get(e.pointerId);
        if (!h) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const other = el && el.closest && el.closest('button[data-hold]');
        if (other && other !== h.btn && other.parentElement === b.parentElement) {
          this.releaseButton(h.btn, h.code);
          h.btn = other; h.code = other.dataset.code;
          other.classList.add('is-down');
          this.input.virtualDown(h.code);
        }
      });
    }
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
  }
  releaseButton(b, code) {
    b.classList.remove('is-down');
    clearTimeout(b._rep); clearInterval(b._rep); b._rep = null;
    // another finger may still hold the same key (e.g. two ▶ presses): keep it down then
    for (const h of this.held.values()) if (h.code === code) return;
    this.input.virtualUp(code);
  }
  releaseAll() {
    for (const h of this.held.values()) { h.btn.classList.remove('is-down'); clearTimeout(h.btn._rep); clearInterval(h.btn._rep); this.input.virtualUp(h.code); }
    this.held.clear();
  }
  // iOS only lets audio start inside a user gesture's handler, not from the game loop.
  unlockAudio() { try { this.game.audio.unlock(); this.game.audio.resume(); } catch { /* audio is optional */ } }
  // On the first tap on a touch device, try for fullscreen and a landscape lock (Android Chrome allows both
  // inside a gesture; iPhone Safari has neither and keeps the rotate prompt as the fallback).
  tryFullscreen() {
    if (this.triedFullscreen || !this.active || this.game.settings.touchFullscreen === false) return;
    this.triedFullscreen = true;
    if (!document.fullscreenEnabled || document.fullscreenElement) return this.lockLandscape();
    const p = toggleFullscreen();
    if (p && p.then) p.then(() => this.lockLandscape());
  }
  lockLandscape() {
    try {
      const o = screen.orientation;
      if (o && o.lock) o.lock('landscape').catch(() => { /* not allowed here: the rotate prompt covers it */ });
    } catch { /* unsupported */ }
  }

  // ---------------- per frame ----------------
  context() {
    const g = this.game;
    if (g.mode === 'title') {
      const t = g.overlay;
      if (t && t.constructor.name === 'TitleMenu' && !t.pressed) return 'none';
      return 'menu';
    }
    const o = g.overlay;
    if (o) {
      if (o.panelKind) return o.panelKind === 'notebook' ? 'panel-notebook' : 'panel';
      return 'menu';
    }
    if (g.transition) return 'cutscene';
    if (g.dialogue.active) return g.dialogue.choices ? 'choice' : 'dialogue';
    if (g.cutsceneBlocking() || !g.playerControl) return 'cutscene';
    return 'world';
  }

  sync() {
    if (!this.root) return;
    this.refreshMode();
    if (!this.active || this.blocked) return;
    let ctx = this.context();
    if (ctx !== this.ctx) {
      this.ctx = ctx;
      document.documentElement.dataset.tc = ctx;
      const groupsOn = new Set();
      for (const [name, ctxs] of Object.entries(GROUPS)) {
        if (ctxs.includes(ctx) || (ctx === 'panel-notebook' && ctxs.includes('panel'))) groupsOn.add(name);
      }
      for (const [name, el] of Object.entries(this.groups)) el.classList.toggle('on', groupsOn.has(name));
      this.layoutKey = ''; // the panel tabs move between the top-right corner (world) and the bottom bar (panels)
      // a held walk button must not keep walking into a menu or a conversation
      if (ctx !== 'world') for (const [id, h] of [...this.held]) if (h.btn.classList.contains('move')) { this.held.delete(id); this.releaseButton(h.btn, h.code); }
    }
    this.layout();
    this.syncState();
  }

  set(key, val, fn) { if (this.state[key] !== val) { this.state[key] = val; fn(val); } }
  syncState() {
    const g = this.game;
    if (this.ctx === 'world') {
      const p = g.prompt && g.canInteractUI() ? g.prompt : null;
      const verb = p ? String(p.label).split(' — ')[0] : '';
      this.set('act', verb, (v) => { this.actLabel.textContent = v || 'Look'; this.btnAct.classList.toggle('idle', !v); });
      this.set('lit', !!g.state.lanternOn, (v) => this.btnLantern.classList.toggle('lit', v));
      const tier = g.hints ? g.hints.available() : 0;
      this.set('hint', !!tier, (v) => this.btnHint.classList.toggle('ready', v));
      this.set('panelsOk', g.canOpenPanel(), (v) => { for (const b of [this.btnNotebook, this.btnInventory, this.btnMap]) b.disabled = !v; });
    }
    const open = g.overlay && g.overlay.panelKind;
    this.set('openPanel', open || '', (v) => {
      this.btnNotebook.classList.toggle('active', v === 'notebook');
      this.btnInventory.classList.toggle('active', v === 'inventory');
      this.btnMap.classList.toggle('active', v === 'map');
      if (v) for (const b of [this.btnNotebook, this.btnInventory, this.btnMap]) b.disabled = false;
      this.state.panelsOk = undefined;
    });
    if (this.ctx === 'panel-notebook') {
      const tab = g.notebook.tabName ? g.notebook.tabName() : '';
      this.set('nbTab', tab, (v) => { this.btnQuestion.style.display = v === 'DEDUCTIONS' || v === 'MIND MAP' ? '' : 'none'; });
    }
  }

  // Lay the groups out from the canvas's on-page box (CSS px). Recomputed only when that box changes.
  layout() {
    const c = this.game.display.canvas.getBoundingClientRect();
    const key = [c.left, c.top, c.width, c.height].map(Math.round).join(',') + ':' + this.ctx;
    if (key === this.layoutKey) return;
    this.layoutKey = key;
    // u: the base button size. ~44-72 CSS px: Apple's and Google's minimum touch target, growing on big screens.
    const u = Math.round(Math.max(44, Math.min(72, c.height * 0.15)));
    const m = Math.round(Math.max(8, u * 0.18)); // margin from the frame's edge
    const gap = Math.round(u * 0.2);
    this.u = u;
    this.root.style.setProperty('--tc-lbl', Math.max(10, Math.round(u * 0.2)) + 'px');
    const place = (el, { left, right, top, bottom }) => {
      el.style.left = left != null ? Math.round(c.left + left) + 'px' : '';
      el.style.right = right != null ? Math.round(window.innerWidth - c.right + right) + 'px' : '';
      el.style.top = top != null ? Math.round(c.top + top) + 'px' : '';
      el.style.bottom = bottom != null ? Math.round(window.innerHeight - c.bottom + bottom) + 'px' : '';
    };
    const size = (b, w, h = w) => { b.style.width = Math.round(w) + 'px'; b.style.height = Math.round(h) + 'px'; };
    const G = this.groups;
    // walk: two wide pads, bottom-left
    G.move.style.gap = gap + 'px';
    for (const b of G.move.children) size(b, u * 1.3, u * 1.15);
    place(G.move, { left: m, bottom: m });
    // act cluster, bottom-right: hint and lantern stacked left of the big act button
    G.act.style.gap = gap + 'px'; G.act.style.alignItems = 'flex-end';
    size(this.btnAct, u * 1.35, u * 1.35);
    size(this.btnLantern, u * 0.85); size(this.btnHint, u * 0.85);
    place(G.act, { right: m, bottom: m });
    // panels + pause: a row in the top-right corner
    G.panels.style.gap = Math.round(gap * 0.6) + 'px';
    for (const b of G.panels.children) size(b, u * 0.82);
    for (const b of G.sysTop.children) size(b, u * 0.82);
    for (const b of G.sysLow.children) size(b, u * 0.82);
    place(G.sysTop, { right: m, top: m });
    place(G.sysLow, { right: m, bottom: m });
    const inPanel = this.ctx === 'panel' || this.ctx === 'panel-notebook';
    if (!inPanel) { G.panels.style.transform = ''; place(G.panels, { right: m + u * 0.82 + gap, top: m }); }
    // the panel bar: as low as it goes, over the page's footer line rather than its writing
    const bh = Math.max(44, Math.round(u * 0.82)), mb = Math.max(4, Math.round(m * 0.4));
    for (const b of G.updown.children) size(b, bh);
    G.updown.style.gap = Math.round(gap * 0.6) + 'px';
    place(G.updown, { left: mb, bottom: mb });
    size(G.backonly.children[0], bh * 1.15, bh);
    place(G.backonly, { right: mb, bottom: mb });
    if (inPanel) {
      for (const b of G.panels.children) size(b, bh);
      place(G.panels, { left: mb + bh * 2 + gap * 2, bottom: mb }); // right after ▲ ▼
      G.panels.style.transform = '';
    }
    // D-pad: one slim row along the bottom-left (◀ ▲ ▼ ▶), so pages and menus above it stay readable
    G.dpad.style.gap = Math.round(gap * 0.6) + 'px';
    for (const b of [this.dLeft, this.dUp, this.dDown, this.dRight]) { size(b, bh); G.dpad.appendChild(b); }
    place(G.dpad, { left: mb, bottom: mb });
    // OK / Back, bottom-right, the same height
    G.okback.style.gap = Math.round(gap * 0.6) + 'px';
    const [bBack, bOk] = G.okback.children;
    size(bOk, bh * 1.3, bh); size(bBack, bh * 1.15, bh);
    place(G.okback, { right: mb, bottom: mb });
    size(G.okonly.children[0], bh * 1.3, bh);
    place(G.okonly, { right: mb, bottom: mb });
    // notebook keys, in the bar left of Back
    G.nbx.style.gap = Math.round(gap * 0.6) + 'px'; G.nbx.style.flexDirection = 'column'; G.nbx.style.alignItems = 'flex-end';
    for (const b of G.nbx.children) { b.style.height = bh + 'px'; b.style.padding = `0 ${Math.round(u * 0.16)}px`; }
    G.nbx.style.flexDirection = 'row';
    place(G.nbx, { right: mb + bh * 1.15 + gap * 0.6, bottom: mb });
  }
}
