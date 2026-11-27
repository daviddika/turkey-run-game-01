// Turkey Trot — storage.js
// Best scores, best distances, best escape times, banked corn and permanent
// upgrades, persisted in localStorage under one key. Everything is guarded
// with try/catch: a browser that blocks storage (or a hosted build that
// forbids cookies) simply plays without saving, never crashes.

const STORAGE_KEY = 'turkey-trot-save-v1';

export const UPGRADE_DEFS = [
  { id: 'speed', name: 'Swift Feet', max: 5, cost: [40, 80, 140, 220, 320], desc: '+6% run speed per level.' },
  { id: 'stamina', name: 'Deep Lungs', max: 5, cost: [40, 80, 140, 220, 320], desc: '+25 max stamina per level.' },
  { id: 'life', name: 'Second Wind', max: 2, cost: [150, 300], desc: '+1 starting heart per level.' },
  { id: 'decoy', name: 'Corn Stash', max: 3, cost: [60, 120, 200], desc: '+1 decoy carried per level.' },
  { id: 'magnet', name: 'Corn Magnet', max: 3, cost: [50, 100, 180], desc: 'Corn drifts to you from further away.' },
  { id: 'combo', name: 'Show-Off', max: 3, cost: [50, 100, 180], desc: 'Your combo decays much slower.' },
];

export function defaultSave() {
  return {
    bestScore: 0,
    bestDistance: 0,
    bestEscapeTime: 0, // seconds; 0 means never escaped
    bestEndless: 0,
    totalCorn: 0, // banked corn, spendable on upgrades
    totalRuns: 0,
    escapes: 0,
    achievements: [], // unlocked achievement ids
    upgrades: { speed: 0, stamina: 0, life: 0, decoy: 0, magnet: 0, combo: 0 },
    muted: false,
  };
}

/** Load the save, merging over defaults so old saves stay valid. */
export function loadSave() {
  const save = defaultSave();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return save;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      Object.assign(save, parsed);
      save.upgrades = Object.assign(defaultSave().upgrades, parsed.upgrades || {});
    }
  } catch (error) {
    // Storage unavailable or corrupt: play with a fresh save.
  }
  return save;
}

/** Persist the save. Never throws. */
export function storeSave(save) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch (error) {
    // Hosted builds may forbid storage; the run still counts in memory.
  }
}

/** Cost of the next level of an upgrade, or null when maxed. */
export function upgradeCost(def, level) {
  if (level >= def.max) return null;
  return def.cost[level];
}

/** Buy an upgrade with banked corn. Returns true on success. */
export function buyUpgrade(save, upgradeId) {
  const def = UPGRADE_DEFS.find((u) => u.id === upgradeId);
  if (!def) return false;
  const level = save.upgrades[upgradeId] || 0;
  const cost = upgradeCost(def, level);
  if (cost === null || save.totalCorn < cost) return false;
  save.totalCorn -= cost;
  save.upgrades[upgradeId] = level + 1;
  storeSave(save);
  return true;
}

/** Record a finished run's results into the save. */
export function recordRun(save, result) {
  save.totalRuns += 1;
  save.totalCorn += result.corn || 0;
  if (result.score > save.bestScore) save.bestScore = result.score;
  if (result.distance > save.bestDistance) save.bestDistance = result.distance;
  if (result.mode === 'endless' && result.distance > save.bestEndless) save.bestEndless = result.distance;
  if (result.escaped) {
    save.escapes += 1;
    if (!save.bestEscapeTime || result.time < save.bestEscapeTime) save.bestEscapeTime = result.time;
  }
  storeSave(save);
  return save;
}

/** Derived run stats from upgrades, applied at run start. */
export function statsFromUpgrades(save) {
  const u = save.upgrades;
  return {
    speedBonus: 1 + 0.06 * (u.speed || 0),
    staminaMax: 100 + 25 * (u.stamina || 0),
    extraLives: u.life || 0,
    decoyCapacity: 1 + (u.decoy || 0),
    magnetRadius: 70 + 45 * (u.magnet || 0),
    comboDecay: 1 - 0.22 * (u.combo || 0),
  };
}
