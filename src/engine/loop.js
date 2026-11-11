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
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < 5) {
      this.update(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === 5) this.acc = 0;
    this.render(this.acc / STEP);
    requestAnimationFrame(this.frame);
  }
}
