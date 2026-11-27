// Turkey Trot — fieldguide.js
// Bram's Field Guide: an in-fiction encyclopedia of everything in the run.
// Each entry names the thing, says what it does, and gives the turkey one
// honest tip. The title screen rotates one line from here, and the end
// screen's tip pool draws from the same book, so the writing is part of
// the game rather than decoration in a drawer.

export const FIELD_GUIDE_HAZARDS = [
  {
    id: 'fence', name: 'Farm Fence', danger: 2,
    blurb: 'A honest wooden fence. It keeps chickens in and turkeys out — usually.',
    tip: 'Jump it cleanly and you keep every bit of speed. Clip it and Bram gains.',
  },
  {
    id: 'haybale', name: 'Hay Bale', danger: 2,
    blurb: 'A big golden roll of last summer. Soft to land on, tall enough to hide behind.',
    tip: 'Crouch behind a bale and Bram loses sight of you. His suspicion drains.',
  },
  {
    id: 'mud', name: 'Mud Puddle', danger: 1,
    blurb: 'November rain plus a dirt yard equals this. It will not hurt you. It will slow you.',
    tip: 'Jump the puddle, or dash through it — a dash ignores the suck of the mud.',
  },
  {
    id: 'trap', name: 'Snap Trap', danger: 3,
    blurb: 'Bram hides these under the leaves. They snap shut with a sound like a slammed book.',
    tip: 'The teeth only bite on the ground. Jump over an armed trap and it stays armed.',
  },
  {
    id: 'oven', name: 'Preheated Oven', danger: 4,
    blurb: 'The farmhouse oven, roaring at roasting temperature. The glow reaches further than it looks.',
    tip: 'You cannot jump through the heat. Time your hop to clear the whole glow.',
  },
  {
    id: 'knife', name: 'Falling Carving Knife', danger: 4,
    blurb: 'Chef Bram throws these like confetti. Each one telegraphs with a red shadow first.',
    tip: 'Watch the shadow, not the knife. Move off the red mark and keep running.',
  },
  {
    id: 'knifeSweep', name: 'Sweeping Carving Knife', danger: 3,
    blurb: 'A blade on a rail, sliding back and forth across the kitchen floor like a metronome.',
    tip: 'Pass behind it, never in front of it. Its rhythm never changes — yours can.',
  },
];

export const FIELD_GUIDE_PICKUPS = [
  {
    id: 'corn', name: 'Corn Cob', value: '10 points',
    blurb: 'The farm grows it, Bram hoards it, the turkey earns it. Currency of the barnyard.',
    tip: 'Corn is banked between runs. Spend it on upgrades — speed first.',
  },
  {
    id: 'golden', name: 'Golden Corn', value: '50 points + shield',
    blurb: 'One cob in a hundred grows golden. Eating it refills your dash and wraps you in a shield.',
    tip: 'Golden corn always spawns near the hardest jumps. The risk is the price.',
  },
  {
    id: 'feather', name: 'Loose Feather', value: 'combo +2',
    blurb: 'A feather from a faster bird. Collecting them builds your combo multiplier.',
    tip: 'Five pickups in a row doubles your corn score. Ten triples it.',
  },
  {
    id: 'chili', name: 'Chili Pepper', value: 'speed burst',
    blurb: 'Grown in the kitchen garden, hotter than the oven. Eat one and you fly — briefly.',
    tip: 'Chili makes you faster and harder to steer. Use it on a straight stretch.',
  },
  {
    id: 'heart', name: 'Warm Heart', value: '+1 life',
    blurb: 'Rare and red. Somebody on this farm still loves the turkey.',
    tip: 'Hearts only appear when you are hurt. The farm rewards a comeback.',
  },
  {
    id: 'decoy', name: 'Corn Decoy', value: '+1 decoy',
    blurb: 'A cob dressed up as a turkey. Bram cannot resist it, and it stuns him cold.',
    tip: 'Drop a decoy with C right before a boss sprint. Seconds are everything.',
  },
];

