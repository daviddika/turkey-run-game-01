// Turkey Trot — tutorial.js
// Contextual first-run hints: short lines that appear exactly when the
// turkey first meets each mechanic — the first fence, the first mud, the
// first golden corn, the first boss. Shown only while the player is still
// learning (their first few runs), then never again, so veterans are not
// nagged and the screen stays clean for screenshots.

export const TUTORIAL_HINTS = [
  {
    id: 'move', trigger: 'distance', at: 5,
    text: 'Move with ARROW KEYS or A / D — or hold the MOUSE to steer!',
    once: true,
  },
  {
    id: 'jump', trigger: 'hazardNear', kind: 'fence',
    text: 'A fence! Press SPACE to jump — press it twice for a double jump!',
    once: true,
  },
  {
    id: 'dash', trigger: 'distance', at: 120,
    text: 'Hold SHIFT to DASH through danger. Watch your stamina bar!',
    once: true,
  },
  {
    id: 'corn', trigger: 'pickupNear', kind: 'corn',
    text: 'Corn is score — and money! Spend it on upgrades after the run.',
    once: true,
  },
  {
    id: 'golden', trigger: 'pickupNear', kind: 'golden',
    text: 'GOLDEN CORN! It refills your dash and gives you a shield!',
    once: true,
  },
  {
    id: 'mud', trigger: 'hazardNear', kind: 'mud',
    text: 'Mud slows you down — and Bram gains on you. Jump it!',
    once: true,
  },
  {
    id: 'trap', trigger: 'hazardNear', kind: 'trap',
    text: 'A trap! Jump over it — it only bites on the ground.',
    once: true,
  },
  {
    id: 'oven', trigger: 'hazardNear', kind: 'oven',
    text: 'The oven is HOT! The glow hurts — hop clean over it!',
    once: true,
  },
  {
    id: 'knife', trigger: 'hazardNear', kind: 'knife',
    text: 'A falling knife! Move away from the red shadow!',
    once: true,
  },
  {
    id: 'decoy', trigger: 'farmerClose', at: 200,
    text: 'Bram is close! Press C to drop a corn decoy and stun him!',
    once: true,
  },
  {
    id: 'boss', trigger: 'boss',
    text: 'BOSS! Survive the sprint — dodge everything for 12 seconds!',
    once: true,
  },
  {
    id: 'feather', trigger: 'pickupNear', kind: 'feather',
    text: 'Feathers build your COMBO — more combo, more points per corn!',
    once: true,
  },
];

export class TutorialHints {
  constructor() {
    this.shown = new Set();
    this.activeHint = null;
    this.activeUntil = 0;
    this.enabled = true;
  }

  /** Enable hints only for new players (few runs on record). */
  configureForSave(save) {
    this.enabled = (save.totalRuns || 0) < 3;
  }

  /** Show a hint for a few seconds, unless it was already shown. */
  showHint(hint, now) {
    if (!this.enabled || this.shown.has(hint.id)) return false;
    this.shown.add(hint.id);
    this.activeHint = hint;
    this.activeUntil = now + 3600;
    return true;
  }

  /** Check distance-based triggers each frame. */
  checkDistanceTriggers(distance, now) {
    if (!this.enabled) return;
    for (const hint of TUTORIAL_HINTS) {
      if (hint.trigger !== 'distance') continue;
      if (distance >= hint.at && !this.shown.has(hint.id)) {
        this.showHint(hint, now);
      }
    }
  }

  /** Check proximity triggers (hazards / pickups / farmer / boss). */
  checkProximityTriggers(game, now) {
    if (!this.enabled) return;
    const turkey = game.turkey;
    for (const hint of TUTORIAL_HINTS) {
      if (this.shown.has(hint.id)) continue;
      if (hint.trigger === 'hazardNear') {
        const near = game.hazards.some((h) => h.kind === hint.kind && h.x > turkey.x && h.x - turkey.x < 420);
        if (near) this.showHint(hint, now);
      } else if (hint.trigger === 'pickupNear') {
        const near = game.pickups.some((p) => p.kind === hint.kind && p.x > turkey.x && p.x - turkey.x < 380);
        if (near) this.showHint(hint, now);
      } else if (hint.trigger === 'farmerClose') {
        if (game.farmer.gapTo(turkey) < hint.at) this.showHint(hint, now);
      } else if (hint.trigger === 'boss') {
        if (game.bossActive) this.showHint(hint, now);
      }
    }
  }

  /** The hint to draw right now, or null. */
  currentHint(now) {
    if (!this.activeHint) return null;
    if (now > this.activeUntil) {
      this.activeHint = null;
      return null;
    }
    return this.activeHint;
  }
}
