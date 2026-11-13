// Keyboard-first input. Maps physical keys to actions; tracks held + pressed-this-step.
const MAP = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  interact: ['KeyE', 'Enter', 'NumpadEnter'],
  lantern: ['KeyF'],
  notebook: ['KeyN', 'Tab', 'KeyJ'],
  map: ['KeyM'],
  inventory: ['KeyI'],
  pause: ['Escape'],
  hint: ['KeyH'],
  caseReview: ['KeyC'],
  question: ['KeyQ'],
  confirm: ['Enter', 'KeyE', 'Space', 'NumpadEnter'],
  back: ['Escape', 'Backspace'],
  one: ['Digit1'], two: ['Digit2'], three: ['Digit3'], four: ['Digit4'], five: ['Digit5'],
};
const PREVENT = new Set(['Tab', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace']);

export class Input {
  constructor(target) {
    this.down = new Set();
    this.pressedCodes = new Set();
    this.anyPressed = false;
    this.listeners = [];
    this.clicks = [];
    this.pendingUp = new Map(); // virtual key -> steps until it is released (see virtualUp)
    this.pointer = null; // last known pointer position in client (CSS) pixels
    this.onFullscreen = null;
    window.addEventListener('keydown', (e) => {
      // Alt+Enter toggles fullscreen and is not passed to the game as "interact".
      if (e.code === 'Enter' && e.altKey) { e.preventDefault(); if (!e.repeat && this.onFullscreen) this.onFullscreen(); return; }
      if (PREVENT.has(e.code)) e.preventDefault();
      if (!e.repeat) this.pressedCodes.add(e.code);
      else if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) this.pressedCodes.add(e.code); // menu auto-repeat
      this.down.add(e.code);
      this.anyPressed = true;
      for (const fn of this.listeners) fn(e);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
    // Optional mouse: positions are kept in client pixels; the game maps them through the
    // display (scale, letterbox, DPR, zoom) so hotspots line up at any window size.
    // Touch taps arrive here too (pointerType 'touch'): a tap is a click.
    target.addEventListener('pointerdown', (e) => {
      this.anyPressed = true;
      this.lastPointerType = e.pointerType || 'mouse';
      if (e.button === 0) this.clicks.push({ x: e.clientX, y: e.clientY });
      for (const fn of this.listeners) fn({ code: 'Pointer', pointerType: e.pointerType });
    });
    // A finger has no hover: only mouse/pen movement updates the hover position.
    window.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') this.pointer = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') this.pointer = null; });
    document.addEventListener('pointerleave', () => { this.pointer = null; });
  }
  // On-screen (touch) controls press the same key codes the keyboard does, so every system that reads
  // actions works unchanged. A held virtual key stays in `down` until released (or the window blurs).
  virtualDown(code) {
    // every finger-down is a fresh press, even while a previous quick tap is still latched (see virtualUp)
    this.pendingUp.delete(code);
    this.pressedCodes.add(code);
    this.down.add(code);
    this.anyPressed = true;
    for (const fn of this.listeners) fn({ code, virtual: true });
  }
  // A tap shorter than a game step would otherwise never be seen as held: keep it down for a few steps
  // (a short nudge on a walk pad), then release it.
  virtualUp(code) {
    if (this.pressedCodes.has(code)) { this.pendingUp.set(code, 6); return; }
    this.down.delete(code);
  }
  releaseVirtual(codes) { for (const c of codes) this.down.delete(c); }
  takeClicks() { const c = this.clicks; this.clicks = []; return c; }
  onKey(fn) { this.listeners.push(fn); }
  held(action) { return MAP[action].some((c) => this.down.has(c)); }
  pressed(action) { return MAP[action].some((c) => this.pressedCodes.has(c)); }
  consume(action) { for (const c of MAP[action]) this.pressedCodes.delete(c); }
  // Call at the end of each fixed update step.
  endStep() {
    this.pressedCodes.clear(); this.anyPressed = false; this.clicks.length = 0;
    if (this.pendingUp.size) for (const [c, n] of this.pendingUp) { if (n <= 1) { this.pendingUp.delete(c); this.down.delete(c); } else this.pendingUp.set(c, n - 1); }
  }
  clearAll() { this.pressedCodes.clear(); }
}
