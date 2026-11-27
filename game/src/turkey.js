// Turkey Trot — turkey.js
// The player: a brave turkey with run physics, jumping (with coyote time
// and a double jump), dashing on a stamina bar, squash-and-stretch, hit
// invulnerability, decoys, and a chili speed burst. All movement is
// frame-rate independent (dt in seconds).

import { clamp, easeOutCubic } from './utils.js';

export const TURKEY_START_X = 300;
export const TURKEY_WIDTH = 64;
export const TURKEY_HEIGHT = 56;

export class Turkey {
  constructor(stats) {
    this.reset(stats);
  }

  reset(stats) {
    this.stats = stats || { speedBonus: 1, staminaMax: 100, extraLives: 0, decoyCapacity: 1, magnetRadius: 70, comboDecay: 1 };
    this.x = TURKEY_START_X;
    this.y = 0; // height above the ground (0 = on the ground)
    this.vy = 0;
    this.groundY = 600;
    this.width = TURKEY_WIDTH;
    this.height = TURKEY_HEIGHT;
    this.speed = 0; // horizontal drift speed within the screen band
    this.baseSpeed = 300 * this.stats.speedBonus;
    this.stamina = this.stats.staminaMax;
    this.staminaMax = this.stats.staminaMax;
    this.lives = 3 + this.stats.extraLives;
    this.maxLives = 3 + this.stats.extraLives;
    this.decoys = this.stats.decoyCapacity;
    this.decoyCapacity = this.stats.decoyCapacity;
    this.invulnerableUntil = 0;
    this.chiliUntil = 0;
    this.shieldUntil = 0;
    this.dashUntil = 0;
    this.dashCooldownUntil = 0;
    this.jumpsUsed = 0;
    this.coyoteUntil = 0;
    this.onGround = true;
    this.squash = 0; // 1 = fully squashed, decays to 0
    this.stretch = 0;
    this.runCycle = 0;
    this.facing = 1;
    this.mudSlowUntil = 0;
    this.dead = false;
    this.gobbledAt = 0;
  }

  get isDashing() {
    return performance.now() < this.dashUntil;
  }

  get hasShield() {
    return performance.now() < this.shieldUntil;
  }

  get isChili() {
    return performance.now() < this.chiliUntil;
  }

  get isInvulnerable() {
    return performance.now() < this.invulnerableUntil;
  }

  get isMudSlowed() {
    return performance.now() < this.mudSlowUntil;
  }

  get hitbox() {
    return { x: this.x - this.width / 2 + 6, y: this.groundY - this.y - this.height + 8, w: this.width - 12, h: this.height - 8 };
  }

  get screenY() {
    return this.groundY - this.y - this.height;
  }

  /** Try to jump: ground jump, coyote-time jump, or double jump in the air. */
  tryJump(now, audio) {
    if (this.dead) return false;
    const canGroundJump = this.onGround || now < this.coyoteUntil;
    if (canGroundJump) {
      this.vy = 640;
      this.y = Math.max(this.y, 1);
      this.onGround = false;
      this.jumpsUsed = 1;
      this.stretch = 1;
      if (audio) audio.playJump();
      return true;
    }
    if (this.jumpsUsed < 2) {
      this.vy = 590;
      this.jumpsUsed = 2;
      this.stretch = 1;
      if (audio) audio.playDoubleJump();
      return true;
    }
    return false;
  }

  /** Try to dash: costs stamina, grants speed and brief invulnerability. */
  tryDash(now, audio) {
    if (this.dead) return false;
    if (now < this.dashCooldownUntil) return false;
    if (this.stamina < 25 && now >= this.chiliUntil) return false;
    if (now < this.chiliUntil) {
      // Chili dash is free.
    } else {
      this.stamina -= 25;
    }
    this.dashUntil = now + 280;
    this.dashCooldownUntil = now + 500;
    this.invulnerableUntil = Math.max(this.invulnerableUntil, now + 200);
    this.stretch = 1;
    if (audio) audio.playDash();
    return true;
  }

