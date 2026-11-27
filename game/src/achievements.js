// Turkey Trot — achievements.js
// A small achievements system: milestones a run can earn, checked at the
// moments that matter (pickups, combos, zone clears, escapes, deaths).
// Unlocked achievements are saved in localStorage and shown on the title
// screen as a trophy row, so there is always one more reason to run again.

export const ACHIEVEMENTS = [
  { id: 'first-run', name: 'First Flight', desc: 'Start your first run.', icon: 'EGG' },
  { id: 'first-corn', name: 'Corn Collector', desc: 'Collect 10 corn in one run.', icon: 'CORN' },
  { id: 'corn-hoard', name: 'Corn Hoarder', desc: 'Collect 50 corn in one run.', icon: 'CORN' },
  { id: 'combo-5', name: 'Show-Off', desc: 'Reach a 5 combo.', icon: 'FEATHER' },
  { id: 'combo-10', name: 'Unstoppable', desc: 'Reach a 10 combo.', icon: 'FEATHER' },
  { id: 'zone-1', name: 'Barnyard Survivor', desc: 'Clear Zone 1.', icon: 'BARN' },
  { id: 'zone-2', name: 'Kitchen Survivor', desc: 'Clear Zone 2.', icon: 'OVEN' },
  { id: 'escape', name: 'FREE!', desc: 'Escape the farm in Story mode.', icon: 'TURKEY' },
  { id: 'speed-escape', name: 'Thanksgiving Express', desc: 'Escape in under 3 minutes.', icon: 'CLOCK' },
  { id: 'endless-1000', name: 'Marathon Bird', desc: 'Run 1,000 m in Endless mode.', icon: 'BOOT' },
  { id: 'endless-2000', name: 'Legend of the Farm', desc: 'Run 2,000 m in Endless mode.', icon: 'BOOT' },
  { id: 'decoy-master', name: 'Decoy Master', desc: 'Stun Bram 3 times in one run.', icon: 'DECOY' },
  { id: 'no-hit', name: 'Untouchable', desc: 'Finish a Story zone without taking a hit.', icon: 'SHIELD' },
  { id: 'shopper', name: 'Big Spender', desc: 'Buy your first upgrade.', icon: 'COIN' },
  { id: 'ten-runs', name: 'Persistent Poultry', desc: 'Finish 10 runs.', icon: 'EGG' },
];

/** Load the unlocked set from the save (stored as an array of ids). */
export function loadAchievements(save) {
  const unlocked = new Set(save.achievements || []);
  return unlocked;
}

/** Unlock an achievement: returns the def if it was newly unlocked. */
export function unlockAchievement(save, unlockedSet, achievementId) {
  if (unlockedSet.has(achievementId)) return null;
  const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!def) return null;
  unlockedSet.add(achievementId);
  save.achievements = Array.from(unlockedSet);
  return def;
}

/**
 * Check run milestones against the current run state. Returns a list of
 * newly unlocked achievement defs (usually empty). Call it after pickups,
 * zone clears and at the end of a run.
 */
export function checkRunAchievements(save, unlockedSet, run) {
  const newly = [];
  const unlock = (id) => {
    const def = unlockAchievement(save, unlockedSet, id);
    if (def) newly.push(def);
  };
  if (run.totalRunsStarted >= 1) unlock('first-run');
  if (run.corn >= 10) unlock('first-corn');
  if (run.corn >= 50) unlock('corn-hoard');
  if (run.bestCombo >= 5) unlock('combo-5');
  if (run.bestCombo >= 10) unlock('combo-10');
  if (run.zonesCleared >= 1) unlock('zone-1');
  if (run.zonesCleared >= 2) unlock('zone-2');
  if (run.escaped) unlock('escape');
  if (run.escaped && run.time < 180) unlock('speed-escape');
  if (run.mode === 'endless' && run.distance >= 1000) unlock('endless-1000');
  if (run.mode === 'endless' && run.distance >= 2000) unlock('endless-2000');
  if (run.stuns >= 3) unlock('decoy-master');
  if (run.zonesCleared >= 1 && run.hitsTaken === 0) unlock('no-hit');
  if (save.totalRuns >= 10) unlock('ten-runs');
  return newly;
}

/** How many achievements are unlocked, for the title-screen trophy row. */
export function achievementProgress(unlockedSet) {
  return { unlocked: unlockedSet.size, total: ACHIEVEMENTS.length };
}
