// Named story characters. Never combat targets; they carry state in storyState.chars.
import { drawSprite } from '../engine/assets.js';
import { snapN } from '../engine/display.js';

export class NPC {
  constructor(def, groundAt) {
    Object.assign(this, def);
    this.groundAt = groundAt;
    this.y = groundAt(def.x);
    this.z = def.z != null ? def.z : 8;
    this.hidden = false;
    this.moving = false;
    this.t = Math.random() * 3;
    this.facing = def.facing || -1;
    this.baseFacing = this.facing;
  }
  walkTo(x, speed) { this.targetX = x; this.speed = speed; this.moving = true; }
  update(dt, game) {
    this.t += dt;
    if (this.moving) {
      const d = this.targetX - this.x;
      if (Math.abs(d) < 0.8) { this.x = this.targetX; this.moving = false; }
      else { this.facing = Math.sign(d); this.x += Math.sign(d) * Math.min(Math.abs(d), this.speed * dt); }
      this.y = this.groundAt(this.x);
    } else if (!this.hidden) {
      // turn to face Silas when he is close or speaking with them
      const p = game.player;
      const talking = game.dialogue.active && game.dialogue.speakerNpc === this;
      if (talking || Math.abs(p.x - this.x) < 56) this.facing = p.x < this.x ? -1 : 1;
      else this.facing = this.baseFacing;
    }
  }
  draw(ctx, camX) {
    if (this.hidden) return;
    const x = snapN(this.x) - camX; // native-grid placement
    const y = snapN(this.y);
    const bob = this.moving ? (Math.floor(this.t * 6) % 2) : 0;
    drawSprite(ctx, this.sprite, this.moving ? 0 : Math.floor(this.t / 1.3) % 2, x, y - bob, this.facing);
    if (this.lantern) drawSprite(ctx, 'lantern_on', 0, x + this.facing * 5, y - 3 - bob, this.facing);
    if (this.candle) drawSprite(ctx, 'candle', 0, x + this.facing * 5, y - 13, this.facing);
  }
  lights() {
    if (this.hidden) return [];
    if (this.lantern) return [{ x: this.x + this.facing * 5, y: this.y - 12, r: 36, warm: 0.22, world: true }];
    if (this.candle) return [{ x: this.x + this.facing * 5, y: this.y - 17, r: 30 + Math.round(Math.sin(this.t * 9)), warm: 0.2, world: true }];
    return [];
  }
}
