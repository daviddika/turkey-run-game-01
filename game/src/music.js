// Turkey Trot — music.js
// Original chiptune data for the procedural soundtrack. Notes are MIDI
// numbers; the audio engine (audio.js) turns them into square/triangle
// waves with WebAudio. No audio files, no samples — every sound is
// synthesised live from these tables.
//
// Melodies are written in a bouncy autumn-fairground style: a cheerful
// verse in C major, a tenser kitchen bridge in A minor, and a driving
// forest finale. Each entry is [midiNote, beats]; 0 means a rest.

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** MIDI note number to frequency in Hz. */
export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Human-readable name for a MIDI note, e.g. 72 -> "C5". */
export function midiName(midi) {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

// --- Lead melody: "Turkey Trot Theme" (C major, bouncy 8ths) -------------
export const MELODY_VERSE = [
  [72, 0.5], [76, 0.5], [79, 0.5], [76, 0.5], [72, 0.5], [74, 0.5], [76, 1],
  [77, 0.5], [76, 0.5], [74, 0.5], [72, 0.5], [74, 0.5], [76, 0.5], [74, 1],
  [72, 0.5], [76, 0.5], [79, 0.5], [81, 0.5], [79, 0.5], [76, 0.5], [74, 1],
  [76, 0.5], [74, 0.5], [72, 0.5], [71, 0.5], [72, 1], [0, 0.5], [67, 0.5],
  [72, 0.5], [76, 0.5], [79, 0.5], [76, 0.5], [72, 0.5], [74, 0.5], [76, 1],
  [77, 0.5], [79, 0.5], [81, 0.5], [79, 0.5], [77, 0.5], [76, 0.5], [74, 1],
  [76, 0.5], [74, 0.5], [72, 0.5], [74, 0.5], [76, 0.5], [79, 0.5], [76, 1],
  [74, 0.5], [72, 0.5], [71, 0.5], [72, 1], [0, 1], [67, 1],
];

// --- Bridge: "Kitchen Panic" (A minor, faster, tenser) --------------------
export const MELODY_BRIDGE = [
  [69, 0.5], [72, 0.5], [76, 0.5], [72, 0.5], [69, 0.5], [71, 0.5], [72, 1],
  [74, 0.5], [72, 0.5], [71, 0.5], [69, 0.5], [71, 0.5], [72, 0.5], [71, 1],
  [69, 0.5], [72, 0.5], [76, 0.5], [77, 0.5], [76, 0.5], [72, 0.5], [71, 1],
  [72, 0.5], [71, 0.5], [69, 0.5], [67, 0.5], [69, 1], [0, 0.5], [64, 0.5],
  [69, 0.5], [72, 0.5], [76, 0.5], [72, 0.5], [69, 0.5], [71, 0.5], [72, 1],
  [74, 0.5], [76, 0.5], [77, 0.5], [76, 0.5], [74, 0.5], [72, 0.5], [71, 1],
  [72, 0.5], [71, 0.5], [69, 0.5], [71, 0.5], [72, 0.5], [76, 0.5], [72, 1],
  [71, 0.5], [69, 0.5], [67, 0.5], [69, 1], [0, 1], [64, 1],
];

// --- Finale: "Forest Sprint" (driving, higher, triumphant) ----------------
export const MELODY_FINALE = [
  [79, 0.25], [81, 0.25], [83, 0.5], [81, 0.25], [79, 0.25], [76, 0.5], [74, 0.5],
  [76, 0.25], [79, 0.25], [81, 0.5], [79, 0.25], [76, 0.25], [74, 0.5], [72, 0.5],
  [74, 0.25], [76, 0.25], [79, 0.5], [76, 0.25], [74, 0.25], [72, 0.5], [71, 0.5],
  [72, 0.25], [74, 0.25], [76, 0.5], [79, 0.25], [81, 0.25], [83, 1],
  [81, 0.25], [79, 0.25], [76, 0.5], [74, 0.25], [76, 0.25], [79, 0.5], [81, 0.5],
  [79, 0.25], [76, 0.25], [74, 0.5], [72, 0.25], [74, 0.25], [76, 0.5], [72, 1],
];

// --- Bass lines (one per section, looping under the lead) ------------------
export const BASS_VERSE = [
  [48, 1], [55, 1], [53, 1], [55, 1], [48, 1], [55, 1], [53, 1], [55, 1],
  [45, 1], [52, 1], [50, 1], [52, 1], [48, 1], [55, 1], [53, 1], [55, 1],
];
export const BASS_BRIDGE = [
  [45, 1], [52, 1], [45, 1], [52, 1], [41, 1], [48, 1], [45, 1], [52, 1],
  [45, 1], [52, 1], [45, 1], [52, 1], [43, 1], [50, 1], [45, 1], [52, 1],
];
export const BASS_FINALE = [
  [48, 0.5], [48, 0.5], [55, 0.5], [55, 0.5], [53, 0.5], [53, 0.5], [55, 0.5], [55, 0.5],
  [48, 0.5], [48, 0.5], [55, 0.5], [55, 0.5], [45, 0.5], [45, 0.5], [52, 0.5], [52, 0.5],
];

// --- Boss theme: "Bram's Sprint" (driving, minor, relentless) --------------
export const MELODY_BOSS = [
  [69, 0.25], [69, 0.25], [72, 0.25], [69, 0.25], [67, 0.25], [69, 0.25], [64, 0.5], [67, 0.5],
  [69, 0.25], [69, 0.25], [72, 0.25], [76, 0.25], [74, 0.25], [72, 0.25], [71, 0.5], [69, 0.5],
  [69, 0.25], [69, 0.25], [72, 0.25], [69, 0.25], [67, 0.25], [69, 0.25], [64, 0.5], [67, 0.5],
  [74, 0.25], [72, 0.25], [71, 0.25], [72, 0.25], [74, 0.25], [76, 0.25], [77, 1], [76, 1],
];

// --- Title theme: "Thanksgiving Morning" (gentle, lilting) -----------------
export const MELODY_TITLE = [
  [72, 1], [76, 1], [79, 1], [76, 1], [74, 0.5], [72, 0.5], [74, 1], [67, 1],
  [72, 1], [74, 1], [76, 1], [79, 1], [81, 0.5], [79, 0.5], [76, 1], [74, 1],
  [72, 1], [76, 1], [79, 1], [76, 1], [77, 0.5], [76, 0.5], [74, 1], [72, 1],
  [74, 1], [72, 1], [71, 1], [72, 2], [0, 1], [67, 1],
];

export const BASS_BOSS = [
  [45, 0.5], [45, 0.5], [45, 0.5], [52, 0.5], [45, 0.5], [45, 0.5], [43, 0.5], [50, 0.5],
  [45, 0.5], [45, 0.5], [45, 0.5], [52, 0.5], [41, 0.5], [41, 0.5], [48, 0.5], [45, 0.5],
];
export const BASS_TITLE = [
  [48, 2], [45, 2], [41, 2], [48, 2], [48, 2], [45, 2], [43, 2], [48, 2],
];

// --- Drum pattern: kick / snare / hat per 16th step -----------------------
export const DRUM_PATTERN = [
  'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'hat', 'hat',
  'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'kick', 'hat',
];

/** Tempo per zone (beats per minute). The forest is fastest, the boss faster. */
export const TEMPO_BY_ZONE = { barnyard: 132, kitchen: 148, forest: 162, title: 112, boss: 172 };

/** Which melody section plays in each zone. */
export const SECTION_BY_ZONE = {
  barnyard: 'verse',
  kitchen: 'bridge',
  forest: 'finale',
  title: 'title',
  boss: 'boss',
};

export const MELODIES = { verse: MELODY_VERSE, bridge: MELODY_BRIDGE, finale: MELODY_FINALE, boss: MELODY_BOSS, title: MELODY_TITLE };
export const BASSES = { verse: BASS_VERSE, bridge: BASS_BRIDGE, finale: BASS_FINALE, boss: BASS_BOSS, title: BASS_TITLE };

/** Total beats of a melody table (for loop length). */
export function melodyBeats(melody) {
  return melody.reduce((sum, [, beats]) => sum + beats, 0);
}
