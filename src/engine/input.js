// Keyboard-first input. Maps physical keys to actions; tracks held + pressed-this-step.
const MAP = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  interact: ['KeyE', 'Enter', 'NumpadEnter'],
  lantern: ['KeyF'],
  notebook: ['Tab', 'KeyJ'],
  inventory: ['KeyI'],
  pause: ['Escape'],
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
    window.addEventListener('keydown', (e) => {
      if (PREVENT.has(e.code)) e.preventDefault();
      if (!e.repeat) this.pressedCodes.add(e.code);
      else if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) this.pressedCodes.add(e.code); // menu auto-repeat
      this.down.add(e.code);
      this.anyPressed = true;
      for (const fn of this.listeners) fn(e);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
    target.addEventListener('pointerdown', () => { this.anyPressed = true; for (const fn of this.listeners) fn({ code: 'Pointer' }); });
  }
  onKey(fn) { this.listeners.push(fn); }
  held(action) { return MAP[action].some((c) => this.down.has(c)); }
  pressed(action) { return MAP[action].some((c) => this.pressedCodes.has(c)); }
  consume(action) { for (const c of MAP[action]) this.pressedCodes.delete(c); }
  // Call at the end of each fixed update step.
  endStep() { this.pressedCodes.clear(); this.anyPressed = false; }
  clearAll() { this.pressedCodes.clear(); }
}
