// Turkey Trot — levels.js
// The spawner: hand-written segment templates (each a little choreographed
// stretch of hazards + corn) plus the seeded procedural generator for
// Endless mode. A Story run deals segments in a shuffled order per zone so
// no two runs play the same; Endless draws from every zone's table with
// rising density. Every segment is data — the game never hard-codes a
// layout anywhere else.
//
// Segment item codes:
//   F fence, H hay bale, M mud, T trap, O oven, K falling knife,
//   S sweeping knife, c corn line, A corn arc, G golden corn,
//   f feather, p chili, h heart, D decoy pickup (free decoy)

import { makeSeededRandom } from './utils.js';

export const SEGMENTS = {
  barnyard: [
    { id: 'yard-opening', weight: 3, items: ['c', 'c', 'F', 'A', 'c'] },
    { id: 'yard-fence-line', weight: 3, items: ['F', 'A', 'F', 'c', 'F', 'A'] },
    { id: 'yard-hay-hide', weight: 3, items: ['H', 'c', 'H', 'f', 'H'] },
    { id: 'yard-mud-run', weight: 3, items: ['c', 'M', 'c', 'c', 'M', 'G'] },
    { id: 'yard-trap-field', weight: 2, items: ['T', 'c', 'T', 'A', 'T'] },
    { id: 'yard-knife-rain', weight: 2, items: ['K', 'c', 'K', 'A', 'K'] },
    { id: 'yard-corn-feast', weight: 2, items: ['c', 'c', 'c', 'G', 'c', 'c', 'f'] },
    { id: 'yard-chili-dash', weight: 2, items: ['p', 'F', 'A', 'F', 'c', 'M'] },
    { id: 'yard-double-fence', weight: 2, items: ['F', 'F', 'A', 'c', 'H'] },
    { id: 'yard-heart-stop', weight: 1, items: ['h', 'F', 'c', 'T', 'c'] },
    { id: 'yard-bale-hop', weight: 3, items: ['H', 'A', 'H', 'A', 'H', 'f'] },
    { id: 'yard-mud-knives', weight: 2, items: ['M', 'K', 'c', 'M', 'K', 'c'] },
    { id: 'yard-decoy-gift', weight: 1, items: ['D', 'c', 'F', 'A', 'c'] },
    { id: 'yard-long-jump', weight: 2, items: ['F', 'c', 'c', 'F', 'A', 'F'] },
    { id: 'yard-feather-run', weight: 2, items: ['f', 'c', 'f', 'A', 'f', 'c'] },
    { id: 'yard-rooster-wake', weight: 2, items: ['c', 'F', 'c', 'H', 'A', 'c'] },
    { id: 'yard-coop-dash', weight: 2, items: ['F', 'M', 'A', 'F', 'c', 'T'] },
    { id: 'yard-pumpkin-hop', weight: 2, items: ['H', 'c', 'H', 'c', 'G', 'H'] },
    { id: 'yard-scarecrow', weight: 1, items: ['H', 'F', 'A', 'K', 'c', 'f'] },
    { id: 'yard-muddy-boots', weight: 2, items: ['M', 'c', 'M', 'F', 'A', 'M'] },
    { id: 'yard-corn-dance', weight: 2, items: ['c', 'c', 'f', 'c', 'c', 'G', 'c'] },
    { id: 'yard-fence-frenzy', weight: 2, items: ['F', 'F', 'c', 'F', 'F', 'A'] },
    { id: 'yard-trap-tango', weight: 2, items: ['T', 'A', 'T', 'c', 'T', 'f'] },
    { id: 'yard-golden-dawn', weight: 1, items: ['G', 'A', 'c', 'F', 'h', 'c'] },
    { id: 'yard-chili-morning', weight: 2, items: ['p', 'c', 'F', 'A', 'M', 'c'] },
  ],
  kitchen: [
    { id: 'kitchen-opening', weight: 3, items: ['O', 'c', 'K', 'A'] },
    { id: 'kitchen-oven-row', weight: 3, items: ['O', 'A', 'O', 'c', 'O'] },
    { id: 'kitchen-knife-storm', weight: 3, items: ['K', 'K', 'c', 'K', 'A', 'K'] },
    { id: 'kitchen-sweep', weight: 3, items: ['S', 'c', 'c', 'S', 'A'] },
    { id: 'kitchen-hot-floor', weight: 2, items: ['O', 'M', 'O', 'c', 'K'] },
    { id: 'kitchen-trap-pan', weight: 2, items: ['T', 'O', 'c', 'T', 'A'] },
    { id: 'kitchen-golden-pan', weight: 2, items: ['G', 'O', 'A', 'O', 'f'] },
    { id: 'kitchen-chili-heat', weight: 2, items: ['p', 'O', 'K', 'A', 'O'] },
    { id: 'kitchen-double-sweep', weight: 2, items: ['S', 'S', 'c', 'A', 'K'] },
    { id: 'kitchen-corn-oven', weight: 2, items: ['c', 'O', 'c', 'O', 'c', 'G'] },
    { id: 'kitchen-heart-burn', weight: 1, items: ['h', 'K', 'O', 'c', 'S'] },
    { id: 'kitchen-falling-pans', weight: 2, items: ['K', 'O', 'K', 'c', 'K', 'O'] },
    { id: 'kitchen-mud-sauce', weight: 2, items: ['M', 'O', 'c', 'M', 'A'] },
    { id: 'kitchen-decoy-pan', weight: 1, items: ['D', 'O', 'A', 'K', 'c'] },
    { id: 'kitchen-feather-soup', weight: 2, items: ['f', 'K', 'f', 'O', 'f', 'c'] },
    { id: 'kitchen-burner-row', weight: 2, items: ['O', 'c', 'O', 'K', 'A', 'O'] },
    { id: 'kitchen-knife-ballet', weight: 2, items: ['K', 'A', 'K', 'c', 'K', 'S'] },
    { id: 'kitchen-sauce-spill', weight: 2, items: ['M', 'K', 'c', 'M', 'O', 'A'] },
    { id: 'kitchen-pantry-raid', weight: 2, items: ['c', 'c', 'G', 'c', 'O', 'f'] },
    { id: 'kitchen-hot-plate', weight: 2, items: ['O', 'S', 'c', 'O', 'K', 'A'] },
    { id: 'kitchen-gravy-boat', weight: 1, items: ['h', 'O', 'c', 'K', 'c', 'G'] },
    { id: 'kitchen-chopping-block', weight: 2, items: ['S', 'c', 'K', 'A', 'S', 'c'] },
    { id: 'kitchen-steam-burst', weight: 2, items: ['O', 'O', 'c', 'K', 'A', 'f'] },
    { id: 'kitchen-midnight-snack', weight: 1, items: ['D', 'c', 'O', 'A', 'K', 'c'] },
  ],
  forest: [
    { id: 'forest-opening', weight: 3, items: ['T', 'c', 'F', 'A', 'H'] },
    { id: 'forest-trap-maze', weight: 3, items: ['T', 'T', 'c', 'T', 'A', 'T'] },
    { id: 'forest-rain-knives', weight: 3, items: ['K', 'c', 'K', 'F', 'K'] },
    { id: 'forest-bale-wall', weight: 3, items: ['H', 'H', 'A', 'H', 'f'] },
    { id: 'forest-mud-pond', weight: 2, items: ['M', 'M', 'c', 'c', 'M', 'G'] },
    { id: 'forest-fence-hedge', weight: 2, items: ['F', 'F', 'A', 'F', 'F', 'c'] },
    { id: 'forest-golden-leaf', weight: 2, items: ['G', 'T', 'A', 'F', 'f'] },
    { id: 'forest-chili-sprint', weight: 2, items: ['p', 'F', 'T', 'A', 'F', 'K'] },
    { id: 'forest-heart-grove', weight: 1, items: ['h', 'H', 'c', 'T', 'A'] },
    { id: 'forest-sweep-branch', weight: 2, items: ['S', 'T', 'c', 'S', 'A'] },
    { id: 'forest-knife-fall', weight: 2, items: ['K', 'K', 'K', 'c', 'A', 'K'] },
    { id: 'forest-mud-trap', weight: 2, items: ['M', 'T', 'c', 'M', 'T', 'c'] },
    { id: 'forest-decoy-trail', weight: 1, items: ['D', 'c', 'H', 'A', 'T'] },
    { id: 'forest-final-gauntlet', weight: 2, items: ['F', 'K', 'T', 'A', 'O', 'K', 'F'] },
    { id: 'forest-feather-storm', weight: 2, items: ['f', 'f', 'c', 'f', 'A', 'f'] },
    { id: 'forest-owl-watch', weight: 2, items: ['H', 'c', 'T', 'A', 'H', 'f'] },
    { id: 'forest-rain-dance', weight: 2, items: ['K', 'M', 'c', 'K', 'F', 'A'] },
    { id: 'forest-acorn-alley', weight: 2, items: ['c', 'c', 'G', 'c', 'T', 'c'] },
    { id: 'forest-thorn-hedge', weight: 2, items: ['F', 'T', 'A', 'F', 'K', 'c'] },
    { id: 'forest-mossy-log', weight: 2, items: ['H', 'H', 'c', 'M', 'A', 'f'] },
    { id: 'forest-firefly-trail', weight: 2, items: ['f', 'c', 'f', 'G', 'c', 'f'] },
    { id: 'forest-hunter-moon', weight: 1, items: ['h', 'F', 'K', 'T', 'A', 'c'] },
    { id: 'forest-last-leap', weight: 2, items: ['F', 'F', 'K', 'A', 'F', 'G'] },
    { id: 'forest-freedom-run', weight: 2, items: ['c', 'A', 'c', 'F', 'c', 'p', 'G'] },
  ],
};

