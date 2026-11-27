// Turkey Trot — dialogue.js
// All of the game's words: Farmer Bram's taunts, the turkey's thoughts,
// zone introductions, tips, and the end-screen lines. Written original for
// this game; the menus and the boss banners read from here so the writing
// stays in one editable place.

export const FARMER_TAUNTS = [
  'Come back here, dinner!',
  'You are NOT ruining Thanksgiving!',
  'That bird is MINE!',
  'Gobble all you want — you are still supper!',
  'I have chased slower birds than you!',
  'The oven is already hot, turkey!',
  'No stuffing escapes ME!',
  'Get back in the coop!',
  'I can smell the gravy already!',
  'Run, run — it only tenderises you!',
  'You cannot outrun a farmer with a plan!',
  'Thanksgiving waits for no turkey!',
  'My knife has your name on it!',
  'The carving board misses you already!',
  'I raised you — I will roast you!',
  'Faster, bird! The guests arrive at six!',
];

export const CHEF_TAUNTS = [
  'The knife is sharp and so am I!',
  'Into the oven, little drumstick!',
  'I have seasoned the pan already!',
  'A turkey that runs is a turkey that marinates!',
  'Hold still — this will only hurt once!',
  'The carving knife never misses twice!',
  'You smell delicious already!',
  'Back on the platter, bird!',
];

export const HUNTER_TAUNTS = [
  'No turkey escapes my forest!',
  'The net is ready, the rain is falling!',
  'I tracked you through three zones!',
  'Freedom is a myth, turkey!',
  'One last sprint and you are mine!',
  'The forest belongs to ME!',
  'Your feathers will make a fine hat!',
];

export const TURKEY_THOUGHTS = [
  'Gobble gobble — NOT TODAY, FARMER!',
  'My legs were made for running!',
  'Corn first, freedom second!',
  'I did not survive the coop to end up on a plate!',
  'Feathers: fashionable AND aerodynamic!',
  'If I can dodge a knife, I can dodge destiny!',
  'Thanksgiving? More like Thanks-GIVING me a head start!',
  'Waddle faster! Waddle faster!',
];

export const ZONE_INTROS = {
  barnyard: {
    title: 'ZONE 1 — THE BARNYARD',
    lines: [
      'Dawn, November. The farm wakes hungry.',
      'Farmer Bram opens the coop with a grin and a pitchfork.',
      'You are the turkey. You are NOT dinner. RUN!',
    ],
  },
  kitchen: {
    title: 'ZONE 2 — THE FARMHOUSE KITCHEN',
    lines: [
      'You burst through the back door — straight into the kitchen!',
      'The oven roars. Chef Bram twirls his carving knife.',
      'Dodge the heat, dodge the knives, keep moving!',
    ],
  },
  forest: {
    title: 'ZONE 3 — THE AUTUMN FOREST',
    lines: [
      'Cold rain, falling leaves, the smell of freedom.',
      'Hunter Bram waits at the treeline with his net.',
      'One last sprint. Escape, and Thanksgiving loses!',
    ],
  },
};

export const BOSS_INTROS = {
  barnyard: 'FARMER BRAM IS SPRINTING! Survive the chase!',
  kitchen: 'CHEF BRAM AND HIS CARVING KNIVES! Keep dodging!',
  forest: 'HUNTER BRAM BLOCKS THE TREELINE! This is the final sprint!',
};

export const TIPS = [
  'Tip: Press SPACE or W to jump — twice for a double jump.',
  'Tip: Hold SHIFT or X to dash. Dashing costs stamina.',
  'Tip: Golden corn refills your dash and gives a shield.',
  'Tip: Corn decoys stun the farmer. Drop one with C!',
  'Tip: Chili peppers give a speed burst — but you steer worse!',
  'Tip: Feathers build your combo. A high combo multiplies corn score.',
  'Tip: Mud slows you down. Jump over it or dash through it.',
  'Tip: Oven heat zones hurt — hop over the glow, not through it.',
  'Tip: Falling knives telegraph with a shadow. Move away from it!',
  'Tip: The farmer speeds up when he can see you. Break line of sight behind hay bales!',
  'Tip: Press P to pause. Press M to mute. Press R to restart.',
  'Tip: Spend corn on upgrades between runs — speed and stamina help most.',
  'Tip: In Time Trial, dashes are free but the clock never stops.',
  'Tip: A full stamina bar means a free dash chain. Chain three in a row!',
];

export const END_LINES = {
  caught: [
    'CAUGHT! Bram is already reaching for the gravy.',
    'The oven wins this round. The turkey demands a rematch!',
    'Stuffed, roasted, served. But turkeys never stay down — try again!',
  ],
  escaped: [
    'ESCAPED! The turkey vanishes into the autumn forest, free forever!',
    'Thanksgiving is cancelled — at least for one very fast turkey!',
    'Bram shakes his fist at the treeline. The turkey gobbles triumphantly!',
  ],
  endless: [
    'The run ends, but the legend grows. How far next time?',
    'Every metre further is a new best. The farm never forgets a fast turkey.',
  ],
};

