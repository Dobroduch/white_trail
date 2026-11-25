// Fixed-step update (60 Hz) with requestAnimationFrame rendering.
// Updates stop entirely while the tab is hidden so story timers never advance unseen.
export const STEP = 1 / 60;

export class Loop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.frame = this.frame.bind(this);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }
  frame(now) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    // Clamp long stalls (tab switch, breakpoint) so we never fast-forward the simulation.
    if (dt > 0.25) dt = STEP;
    // Vsync snapping: frame times jitter around the display's interval (16.4, 17.0, 16.6 ms...). Taken literally,
    // the accumulator then sometimes runs no step and sometimes two, and motion stutters on a steady 60 Hz screen.
    // A frame within half a millisecond of a whole number of steps counts as exactly that many.
    const whole = Math.round(dt / STEP);
    if (whole >= 1 && Math.abs(dt - whole * STEP) < 0.0005) dt = whole * STEP;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP - 1e-9 && steps < 5) {
      this.update(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === 5) this.acc = 0;
    if (this.acc < 0) this.acc = 0;
    // Nothing advanced, nothing to show: on a 120 / 144 Hz display this skips the frames that would only redraw the
    // same picture (more than half of them), which is most of the GPU work. The first frame always draws.
    if (steps > 0 || !this.drawn) { this.render(this.acc / STEP); this.drawn = true; }
    requestAnimationFrame(this.frame);
  }
}
