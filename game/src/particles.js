// Turkey Trot — particles.js
// Feathers, dust, embers, leaves, rain, floating score text and screen
// shake. All particles are plain objects in pools — no allocation per
// frame beyond the pool churn — and the renderer draws them from here.

import { randRange, randInt, clamp } from './utils.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.flash = 0;
    this.flashColor = '#ffffff';
  }

  /** Add screen shake (decays on its own). */
  addShake(amount) {
    this.shake = Math.min(18, this.shake + amount);
  }

  /** Full-screen flash, e.g. when spotted or hurt. */
  addFlash(color, amount) {
    this.flash = Math.max(this.flash, amount || 0.5);
    this.flashColor = color || '#ffffff';
  }

  spawnFeather(x, y, count) {
    for (let i = 0; i < (count || 6); i++) {
      this.particles.push({
        kind: 'feather', x, y,
        vx: randRange(-90, 90), vy: randRange(-160, -30),
        life: randRange(0.7, 1.4), maxLife: 1.4,
        size: randRange(5, 11), rotation: randRange(0, Math.PI * 2),
        spin: randRange(-4, 4), color: i % 2 ? '#8b5a2b' : '#d9a066',
      });
    }
  }

  spawnDust(x, y, count) {
    for (let i = 0; i < (count || 5); i++) {
      this.particles.push({
        kind: 'dust', x: x + randRange(-12, 12), y: y + randRange(-6, 6),
        vx: randRange(-40, 10), vy: randRange(-30, -5),
        life: randRange(0.4, 0.8), maxLife: 0.8,
        size: randRange(4, 9), rotation: 0, spin: 0, color: '#cbb28a',
      });
    }
  }

  spawnEmber(x, y, count) {
    for (let i = 0; i < (count || 4); i++) {
      this.particles.push({
        kind: 'ember', x: x + randRange(-30, 30), y,
        vx: randRange(-15, 15), vy: randRange(-90, -40),
        life: randRange(0.5, 1.1), maxLife: 1.1,
        size: randRange(3, 7), rotation: 0, spin: 0, color: i % 2 ? '#ff9f1c' : '#ff5d3b',
      });
    }
  }

  spawnLeaf(x, y, count) {
    const colors = ['#d94f2b', '#e8a317', '#b85c38', '#c96a1e'];
    for (let i = 0; i < (count || 3); i++) {
      this.particles.push({
        kind: 'leaf', x: x + randRange(-20, 20), y,
        vx: randRange(-60, -10), vy: randRange(20, 70),
        life: randRange(1.2, 2.2), maxLife: 2.2,
        size: randRange(6, 12), rotation: randRange(0, Math.PI * 2),
        spin: randRange(-3, 3), color: colors[randInt(0, colors.length - 1)],
      });
    }
  }

  spawnSparkle(x, y, color, count) {
    for (let i = 0; i < (count || 8); i++) {
      const angle = randRange(0, Math.PI * 2);
      const speed = randRange(40, 160);
      this.particles.push({
        kind: 'sparkle', x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: randRange(0.3, 0.7), maxLife: 0.7,
        size: randRange(3, 6), rotation: 0, spin: 0, color: color || '#ffd166',
      });
    }
  }

  spawnRainSplash(x, y) {
    this.particles.push({
      kind: 'splash', x, y, vx: randRange(-20, 20), vy: randRange(-60, -20),
      life: 0.3, maxLife: 0.3, size: randRange(3, 5), rotation: 0, spin: 0, color: '#9fc3e8',
    });
  }

  spawnCornBurst(x, y) {
    this.spawnSparkle(x, y, '#ffd23f', 10);
  }

  /** Floating score / message text that rises and fades. */
  addFloatingText(x, y, text, color, size) {
    this.texts.push({ x, y, text, color: color || '#ffffff', size: size || 20, life: 1.1, maxLife: 1.1 });
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 26);
    this.shakeX = (Math.random() * 2 - 1) * this.shake;
    this.shakeY = (Math.random() * 2 - 1) * this.shake;
    this.flash = Math.max(0, this.flash - dt * 2.2);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.kind === 'feather' || p.kind === 'leaf') {
        p.vy += 60 * dt;
        p.vx += Math.sin(p.life * 8) * 12 * dt;
      } else if (p.kind === 'dust') {
        p.vy -= 10 * dt;
      } else if (p.kind === 'ember') {
        p.vy -= 40 * dt;
      } else if (p.kind === 'sparkle') {
        p.vx *= 0.96;
        p.vy *= 0.96;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= 42 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    if (this.particles.length > 420) this.particles.splice(0, this.particles.length - 420);
  }

  get count() {
    return this.particles.length;
  }
}

/** Ambient weather: rain streaks for the forest, drifting leaves, dust motes. */
export class WeatherSystem {
  constructor() {
    this.drops = [];
    this.leaves = [];
    this.motes = [];
    for (let i = 0; i < 90; i++) {
      this.drops.push({ x: Math.random() * 1280, y: Math.random() * 720, speed: randRange(520, 760), length: randRange(14, 26) });
    }
    for (let i = 0; i < 40; i++) {
      this.leaves.push({ x: Math.random() * 1280, y: Math.random() * 720, speed: randRange(30, 80), sway: randRange(0, Math.PI * 2), size: randRange(5, 10) });
    }
    for (let i = 0; i < 30; i++) {
      this.motes.push({ x: Math.random() * 1280, y: Math.random() * 720, speed: randRange(8, 24), size: randRange(2, 4) });
    }
  }

  update(dt, zone) {
    const raining = zone && zone.rain;
    const leafy = zone && zone.leaves;
    if (raining) {
      for (const d of this.drops) {
        d.y += d.speed * dt;
        d.x -= 90 * dt;
        if (d.y > 720) { d.y = -20; d.x = Math.random() * 1400; }
        if (d.x < -20) d.x = 1300;
      }
    }
    if (leafy) {
      for (const l of this.leaves) {
        l.y += l.speed * dt;
        l.x -= 26 * dt + Math.sin(l.sway += dt * 2) * 14 * dt;
        if (l.y > 730) { l.y = -12; l.x = Math.random() * 1280; }
        if (l.x < -12) l.x = 1290;
      }
    }
    for (const m of this.motes) {
      m.x += m.speed * dt;
      if (m.x > 1290) { m.x = -10; m.y = Math.random() * 720; }
    }
  }
}