  /** Drop a corn decoy behind the turkey to stun the farmer. */
  dropDecoy(now, audio) {
    if (this.dead || this.decoys <= 0) return null;
    this.decoys -= 1;
    if (audio) audio.playDecoy();
    return { x: this.x - 70, y: this.groundY, kind: 'decoy', life: 6000, bornAt: now };
  }

  /** Apply a hit: lose a life unless shielded/invulnerable/dashing. */
  takeHit(now, audio) {
    if (this.dead || this.isInvulnerable || this.isDashing) return false;
    if (this.hasShield) {
      this.shieldUntil = 0;
      this.invulnerableUntil = now + 900;
      if (audio) audio.playHurt();
      return 'shield';
    }
    this.lives -= 1;
    this.invulnerableUntil = now + 1400;
    this.squash = 1;
    if (this.lives <= 0) this.dead = true;
    if (audio) audio.playHurt();
    return this.dead ? 'dead' : 'hit';
  }

  /** Pick up a power-up effect by kind. */
  applyPowerUp(kind, now, audio) {
    if (kind === 'golden') {
      this.stamina = this.staminaMax;
      this.shieldUntil = now + 6000;
      if (audio) audio.playGoldenCorn();
    } else if (kind === 'chili') {
      this.chiliUntil = now + 3500;
      if (audio) audio.playChili();
    } else if (kind === 'feather') {
      if (audio) audio.playFeather();
    } else if (kind === 'heart') {
      this.lives = Math.min(this.maxLives, this.lives + 1);
      if (audio) audio.playPickup(0);
    }
  }

  update(dt, input, now, worldSpeed, mouseSteer) {
    if (this.dead) return;
    // Horizontal drift: arrow keys or mouse-hold steering inside a band.
    const targetDrift = 0;
    let drift = targetDrift;
    if (input.moveLeft) drift = -230;
    if (input.moveRight) drift = 230;
    if (mouseSteer && input.pointerHeld) {
      const dx = input.pointerX - this.x;
      drift = clamp(dx * 3.2, -280, 280);
      if (Math.abs(dx) > 90) this.facing = dx > 0 ? 1 : -1;
    }
    if (drift !== 0) this.facing = drift > 0 ? 1 : -1;
    const mudFactor = this.isMudSlowed ? 0.55 : 1;
    const chiliFactor = this.isChili ? 1.45 : 1;
    const dashFactor = this.isDashing ? 1.9 : 1;
    this.x += drift * mudFactor * chiliFactor * dt;
    this.x = clamp(this.x, 90, 980);

    // Gravity and landing.
    if (!this.onGround) {
      this.vy -= 1850 * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.onGround = true;
        this.jumpsUsed = 0;
        this.squash = 1;
        this.coyoteUntil = 0;
      }
    } else {
      this.coyoteUntil = now + 110;
    }

    // Stamina: drain while dashing, regen otherwise.
    if (this.isDashing) {
      this.stamina = Math.max(0, this.stamina - 6 * dt);
    } else {
      this.stamina = Math.min(this.staminaMax, this.stamina + 26 * dt);
    }

    // Run cycle drives the leg animation and the gobble timer.
    this.runCycle += dt * (this.isDashing ? 26 : 15) * (this.onGround ? 1 : 0.4);
    this.squash = Math.max(0, this.squash - dt * 5);
    this.stretch = Math.max(0, this.stretch - dt * 4);
    if (now - this.gobbledAt > 9000) this.gobbledAt = now; // renderer gobbles on the beat
  }

  /** Vertical squash/stretch scale for the renderer. */
  squashStretch() {
    const sq = easeOutCubic(this.squash);
    const st = easeOutCubic(this.stretch);
    return { scaleX: 1 + sq * 0.28 - st * 0.12, scaleY: 1 - sq * 0.24 + st * 0.22 };
  }
}
