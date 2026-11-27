// Turkey Trot — collectibles.js
// Corn (score), golden corn (dash refill + shield), feathers (combo),
// chili peppers (speed burst with worse steering) and rare hearts.
// Pickups bob, spin and drift toward the turkey when the Corn Magnet
// upgrade is owned. Combo multiplies corn score while it lasts.

import { clamp } from './utils.js';

export const PICKUP_KINDS = ['corn', 'golden', 'feather', 'chili', 'heart'];

export class Pickup {
  constructor(kind, x, y, groundY) {
    this.kind = kind;
    this.x = x;
    this.y = y; // absolute screen y (not height above ground)
    this.groundY = groundY || 600;
    this.bornAt = performance.now();
    this.bobPhase = Math.random() * Math.PI * 2;
    this.collected = false;
    this.magnetised = false;
    this.radius = kind === 'golden' ? 22 : kind === 'heart' ? 20 : 16;
    this.spin = 0;
  }

  get hitbox() {
    return { x: this.x - this.radius, y: this.y - this.radius, w: this.radius * 2, h: this.radius * 2 };
  }

  /** Score value of this pickup at the current combo multiplier. */
  scoreValue(comboMultiplier) {
    if (this.kind === 'corn') return 10 * comboMultiplier;
    if (this.kind === 'golden') return 50 * comboMultiplier;
    if (this.kind === 'feather') return 15 * comboMultiplier;
    if (this.kind === 'chili') return 5;
    if (this.kind === 'heart') return 25;
    return 0;
  }

  update(dt, worldSpeed, turkey, magnetRadius) {
    this.spin += dt * 4;
    this.bobPhase += dt * 3;
    const dx = turkey.x - this.x;
    const dy = turkey.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (magnetRadius > 0 && dist < magnetRadius && (this.kind === 'corn' || this.kind === 'golden')) {
      this.magnetised = true;
      const pull = 420 * dt;
      this.x += (dx / (dist || 1)) * pull;
      this.y += (dy / (dist || 1)) * pull;
    } else {
      this.x -= worldSpeed * dt;
    }
  }

  get bobOffset() {
    return Math.sin(this.bobPhase) * 5;
  }

  get isOffScreen() {
    return this.x < -60;
  }
}

export function makeCorn(x, y, groundY) {
  return new Pickup('corn', x, y, groundY);
}

export function makeGoldenCorn(x, y, groundY) {
  return new Pickup('golden', x, y, groundY);
}

export function makeFeather(x, y, groundY) {
  return new Pickup('feather', x, y, groundY);
}

export function makeChili(x, y, groundY) {
  return new Pickup('chili', x, y, groundY);
}

export function makeHeart(x, y, groundY) {
  return new Pickup('heart', x, y, groundY);
}

/** A neat arc of corn over a fence or hay bale — the classic jump reward. */
export function makeCornArc(startX, groundY, count) {
  const pickups = [];
  const n = count || 5;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = startX + i * 46;
    const arc = Math.sin(t * Math.PI) * 130;
    pickups.push(new Pickup('corn', x, groundY - 90 - arc, groundY));
  }
  return pickups;
}

/** A low line of corn along the ground, for risky runs through mud. */
export function makeCornLine(startX, groundY, count) {
  const pickups = [];
  const n = count || 4;
  for (let i = 0; i < n; i++) {
    pickups.push(new Pickup('corn', startX + i * 44, groundY - 46, groundY));
  }
  return pickups;
}

/** Combo state: builds on pickups, decays over time, multiplies score. */
export class ComboMeter {
  constructor(decayFactor) {
    this.combo = 0;
    this.timer = 0;
    this.bestCombo = 0;
    this.decayFactor = decayFactor || 1;
    this.windowMs = 4200;
  }

  get multiplier() {
    if (this.combo < 3) return 1;
    if (this.combo < 6) return 2;
    if (this.combo < 10) return 3;
    if (this.combo < 15) return 4;
    return 5;
  }

  add(now, amount) {
    this.combo += amount || 1;
    this.timer = now + this.windowMs;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
  }

  reset() {
    this.combo = 0;
    this.timer = 0;
  }

  update(now) {
    if (this.combo > 0 && now > this.timer) {
      this.combo = 0;
    }
  }

  /** Fraction of the combo window remaining, for the HUD meter. */
  windowFraction(now) {
    if (this.combo <= 0) return 0;
    return clamp((this.timer - now) / this.windowMs, 0, 1);
  }
}
