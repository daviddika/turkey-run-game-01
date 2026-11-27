// Turkey Trot — audio.js
// Synthesised WebAudio sound: a procedural chiptune loop (music.js data)
// plus gobble / jump / pickup / sting effects. No audio files, no samples,
// no network — everything is an oscillator and a noise buffer built live.
// The AudioContext is created lazily on the first user gesture, as browsers
// require, and M toggles mute at any time.

import { midiToFrequency, MELODIES, BASSES, DRUM_PATTERN, TEMPO_BY_ZONE, SECTION_BY_ZONE } from './music.js';
import { clamp } from './utils.js';

export class TurkeyAudio {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.musicOn = true;
    this.currentZone = 'title';
    this.melodyIndex = 0;
    this.melodyBeat = 0;
    this.bassIndex = 0;
    this.bassBeat = 0;
    this.drumStep = 0;
    this.nextNoteTime = 0;
    this.schedulerTimer = null;
    this.noiseBuffer = null;
    this.started = false;
  }

  /** Create the AudioContext on a user gesture. Safe to call repeatedly. */
  ensureContext() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return true;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    this.context = new AudioContextClass();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.9;
    this.masterGain.connect(this.context.destination);
    this.musicGain = this.context.createGain();
    this.musicGain.gain.value = 0.32;
    this.musicGain.connect(this.masterGain);
    this.sfxGain = this.context.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.masterGain);
    const length = this.context.sampleRate;
    this.noiseBuffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  /** Toggle mute. Returns the new muted state. */
  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 0.9;
    return this.muted;
  }

  /** Start the music scheduler loop. */
  startMusic(zoneId) {
    if (!this.ensureContext()) return;
    this.setZone(zoneId || 'title');
    if (this.schedulerTimer) return;
    this.nextNoteTime = this.context.currentTime + 0.1;
    this.schedulerTimer = window.setInterval(() => this.scheduleMusicAhead(), 40);
    this.started = true;
  }

  stopMusic() {
    if (this.schedulerTimer) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.started = false;
  }

  /** Switch the music section when the zone changes. */
  setZone(zoneId) {
    const next = SECTION_BY_ZONE[zoneId] ? zoneId : 'title';
    if (next !== this.currentZone) {
      this.currentZone = next;
      this.melodyIndex = 0;
      this.melodyBeat = 0;
      this.bassIndex = 0;
      this.bassBeat = 0;
      this.drumStep = 0;
    }
  }

  tempo() {
    return TEMPO_BY_ZONE[this.currentZone] || 132;
  }

  secondsPerBeat() {
    return 60 / this.tempo();
  }

  scheduleMusicAhead() {
    if (!this.context || this.muted || !this.musicOn) return;
    const spb = this.secondsPerBeat();
    while (this.nextNoteTime < this.context.currentTime + 0.18) {
      this.scheduleStep(this.nextNoteTime, spb);
      this.nextNoteTime += spb / 4; // 16th-note steps
    }
  }

  scheduleStep(when, spb) {
    const section = SECTION_BY_ZONE[this.currentZone] || 'verse';
    const melody = MELODIES[section];
    const bass = BASSES[section];
    // Drum on every 16th step.
    const drum = DRUM_PATTERN[this.drumStep % DRUM_PATTERN.length];
    if (drum === 'kick') this.playKick(when);
    else if (drum === 'snare') this.playSnare(when);
    else this.playHat(when, this.drumStep % 4 === 0);
    this.drumStep += 1;
    // Lead melody advances in quarter-beat chunks.
    if (this.melodyBeat <= 0) {
      const [note, beats] = melody[this.melodyIndex % melody.length];
      if (note > 0) this.playTone(when, midiToFrequency(note), beats * spb, 'square', 0.10);
      this.melodyBeat = beats;
      this.melodyIndex += 1;
    }
    this.melodyBeat -= 0.25;
    // Bass advances the same way.
    if (this.bassBeat <= 0) {
      const [note, beats] = bass[this.bassIndex % bass.length];
      if (note > 0) this.playTone(when, midiToFrequency(note), beats * spb, 'triangle', 0.16);
      this.bassBeat = beats;
      this.bassIndex += 1;
    }
    this.bassBeat -= 0.25;
  }

  playTone(when, frequency, duration, wave, volume) {
    if (!this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(volume, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, when + Math.max(0.05, duration * 0.95));
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }

  playKick(when) {
    if (!this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.12);
    gain.gain.setValueAtTime(0.5, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.14);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(when);
    osc.stop(when + 0.16);
  }

  playSnare(when) {
    this.playNoise(when, 0.12, 1800, 0.22, this.musicGain);
  }

  playHat(when, accent) {
    this.playNoise(when, 0.04, 7000, accent ? 0.10 : 0.05, this.musicGain);
  }

  playNoise(when, duration, filterFrequency, volume, destination) {
    if (!this.context || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = filterFrequency;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(when);
    source.stop(when + duration + 0.02);
  }

  // ---- Sound effects -------------------------------------------------------

  sfxNow() {
    return this.context ? this.context.currentTime : 0;
  }

  playSfxTone(frequency, duration, wave, volume, slideTo) {
    if (!this.ensureContext() || this.muted) return;
    const now = this.sfxNow();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /** The turkey's signature gobble: three quick descending honks. */
  playGobble() {
    if (!this.ensureContext() || this.muted) return;
    const now = this.sfxNow();
    [620, 520, 430].forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + i * 0.09 + 0.08);
      gain.gain.setValueAtTime(0.16, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.09);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.1);
    });
  }

  playJump() {
    this.playSfxTone(280, 0.16, 'square', 0.14, 620);
  }

  playDoubleJump() {
    this.playSfxTone(420, 0.14, 'square', 0.12, 880);
  }

  playDash() {
    if (!this.ensureContext() || this.muted) return;
    this.playNoise(this.sfxNow(), 0.18, 900, 0.25, this.sfxGain);
    this.playSfxTone(180, 0.18, 'sawtooth', 0.08, 90);
  }

  playPickup(combo) {
    const base = 660 + clamp(combo || 0, 0, 12) * 28;
    this.playSfxTone(base, 0.12, 'sine', 0.2, base * 1.5);
  }

  playGoldenCorn() {
    this.playSfxTone(880, 0.1, 'sine', 0.2, 1320);
    window.setTimeout(() => this.playSfxTone(1320, 0.18, 'sine', 0.18, 1760), 90);
  }

  playFeather() {
    this.playSfxTone(980, 0.09, 'triangle', 0.16, 1400);
  }

  playChili() {
    this.playSfxTone(300, 0.25, 'sawtooth', 0.16, 900);
  }

  playHurt() {
    this.playSfxTone(220, 0.3, 'sawtooth', 0.25, 70);
    if (this.context && !this.muted) this.playNoise(this.sfxNow(), 0.2, 500, 0.3, this.sfxGain);
  }

  playSting() {
    // Dramatic "caught" sting: descending minor arpeggio.
    [392, 311, 233, 175].forEach((freq, i) => {
      window.setTimeout(() => this.playSfxTone(freq, 0.35, 'triangle', 0.22), i * 130);
    });
  }

  playFanfare() {
    // Escape fanfare: rising C major arpeggio.
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      window.setTimeout(() => this.playSfxTone(freq, 0.4, 'square', 0.14), i * 110);
    });
  }

  playBossRoar() {
    this.playSfxTone(110, 0.5, 'sawtooth', 0.28, 55);
    if (this.context && !this.muted) this.playNoise(this.sfxNow(), 0.4, 300, 0.3, this.sfxGain);
  }

  playClick() {
    this.playSfxTone(700, 0.06, 'square', 0.12, 900);
  }

  playZoneClear() {
    [523, 659, 784].forEach((freq, i) => {
      window.setTimeout(() => this.playSfxTone(freq, 0.25, 'triangle', 0.18), i * 100);
    });
  }

  playDecoy() {
    this.playSfxTone(500, 0.12, 'sine', 0.18, 250);
    window.setTimeout(() => this.playSfxTone(250, 0.2, 'sine', 0.14, 500), 120);
  }
}
