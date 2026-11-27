// Turkey Trot — utils.js
// Small pure helpers shared by every system: seeded randomness, clamping,
// easing, geometry and the tiny event-free formatting the HUD needs.
// Nothing here touches the DOM or the network.

/** Clamp a number into [min, max]. */
export function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Linear interpolation between a and b by t in [0, 1]. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Smoothstep easing: 0 at 0, 1 at 1, gentle in the middle. */
export function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Ease-out cubic, for jumps, pops and squash-and-stretch. */
export function easeOutCubic(t) {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

/** Ease-out back: overshoots slightly, good for menu pops and pickups. */
export function easeOutBack(t) {
  const x = clamp(t, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** Pick a random element of an array with Math.random. */
export function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/** Random float in [min, max). */
export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

/** Random integer in [min, max] inclusive. */
export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

/** True with probability p (0..1). */
export function chance(p) {
  return Math.random() < p;
}

/**
 * mulberry32 — a tiny deterministic seeded PRNG.
 * The screenshot hook (?shot=...&seed=N) and the endless-mode generator use
 * this so a given seed always builds the same run.
 */
export function makeSeededRandom(seed) {
  let a = seed >>> 0;
  return function seededRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded float in [min, max) from a seeded PRNG function. */
export function seededRange(rng, min, max) {
  return min + rng() * (max - min);
}

/** Seeded integer in [min, max] inclusive. */
export function seededInt(rng, min, max) {
  return Math.floor(seededRange(rng, min, max + 1));
}

/** Axis-aligned bounding-box overlap test. */
export function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Distance between two points. */
export function distanceBetween(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** Format a distance in metres with a thousands separator. */
export function formatDistance(metres) {
  return Math.floor(metres).toLocaleString('en-US') + ' m';
}

/** Format a score with a thousands separator. */
export function formatScore(score) {
  return Math.floor(score).toLocaleString('en-US');
}

/** Format seconds as m:ss, for the Time Trial clock. */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return m + ':' + String(rest).padStart(2, '0');
}

/** Convert degrees to radians. */
export function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Move a value toward a target by at most step (frame-rate independent). */
export function moveToward(value, target, step) {
  if (value < target) return Math.min(value + step, target);
  if (value > target) return Math.max(value - step, target);
  return value;
}

/** Wrap a value into [0, length). */
export function wrapValue(value, length) {
  return ((value % length) + length) % length;
}
