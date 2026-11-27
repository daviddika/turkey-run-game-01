// Turkey Trot — farmer.js
// Farmer Bram's chase AI: a four-state machine (patrol / suspicious /
// chase / sprint) with line-of-sight, escalating speed, stuns from corn
// decoys, and a boss sprint at the end of every zone. Bram starts off the
// left edge and closes in whenever the turkey is slow, hurt or in mud;
// he falls back when the turkey dashes, jumps well or drops a decoy.
// If Bram's hitbox touches the turkey, the run ends: CAUGHT.

import { clamp, lerp } from './utils.js';
import { randomTaunt } from './dialogue.js';
import { ZONES, isBossStretch } from './zones.js';

export const FARMER_STATES = ['patrol', 'suspicious', 'chase', 'sprint', 'stunned'];

export class Farmer {
  constructor() {
    this.reset('barnyard');
  }

  reset(zoneId) {
    this.zoneId = zoneId || 'barnyard';
    this.x = -140;
    this.y = 0;
    this.width = 78;
    this.height = 108;
    this.state = 'patrol';
    this.stateUntil = 0;
    this.speed = 0;
    this.stunUntil = 0;
    this.taunt = '';
    this.tauntUntil = 0;
    this.runCycle = 0;
    this.angry = 0; // 0..1, grows when the turkey is visible and close
    this.suspicion = 0; // 0..100, fills on line-of-sight, drains behind cover
    this.bossMode = false;
    this.bossTimer = 0;
    this.groundY = 600;
    this.spottedFlash = 0;
  }

  get isStunned() {
    return performance.now() < this.stunUntil;
  }

  get hitbox() {
    return { x: this.x - this.width / 2 + 8, y: this.groundY - this.height + 6, w: this.width - 16, h: this.height - 6 };
  }

  /** A corn decoy stuns Bram and throws him backwards. */
  stun(now, milliseconds) {
    this.stunUntil = now + (milliseconds || 2600);
    this.state = 'stunned';
    this.stateUntil = this.stunUntil;
    this.x = Math.max(-160, this.x - 130);
    this.suspicion = Math.max(0, this.suspicion - 45);
    this.angry = Math.max(0, this.angry - 0.4);
  }

  /** Enter the end-of-zone boss sprint. */
  startBoss(now, zoneId) {
    this.zoneId = zoneId;
    this.bossMode = true;
    this.bossTimer = 12000;
    this.state = 'sprint';
    this.stateUntil = now + 12000;
    this.taunt = randomTaunt(zoneId);
    this.tauntUntil = now + 3200;
    this.spottedFlash = 1;
  }

  endBoss() {
    this.bossMode = false;
    this.state = 'patrol';
    this.x = -160;
    this.suspicion = 0;
    this.angry = 0;
  }

  /** Line of sight: Bram sees the turkey unless a hay bale blocks the view. */
  hasLineOfSight(turkey, hayBales) {
    if (this.isStunned) return false;
    for (const bale of hayBales || []) {
      if (bale.x > this.x && bale.x < turkey.x && bale.blocksSight) return false;
    }
    return true;
  }

  update(dt, now, turkey, zone, hayBales, worldSpeed, distance) {
    const zoneDef = ZONES[this.zoneId] || ZONES.barnyard;
    const boss = zoneDef.boss;
    // Suspicion: fills when Bram can see the turkey, drains behind cover.
    const sees = this.hasLineOfSight(turkey, hayBales);
    if (sees) this.suspicion = clamp(this.suspicion + dt * 26, 0, 100);
    else this.suspicion = clamp(this.suspicion - dt * 34, 0, 100);
    this.angry = clamp(this.angry + (sees ? dt * 0.05 : -dt * 0.08), 0, 1);

    // State transitions.
    if (this.isStunned) {
      this.state = 'stunned';
    } else if (this.bossMode) {
      this.state = 'sprint';
      this.bossTimer -= dt * 1000;
      if (this.bossTimer <= 0) this.endBoss();
    } else if (this.suspicion > 70 || turkey.x < 260) {
      this.state = 'chase';
    } else if (this.suspicion > 30) {
      this.state = 'suspicious';
    } else {
      this.state = 'patrol';
    }

    // Speed by state, relative to the world scroll: Bram gains on the
    // turkey when the turkey is slow, and loses ground when it dashes.
    // Patrol ambles, chase runs, sprint is terrifying.
    let targetSpeed = 0;
    if (this.state === 'patrol') targetSpeed = worldSpeed * 0.55;
    else if (this.state === 'suspicious') targetSpeed = worldSpeed * 0.85;
    else if (this.state === 'chase') targetSpeed = worldSpeed + 55 + distance * 0.005;
    else if (this.state === 'sprint') targetSpeed = worldSpeed + 135;
    else targetSpeed = 0;
    // Bram's ground speed is relative to the world scroll: he gains when
    // the turkey is slow and loses ground when the turkey dashes.
    const turkeyBoost = turkey.isDashing ? 190 : turkey.isChili ? 120 : 0;
    const turkeyPenalty = turkey.isMudSlowed ? 60 : 0;
    const closing = targetSpeed - worldSpeed + turkeyPenalty - turkeyBoost;
    this.speed = lerp(this.speed, closing, clamp(dt * 3, 0, 1));
    this.x += this.speed * dt;
    this.x = clamp(this.x, -180, 1220);
    this.runCycle += dt * (6 + Math.abs(this.speed) / 26);

    // Taunts: Bram shouts when he spots the turkey or starts chasing.
    if (now > this.tauntUntil && (this.state === 'chase' || this.state === 'sprint')) {
      if (Math.random() < dt * 0.55) {
        this.taunt = randomTaunt(this.zoneId);
        this.tauntUntil = now + 3400;
      }
    }
    this.spottedFlash = Math.max(0, this.spottedFlash - dt * 1.4);
    // Zone change: a new Bram (new hat, new weapon) takes over.
    if (zone && zone.id !== this.zoneId) {
      this.zoneId = zone.id;
      this.x = Math.max(this.x, -140);
    }
  }

  /** Distance in pixels between Bram and the turkey (for the HUD warning). */
  gapTo(turkey) {
    return turkey.x - this.x;
  }

  /** Bram catches the turkey when their hitboxes overlap on the ground. */
  catches(turkey) {
    if (this.isStunned) return false;
    const a = this.hitbox;
    const b = turkey.hitbox;
    const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
    const overlapY = a.y < b.y + b.h && a.y + a.h > b.y;
    return overlapX && overlapY;
  }
}