export const ENDLESS_SEGMENTS = [
  ...SEGMENTS.barnyard,
  ...SEGMENTS.kitchen,
  ...SEGMENTS.forest,
  { id: 'endless-knife-hell', weight: 2, items: ['K', 'K', 'K', 'K', 'A', 'K', 'K'] },
  { id: 'endless-oven-march', weight: 2, items: ['O', 'O', 'A', 'O', 'O', 'c'] },
  { id: 'endless-trap-carpet', weight: 2, items: ['T', 'T', 'T', 'c', 'T', 'T', 'A'] },
  { id: 'endless-fence-wall', weight: 2, items: ['F', 'F', 'F', 'A', 'F', 'F', 'c'] },
  { id: 'endless-corn-jackpot', weight: 1, items: ['c', 'c', 'G', 'c', 'c', 'f', 'c', 'h'] },
  { id: 'endless-sweep-duo', weight: 2, items: ['S', 'S', 'S', 'c', 'A', 'S'] },
];

/** Spacing (px) between consecutive items inside a segment. */
export const ITEM_SPACING = {
  F: 210, H: 240, M: 260, T: 220, O: 300, K: 240, S: 320,
  c: 150, A: 230, G: 220, f: 190, p: 200, h: 200, D: 200,
};

/** Weighted pick from a segment table using the supplied rng. */
export function pickSegment(table, rng) {
  let total = 0;
  for (const seg of table) total += seg.weight;
  let roll = rng() * total;
  for (const seg of table) {
    roll -= seg.weight;
    if (roll <= 0) return seg;
  }
  return table[table.length - 1];
}

