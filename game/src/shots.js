// Turkey Trot — shots.js
// Deterministic screenshot states: ?shot=title | play | boss | end (with an
// optional &seed=N) jumps the game straight to that state with a fixed seed,
// so the four screenshots are reproducible. Documented in the README.
// The hook only reads the URL; it never fetches anything.

export function parseShotQuery(search) {
  const params = new URLSearchParams(search || '');
  const shot = params.get('shot');
  const seedRaw = params.get('seed');
  const seed = seedRaw ? parseInt(seedRaw, 10) : 7;
  if (!shot) return null;
  if (shot !== 'title' && shot !== 'play' && shot !== 'boss' && shot !== 'end') return null;
  return { shot, seed: Number.isFinite(seed) ? seed : 7 };
}

/** A fixed, good-looking play state for the ?shot=play screenshot. */
export function playShotSetup() {
  return {
    distance: 640,
    score: 1240,
    corn: 18,
    lives: 3,
    turkeyX: 420,
    turkeyY: 120,
    farmerX: 60,
    farmerState: 'chase',
    seed: 7,
  };
}

/** A fixed boss state for the ?shot=boss screenshot. */
export function bossShotSetup() {
  return {
    distance: 2050,
    score: 2680,
    corn: 31,
    lives: 2,
    turkeyX: 640,
    turkeyY: 0,
    farmerX: 240,
    farmerState: 'sprint',
    seed: 11,
  };
}

/** A fixed end state for the ?shot=end screenshot. */
export function endShotSetup() {
  return {
    escaped: true,
    score: 5420,
    distance: 3400,
    corn: 57,
    bestCombo: 14,
    zonesCleared: 3,
    time: 187,
    mode: 'story',
  };
}
