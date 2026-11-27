// Turkey Trot — hazards.js
// Every danger in the run: fences to jump, hay bales to jump or hide
// behind, mud puddles that slow, traps that snap, oven heat zones that burn
// and carving knives that fall from the sky or sweep across the floor.
// Hazards scroll left with the world and are recycled by the spawner in
// levels.js. Each hazard knows its own hitbox, damage and telegraph.

import { clamp } from './utils.js';

export const HAZARD_KINDS = ['fence', 'haybale', 'mud', 'trap', 'oven', 'knife', 'knifeSweep'];

export class Hazard {
  constructor(kind, x, groundY, options) {
    this.kind = kind;
    this.x = x;
    this.groundY = groundY || 600;
    this.options = options || {};
    this.width = Hazard.widthFor(kind);
    this.height = Hazard.heightFor(kind);
    this.vy = 0;
    this.fallSpeed = 0;
    this.state = 'idle'; // idle | falling | landed | sweeping | armed | sprung | cooling
    this.stateAt = performance.now();
    this.shadowScale = 1;
    this.sweepX = x;
    this.sweepDirection = -1;
    this.heat = 0;
    this.passed = false;
    this.hitDone = false;
    if (kind === 'knife') {
      // Falling knives start above the screen and telegraph with a shadow.
      this.y = -80;
      this.fallSpeed = 520 + Math.random() * 160;
      this.state = 'falling';
      this.targetX = x;
    }
    if (kind === 'knifeSweep') {
      this.state = 'sweeping';
      this.sweepX = x + 260;
      this.sweepDirection = -1;
    }
    if (kind === 'trap') this.state = 'armed';
    if (kind === 'oven') this.heat = 1;
  }

  static widthFor(kind) {
    if (kind === 'fence') return 46;
    if (kind === 'haybale') return 92;
    if (kind === 'mud') return 150;
    if (kind === 'trap') return 70;
    if (kind === 'oven') return 190;
    if (kind === 'knife') return 26;
    if (kind === 'knifeSweep') return 120;
    return 50;
  }

  static heightFor(kind) {
    if (kind === 'fence') return 74;
    if (kind === 'haybale') return 78;
    if (kind === 'mud') return 14;
    if (kind === 'trap') return 22;
    if (kind === 'oven') return 150;
    if (kind === 'knife') return 74;
    if (kind === 'knifeSweep') return 30;
    return 50;
  }

  get hitbox() {
    if (this.kind === 'knife') {
      return { x: this.x - 10, y: this.y, w: 20, h: this.height };
    }
    if (this.kind === 'knifeSweep') {
      return { x: this.sweepX - 60, y: this.groundY - 96, w: 120, h: 30 };
    }
    if (this.kind === 'mud') {
      return { x: this.x - this.width / 2, y: this.groundY - 10, w: this.width, h: 12 };
    }
    if (this.kind === 'oven') {
      return { x: this.x - this.width / 2 + 12, y: this.groundY - this.height + 30, w: this.width - 24, h: this.height - 30 };
    }
    return { x: this.x - this.width / 2, y: this.groundY - this.height, w: this.width, h: this.height };
  }

  /** Hay bales block Bram's line of sight — the stealth mechanic. */
  get blocksSight() {
    return this.kind === 'haybale';
  }

  get isSolid() {
    return this.kind === 'fence' || this.kind === 'haybale' || this.kind === 'oven';
  }

  update(dt, worldSpeed) {
    const dx = worldSpeed * dt;
    if (this.kind === 'knife') {
      if (this.state === 'falling') {
        this.y += this.fallSpeed * dt;
        this.x = this.targetX - worldSpeed * 0.12 * dt * 10 * 0.1; // slight drift with the world
        if (this.y + this.height >= this.groundY) {
          this.y = this.groundY - this.height;
          this.state = 'landed';
          this.stateAt = performance.now();
        }
      } else if (this.state === 'landed') {
        this.x -= dx;
        if (performance.now() - this.stateAt > 1400) this.state = 'cooling';
      } else {
        this.x -= dx;
      }
      return;
    }
    if (this.kind === 'knifeSweep') {
      this.sweepX -= dx;
      this.sweepX += this.sweepDirection * 260 * dt;
      if (this.sweepX < this.x - 260) this.sweepDirection = 1;
      if (this.sweepX > this.x + 260) this.sweepDirection = -1;
      this.x -= dx;
      return;
    }
    this.x -= dx;
    if (this.kind === 'trap' && this.state === 'sprung') {
      if (performance.now() - this.stateAt > 900) this.state = 'cooling';
    }
  }

  /** A trap springs when the turkey steps on it. */
  spring(now) {
    if (this.kind !== 'trap' || this.state !== 'armed') return false;
    this.state = 'sprung';
    this.stateAt = now;
    return true;
  }

  get isOffScreen() {
    return this.x < -260;
  }

  get isDangerous() {
    if (this.kind === 'knife') return this.state === 'falling' || this.state === 'landed';
    if (this.kind === 'trap') return this.state === 'armed' || this.state === 'sprung';
    if (this.kind === 'mud') return false; // mud slows, never hurts
    return true;
  }
}

/** Build a fence the turkey must jump (or dash through at full speed). */
export function makeFence(x, groundY) {
  return new Hazard('fence', x, groundY);
}

/** Build a hay bale: jump it, or hide behind it to break line of sight. */
export function makeHayBale(x, groundY) {
  return new Hazard('haybale', x, groundY);
}

/** Build a mud puddle that slows the turkey while it wades through. */
export function makeMud(x, groundY) {
  return new Hazard('mud', x, groundY);
}

/** Build a snap trap, armed and waiting under the leaves. */
export function makeTrap(x, groundY) {
  return new Hazard('trap', x, groundY);
}

/** Build an oven heat zone: the glow hurts, the oven blocks. */
export function makeOven(x, groundY) {
  return new Hazard('oven', x, groundY);
}

/** Build a falling carving knife aimed at a fixed ground position. */
export function makeFallingKnife(x, groundY) {
  return new Hazard('knife', x, groundY);
}

/** Build a sweeping carving knife that slides back and forth. */
export function makeSweepingKnife(x, groundY) {
  return new Hazard('knifeSweep', x, groundY);
}