/** Shuffle a copy of an array with a seeded rng (Fisher-Yates). */
export function seededShuffle(array, rng) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/**
 * The spawner. It owns the "next spawn x" cursor and deals segments as the
 * world scrolls, so the run is always dense ahead of the turkey and empty
 * behind it. Story mode deals each zone's segments shuffled; Endless draws
 * weighted segments forever with shrinking gaps as difficulty rises.
 */
export class Spawner {
  constructor(mode, seed) {
    this.mode = mode || 'story';
    this.seed = seed || 1;
    this.rng = makeSeededRandom(this.seed * 7919 + 13);
    this.nextSpawnX = 1350;
    this.segmentQueue = [];
    this.zoneId = 'barnyard';
    this.refillQueue();
  }

  refillQueue() {
    if (this.mode === 'endless') {
      this.segmentQueue = seededShuffle(ENDLESS_SEGMENTS, this.rng);
      return;
    }
    const table = SEGMENTS[this.zoneId] || SEGMENTS.barnyard;
    this.segmentQueue = seededShuffle(table, this.rng);
  }

  setZone(zoneId) {
    if (zoneId !== this.zoneId && this.mode !== 'endless') {
      this.zoneId = zoneId;
      this.refillQueue();
    }
  }

  /** Deal the next segment's item codes and advance the spawn cursor. */
  nextSegment(difficulty) {
    if (this.segmentQueue.length === 0) this.refillQueue();
    const segment = this.segmentQueue.shift();
    const gapScale = 1 / Math.max(1, (difficulty && difficulty.hazardMultiplier) || 1);
    const items = [];
    let x = this.nextSpawnX;
    for (const code of segment.items) {
      items.push({ code, x });
      x += (ITEM_SPACING[code] || 200) * (0.92 + 0.16 * this.rng());
    }
    // Segments are separated by a breathing gap that shrinks with difficulty.
    this.nextSpawnX = x + 260 * gapScale + 120;
    return { segmentId: segment.id, items };
  }

  /** Keep the cursor ahead of the camera after a teleport or a reset. */
  ensureAhead(cameraX) {
    if (this.nextSpawnX < cameraX + 1400) this.nextSpawnX = cameraX + 1400;
  }
}

