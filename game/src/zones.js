// Turkey Trot — zones.js
// The three zones of a Story run, plus the Endless and Time Trial rule sets.
// Each zone owns its palette, weather, hazards, ground line and boss, so the
// renderer and the spawner can ask "what does this stretch of the run look
// like?" in one place. No drawing happens here — only data and tuning.

export const ZONE_LENGTHS = {
  barnyard: 1100,
  kitchen: 1100,
  forest: 1200,
};

export const ZONE_ORDER = ['barnyard', 'kitchen', 'forest'];

export const ZONES = {
  barnyard: {
    id: 'barnyard',
    index: 0,
    name: 'Zone 1 — The Barnyard',
    shortName: 'Barnyard',
    subtitle: 'Dawn breaks over the farm. Bram is already awake — RUN!',
    skyTop: '#ffd98a',
    skyMid: '#ffb347',
    skyBottom: '#ff8c42',
    sunColor: '#fff3b0',
    groundTop: '#8a5a2b',
    groundBottom: '#5d3a17',
    grassColor: '#7fb069',
    accentColor: '#e07a2f',
    weather: 'dawn',
    rain: false,
    leaves: false,
    dust: true,
    ember: false,
    light: 'warm dawn',
    groundY: 600,
    speedBase: 300,
    hazardGap: 340,
    boss: {
      name: 'Farmer Bram',
      title: 'THE FARMER',
      weapon: 'pitchfork',
      taunt: 'Come back here, dinner!',
      color: '#3e6b2f',
      hatColor: '#c9a227',
      speed: 330,
    },
    hazards: ['fence', 'haybale', 'mud', 'trap', 'knife'],
    flavor: 'Hay bales, fences and mud puddles. The rooster cheers you on.',
  },
  kitchen: {
    id: 'kitchen',
    index: 1,
    name: 'Zone 2 — The Farmhouse Kitchen',
    shortName: 'Kitchen',
    subtitle: 'The oven is preheating. The carving knife is out. Do NOT stop.',
    skyTop: '#5b2a1e',
    skyMid: '#8a4b2d',
    skyBottom: '#c96f3b',
    sunColor: '#ffb347',
    groundTop: '#6b3a24',
    groundBottom: '#3f2013',
    grassColor: '#a0522d',
    accentColor: '#ff6b35',
    weather: 'warm lamplight',
    rain: false,
    leaves: false,
    dust: false,
    ember: true,
    light: 'warm kitchen light',
    groundY: 600,
    speedBase: 340,
    hazardGap: 300,
    boss: {
      name: 'Chef Bram',
      title: 'THE CHEF',
      weapon: 'carving knife',
      taunt: 'The knife is sharp and so am I!',
      color: '#f5f0e6',
      hatColor: '#ffffff',
      speed: 365,
    },
    hazards: ['oven', 'knife', 'knifeSweep', 'trap', 'mud'],
    flavor: 'Oven heat zones, falling carving knives and a very sharp chef.',
  },
  forest: {
    id: 'forest',
    index: 2,
    name: 'Zone 3 — The Autumn Forest',
    shortName: 'Forest',
    subtitle: 'Freedom is past the treeline. One last sprint through the rain.',
    skyTop: '#2b3a55',
    skyMid: '#4a5d7e',
    skyBottom: '#7a6a8a',
    sunColor: '#e8d8a0',
    groundTop: '#4a3b28',
    groundBottom: '#2c2115',
    grassColor: '#5a7a3a',
    accentColor: '#d4a017',
    weather: 'dusk rain',
    rain: true,
    leaves: true,
    dust: false,
    ember: false,
    light: 'dusk rain',
    groundY: 600,
    speedBase: 380,
    hazardGap: 270,
    boss: {
      name: 'Hunter Bram',
      title: 'THE HUNTER',
      weapon: 'net',
      taunt: 'No turkey escapes my forest!',
      color: '#4a5d23',
      hatColor: '#6b4423',
      speed: 400,
    },
    hazards: ['fence', 'trap', 'knife', 'mud', 'haybale'],
    flavor: 'Rain, falling leaves, hidden traps and the hunter with his net.',
  },
};

/** Zone for a travelled distance inside a Story run. */
export function zoneForDistance(distance) {
  if (distance < ZONE_LENGTHS.barnyard) return ZONES.barnyard;
  if (distance < ZONE_LENGTHS.barnyard + ZONE_LENGTHS.kitchen) return ZONES.kitchen;
  return ZONES.forest;
}

/** 0..1 progress inside the current zone. */
export function zoneProgress(distance) {
  const zone = zoneForDistance(distance);
  const start = zone.index === 0 ? 0 : zone.index === 1 ? ZONE_LENGTHS.barnyard : ZONE_LENGTHS.barnyard + ZONE_LENGTHS.kitchen;
  return (distance - start) / ZONE_LENGTHS[zone.id];
}

/** Total Story distance: crossing it means ESCAPED. */
export function storyTotalDistance() {
  return ZONE_LENGTHS.barnyard + ZONE_LENGTHS.kitchen + ZONE_LENGTHS.forest;
}

/** Is the turkey inside a boss stretch (last 180 m of a zone)? */
export function isBossStretch(distance) {
  const zone = zoneForDistance(distance);
  const start = zone.index === 0 ? 0 : zone.index === 1 ? ZONE_LENGTHS.barnyard : ZONE_LENGTHS.barnyard + ZONE_LENGTHS.kitchen;
  const intoZone = distance - start;
  return intoZone > ZONE_LENGTHS[zone.id] - 180;
}

export const MODES = {
  story: {
    id: 'story',
    name: 'Story',
    tagline: 'Three zones, three Brams',
    description: 'Escape the Barnyard, survive the Kitchen, sprint the Forest.',
  },
  endless: {
    id: 'endless',
    name: 'Endless',
    tagline: 'How far can you run?',
    description: 'Procedural farm that never ends. Speed and hazards rise forever.',
  },
  trial: {
    id: 'trial',
    name: 'Time Trial',
    tagline: 'Race the clock!',
    description: 'Same three zones, one clock. Beat your best escape time.',
  },
};

/** Difficulty ramp: speed and hazard density grow with distance. */
export function difficultyAt(distance, mode) {
  const base = 1 + distance / 2400;
  const endlessBoost = mode === 'endless' ? 1 + distance / 6000 : 1;
  return {
    speedMultiplier: Math.min(1.75, base * endlessBoost),
    hazardMultiplier: Math.min(2.1, 1 + distance / 1800),
    knifeRate: Math.min(2.4, 1 + distance / 2200),
  };
}