export const FIELD_GUIDE_FARMERS = [
  {
    id: 'farmer', name: 'Farmer Bram', zone: 'Barnyard', weapon: 'Pitchfork',
    blurb: 'The original Bram. Up at dawn, fork in hand, absolutely certain the turkey is dinner.',
    tip: 'He patrols until he sees you, then he chases. Break his line of sight to cool him down.',
  },
  {
    id: 'chef', name: 'Chef Bram', zone: 'Kitchen', weapon: 'Carving Knife',
    blurb: 'Same Bram, white coat, sharper tools. He seasons the pan before he seasons the bird.',
    tip: 'His knives fall where you are, not where you will be. Keep moving sideways.',
  },
  {
    id: 'hunter', name: 'Hunter Bram', zone: 'Forest', weapon: 'Net',
    blurb: 'Same Bram, green coat, long memory. He has tracked the turkey through two whole zones.',
    tip: 'The final sprint is the fastest stretch of the run. Save a dash for the treeline.',
  },
];

export const FIELD_GUIDE_ZONES = [
  {
    id: 'barnyard', name: 'The Barnyard', time: 'Dawn',
    blurb: 'Golden light, wet grass, one rooster cheering from the fence. The easiest zone — and the one that teaches you everything.',
    tip: 'Learn the jump here. The kitchen will not forgive a late one.',
  },
  {
    id: 'kitchen', name: 'The Farmhouse Kitchen', time: 'Midday',
    blurb: 'Warm lamplight, copper pots, and an oven that never cools. The most dangerous room on the farm.',
    tip: 'Ovens block and burn. Knives fall and sweep. Never stop moving in here.',
  },
  {
    id: 'forest', name: 'The Autumn Forest', time: 'Dusk Rain',
    blurb: 'Cold rain, falling leaves, fireflies, and freedom past the treeline. The fastest zone of the run.',
    tip: 'Rain hides traps. Watch the ground, not the sky.',
  },
];

export const FIELD_GUIDE_TURKEY = [
  {
    id: 'turkey', name: 'The Turkey', role: 'Hero',
    blurb: 'One brave bird, 64 pixels of pure refusal. It has never been dinner and it never will be.',
    tip: 'Double jump, dash, decoy. Three tools, one free turkey.',
  },
  {
    id: 'gobble', name: 'The Gobble', role: 'Battle Cry',
    blurb: 'Loud, proud, and completely uncalled for. The turkey gobbles when it jumps, when it lands, and when it escapes.',
    tip: 'Press M to mute the gobble. The turkey will not notice. It never does.',
  },
];

/** Look up a hazard entry by kind id. */
export function fieldGuideEntryForHazard(kind) {
  return FIELD_GUIDE_HAZARDS.find((entry) => entry.id === kind) || null;
}

/** Look up a pickup entry by kind id. */
export function fieldGuideEntryForPickup(kind) {
  return FIELD_GUIDE_PICKUPS.find((entry) => entry.id === kind) || null;
}

/** Look up a farmer entry by id. */
export function fieldGuideEntryForFarmer(id) {
  return FIELD_GUIDE_FARMERS.find((entry) => entry.id === id) || null;
}

/** Look up a zone entry by id. */
export function fieldGuideEntryForZone(id) {
  return FIELD_GUIDE_ZONES.find((entry) => entry.id === id) || null;
}

/** All guide entries flattened, for anything that wants to list the book. */
export function allFieldGuideEntries() {
  return [
    ...FIELD_GUIDE_HAZARDS,
    ...FIELD_GUIDE_PICKUPS,
    ...FIELD_GUIDE_FARMERS,
    ...FIELD_GUIDE_ZONES,
    ...FIELD_GUIDE_TURKEY,
  ];
}

/** One rotating field-guide line for the title screen. */
export function fieldGuideLineForTime(seconds) {
  const entries = allFieldGuideEntries();
  const index = Math.floor(seconds / 6) % entries.length;
  const entry = entries[index];
  return entry.name + ' — ' + entry.tip;
}

/** A random tip from the whole guide, for the end screen. */
export function randomFieldGuideTip() {
  const entries = allFieldGuideEntries();
  const entry = entries[Math.floor(Math.random() * entries.length)];
  return entry.name + ': ' + entry.tip;
}