export const UPGRADE_FLAVOR = {
  speed: 'Lighter feet, longer strides. +6% run speed per level.',
  stamina: 'A bigger tank for dashing. +25 max stamina per level.',
  life: 'One extra heart at the start of every run. Because Bram is rude.',
  decoy: 'Carry one more corn decoy. Bram hates corn decoys.',
  magnet: 'Corn drifts toward you from further away. Lazy and effective.',
  combo: 'Your combo decays slower. Show-offs welcome.',
};

export function randomTaunt(zoneId) {
  const pool = zoneId === 'kitchen' ? CHEF_TAUNTS : zoneId === 'forest' ? HUNTER_TAUNTS : FARMER_TAUNTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomThought() {
  return TURKEY_THOUGHTS[Math.floor(Math.random() * TURKEY_THOUGHTS.length)];
}

export function randomTip() {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

export function randomEndLine(outcome) {
  const pool = END_LINES[outcome] || END_LINES.caught;
  return pool[Math.floor(Math.random() * pool.length)];
}

// --- Extra taunts: Bram never runs out of things to shout ----------------
export const FARMER_TAUNTS_EXTRA = [
  'I have a very particular set of skills — farming!',
  'The gravy boat is already on the table!',
  'You are the main course and you know it!',
  'My grandmother chased faster turkeys than you!',
  'The cranberry sauce is waiting, bird!',
  'I will carve you with a smile!',
  'No bird outruns a farmer before lunch!',
  'The dinner bell rang an hour ago!',
];

export const CHEF_TAUNTS_EXTRA = [
  'The roasting pan is buttered and ready!',
  'I have a recipe with your name on it!',
  'Thyme, rosemary, and one running turkey!',
  'The oven timer is counting down for YOU!',
];

export const HUNTER_TAUNTS_EXTRA = [
  'The forest has no exits, only entrances!',
  'I know every trail — you know none!',
  'Your footprints glow in the rain, turkey!',
  'The trees themselves will catch you!',
];

export const TURKEY_THOUGHTS_EXTRA = [
  'If Bram wanted a runner, he should have raised a roadrunner!',
  'My tail feathers are not a garnish!',
  'I have outrun a pitchfork, a knife and a net. What is next, a spatula?',
  'Freedom smells like wet leaves and no gravy!',
  'Note to self: never trust a farmer holding a fork!',
];

export const TIPS_EXTRA = [
  'Tip: A decoy dropped right before a boss sprint buys you seconds.',
  'Tip: Golden corn always spawns near the hardest jumps. Worth it.',
  'Tip: In the Kitchen, the oven glow reaches further than it looks.',
  'Tip: Your combo only breaks when you get hit. Play clean, score big.',
  'Tip: Endless mode reuses every zone — learn the segments, not the map.',
  'Tip: A double jump clears two fences in a row. A dash clears three.',
];

// --- Bram's diary: one line per entry, shown on the title screen ----------
export const FARMER_DIARY = [
  'Day 1: The turkey looked at me funny. I think it knows.',
  'Day 2: Bought a bigger oven. The turkey pretended not to notice.',
  'Day 3: Sharpened the carving knife. The turkey sharpened its wits.',
  'Day 4: The turkey ate my best corn. This is war now.',
  'Day 5: Practised my sprint. The turkey practised harder.',
  'Day 6: Hid a trap under the leaves. The turkey jumped it. Show-off.',
  'Day 7: The turkey left a feather on my pillow. A warning?',
  'Day 8: Asked the chef for knife tips. He gave me the big one.',
  'Day 9: Rain in the forest. Perfect hunting weather. For me.',
  'Day 10: The turkey has a fan club now. The rooster, mainly.',
  'Day 11: Corn decoys everywhere. I fell for three. THREE.',
  'Day 12: Thanksgiving is coming. So is that turkey. To the table.',
  'Day 13: The turkey can double-jump. I can barely single-jump.',
  'Day 14: Bought a net. The turkey laughed. I heard it. It laughed.',
  'Day 15: The oven is hot, the knife is sharp, the turkey is fast.',
  'Day 16: If I catch it, I am carving it myself. With feeling.',
  'Day 17: The forest is my turf. The turkey disagrees. Loudly.',
  'Day 18: Note: turkeys can read. It read this diary. It gobble-laughed.',
  'Day 19: Tomorrow, the chase. Tonight, the sharpening.',
  'Day 20: Dear diary, the turkey escaped again. I am not even mad. I am mad.',
  'Day 21: New plan: be the turkey. Think like the turkey. Fail like the turkey.',
  'Day 22: The turkey left corn on my doorstep. A peace offering? A taunt?',
  'Day 23: I have chased this bird through three zones. Respect. Still dinner.',
  'Day 24: Thanksgiving menu: turkey (pending), stuffing, regret.',
];

/** One diary line, rotating slowly with the title screen clock. */
export function diaryLineForTime(seconds) {
  const index = Math.floor(seconds / 5) % FARMER_DIARY.length;
  return FARMER_DIARY[index];
}
