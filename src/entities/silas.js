// Silas Vance: grounded, deliberate side-scrolling movement. No jump — traversal is walking,
// authored doors and scene edges. Position is a float; rendering snaps to whole pixels.
import { drawSprite } from '../engine/assets.js';

const SPEED = 44; // px/s — a deliberate walk
const ACCEL = 260;

export class Silas {
  constructor() {
    this.x = 100; this.y = 150; this.vx = 0; this.facing = 1;
    this.walkT = 0; this.idleT = 0; this.hidden = false; this.autoTarget = null;
    this.lastStepFrame = -1; this.breathT = 1.5; this.shiverT = 0;
  }

  place(x, facing, groundAt) {
    this.x = x; this.vx = 0; this.facing = facing || this.facing; this.y = groundAt(x); this.autoTarget = null;
  }

  update(dt, game) {
    const scene = game.scene;
    let dir = 0;
    if (this.autoTarget != null) {
      const d = this.autoTarget - this.x;
      if (Math.abs(d) < 0.8) { this.x = this.autoTarget; this.autoTarget = null; this.vx = 0; this.backstep = false; }
      else dir = Math.sign(d);
    } else if (game.canMove()) {
      dir = (game.input.held('right') ? 1 : 0) - (game.input.held('left') ? 1 : 0);
    }
    const target = dir * SPEED * (this.autoTarget != null ? 0.85 : 1);
    if (this.vx < target) this.vx = Math.min(target, this.vx + ACCEL * dt);
    else if (this.vx > target) this.vx = Math.max(target, this.vx - ACCEL * dt);
    if (dir !== 0 && !(this.autoTarget != null && this.backstep)) this.facing = dir;
    let nx = this.x + this.vx * dt;
    const [b0, b1] = scene.bounds;
    if (nx < b0) { nx = b0; this.vx = 0; }
    if (nx > b1) { nx = b1; this.vx = 0; }
    this.x = nx;
    // follow the ground smoothly over steps and slopes
    const gy = game.groundAt(this.x);
    this.y += (gy - this.y) * Math.min(1, dt * 18);
    if (Math.abs(gy - this.y) < 0.05) this.y = gy;

    const moving = Math.abs(this.vx) > 4;
    if (moving) {
      this.walkT += dt * (Math.abs(this.vx) / SPEED) * 6.5;
      const f = Math.floor(this.walkT) % 4;
      if ((f === 0 || f === 2) && f !== this.lastStepFrame) game.footstep();
      this.lastStepFrame = f;
      this.idleT = 0;
    } else {
      this.walkT = 0; this.lastStepFrame = -1;
      this.idleT += dt;
    }
    // breath in the cold
    if (scene.exterior && !this.hidden) {
      this.breathT -= dt;
      if (this.breathT <= 0) { this.breathT = 2.4 + Math.random() * 1.2; game.weather.puff(this.x + this.facing * 4, this.y - 20, this.facing); }
    }
    if (game.state.warmth < 35) this.shiverT += dt;
  }

  draw(ctx, camX, lanternOn) {
    if (this.hidden) return;
    const moving = Math.abs(this.vx) > 4;
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    const shiver = this.shiverT > 0 && !moving && Math.floor(this.shiverT * 12) % 40 < 3 ? 1 : 0;
    if (moving) drawSprite(ctx, 'silas_walk', Math.floor(this.walkT), x, y, this.facing);
    else drawSprite(ctx, 'silas_idle', Math.floor(this.idleT / 1.1) % 2, x + shiver, y, this.facing);
    // lantern carried at his side, swinging with the stride
    const swing = moving ? Math.round(Math.sin(this.walkT * Math.PI / 2)) : 0;
    const lx = x + this.facing * 4 + swing;
    drawSprite(ctx, lanternOn ? 'lantern_on' : 'lantern_off', 0, lx, y - 7, this.facing);
  }

  lanternPos() { return { x: this.x + this.facing * 4, y: this.y - 10 }; }
}
