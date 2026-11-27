// Turkey Trot — main.js
// The Great Thanksgiving Escape: game bootstrap, state machine and loop.
// States: title -> intro (zone card) -> play -> boss (inside play) ->
// paused, and end (caught / escaped). The loop owns spawning, collisions,
// scoring, zone changes, boss fights, modes (story / endless / trial) and
// the screenshot hook. Rendering lives in render.js, menus in menus.js.
//
// Controls: Arrows/WASD move + jump, Space jump (double jump), Shift/X
// dash, C decoy, P pause, M mute, R restart, Enter/click confirm. Hold the
// mouse to steer the turkey; click the menu buttons.

import { clamp, boxesOverlap, makeSeededRandom } from './utils.js';
import { TurkeyAudio } from './audio.js';
import { TurkeyInput } from './input.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import {
  Hazard, makeFence, makeHayBale, makeMud, makeTrap, makeOven,
  makeFallingKnife, makeSweepingKnife,
} from './hazards.js';
import {
  Pickup, makeCorn, makeGoldenCorn, makeFeather, makeChili, makeHeart,
  makeCornArc, makeCornLine, ComboMeter,
} from './collectibles.js';
import { ParticleSystem, WeatherSystem } from './particles.js';
import { Spawner, ITEM_SPACING } from './levels.js';
import {
  ZONES, ZONE_ORDER, ZONE_LENGTHS, zoneForDistance, zoneProgress, storyTotalDistance,
  isBossStretch, difficultyAt, MODES,
} from './zones.js';
import {
  loadSave, storeSave, recordRun, statsFromUpgrades, buyUpgrade,
} from './storage.js';
import {
  drawBackground, drawTurkey, drawFarmer, drawHazard, drawPickup,
  drawDecoy, drawParticles, drawWeather, drawHUD, VIEW_W, VIEW_H,
} from './render.js';
import {
  drawTitleScreen, drawZoneIntro, drawBossBanner, drawPauseMenu,
  drawEndScreen, pointInButton,
} from './menus.js';
import { parseShotQuery, playShotSetup, bossShotSetup, endShotSetup } from './shots.js';
import { ZONE_INTROS, BOSS_INTROS, randomEndLine, randomTip, randomTaunt } from './dialogue.js';
import { TutorialHints } from './tutorial.js';
import { loadAchievements, checkRunAchievements, unlockAchievement, achievementProgress } from './achievements.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
if (!ctx) {
  document.getElementById('fallback').hidden = false;
}

export const GAME_STATES = ['title', 'intro', 'play', 'paused', 'end'];

class TurkeyTrotGame {
  constructor() {
    this.audio = new TurkeyAudio();
    this.input = new TurkeyInput(canvas);
    this.save = loadSave();
    this.audio.muted = !!this.save.muted;
    this.particles = new ParticleSystem();
    this.weather = new WeatherSystem();
    this.tutorial = new TutorialHints();
    this.tutorial.configureForSave(this.save);
    this.unlockedAchievements = loadAchievements(this.save);
    this.runStats = { stuns: 0, hitsTaken: 0, totalRunsStarted: 0 };
    this.state = 'title';
    this.mode = 'story';
    this.selectedMode = 'story';
    this.time = 0;
    this.lastFrame = performance.now();
    this.seed = 7;
    this.rng = makeSeededRandom(this.seed);
    this.resetRunState();
    this.titleButtons = [];
    this.pauseButtons = [];
    this.endButtons = [];
    this.shot = parseShotQuery(window.location.search);
    this.shotApplied = false;
    this.frozen = false; // ?shot=play|boss tableaus render frozen, exactly as staged
    this.noBossKnives = false;
    this.introTimer = 0;
    this.bossBannerTimer = 0;
    this.bossAnnouncedForZone = '';
    this.zoneIntroShownFor = '';
    this.flashMessage = '';
    this.flashMessageUntil = 0;
    this.debug = { collisionsChecked: 0, hazardsSpawned: 0, pickupsCollected: 0 };
    window.__game = this; // play-test hook: the test driver reads state here.
    this.applyShotHook();
  }

  resetRunState() {
    this.stats = statsFromUpgrades(this.save);
    this.turkey = new Turkey(this.stats);
    this.farmer = new Farmer();
    this.hazards = [];
    this.pickups = [];
    this.decoys = [];
    this.combo = new ComboMeter(this.stats.comboDecay);
    this.spawner = new Spawner(this.mode, this.seed);
    this.distance = 0;
    this.score = 0;
    this.corn = 0;
    this.zonesCleared = 0;
    this.runTime = 0;
    this.worldSpeed = 0;
    this.zone = ZONES.barnyard;
    this.lastZoneId = 'barnyard';
    this.bossActive = false;
    this.bossDoneZone = '';
    this.bossAnnouncedForZone = '';
    this.zoneIntroShownFor = '';
    this.endResult = null;
    this.mouseSteer = true;
    this.graceUntil = 0;
  }

  get stateName() {
    return this.state;
  }

  /** Start a run in the given mode (story / endless / trial). */
  startMode(modeId, options) {
    const opts = options || {};
    this.mode = MODES[modeId] ? modeId : 'story';
    this.selectedMode = this.mode;
    this.seed = opts.seed || Math.floor(Math.random() * 100000) + 1;
    this.resetRunState();
    this.runStats = { stuns: 0, hitsTaken: 0, totalRunsStarted: (this.save.totalRuns || 0) + 1 };
    this.tutorial.configureForSave(this.save);
    this.state = 'intro';
    this.introTimer = 2600;
    this.zoneIntroShownFor = 'barnyard';
    this.audio.ensureContext();
    this.audio.startMusic('barnyard');
    this.audio.playGobble();
    this.showFlashMessage('RUN! Bram is coming!');
  }

  startRun() {
    this.startMode(this.selectedMode);
  }

  /** Apply the ?shot= hook once, right after construction. */
  applyShotHook() {
    if (!this.shot || this.shotApplied) return;
    this.shotApplied = true;
    const { shot, seed } = this.shot;
    this.seed = seed;
    if (shot === 'title') {
      this.state = 'title';
      return;
    }
    if (shot === 'play') {
      const setup = playShotSetup();
      this.startMode('story', { seed });
      this.state = 'play';
      this.applyPlaySetup(setup, 'barnyard');
      this.frozen = true;
      return;
    }
    if (shot === 'boss') {
      const setup = bossShotSetup();
      this.startMode('story', { seed });
      this.state = 'play';
      this.applyPlaySetup(setup, 'kitchen');
      this.farmer.startBoss(performance.now(), 'kitchen');
      this.bossActive = true;
      this.bossBannerTimer = 0;
      this.noBossKnives = true; // deterministic screenshot: no random knives
      this.frozen = true; // tableau: the boss scene renders exactly as staged
      return;
    }
    if (shot === 'end') {
      const setup = endShotSetup();
      this.startMode('story', { seed });
      this.finishRun(true, setup);
    }
  }

  /** Fill a live run with the fixed content of a screenshot setup. */
  applyPlaySetup(setup, zoneId) {
    this.distance = setup.distance;
    this.score = setup.score;
    this.corn = setup.corn;
    this.turkey.lives = setup.lives;
    this.turkey.x = setup.turkeyX;
    this.turkey.y = setup.turkeyY;
    this.turkey.onGround = setup.turkeyY <= 0;
    this.farmer.x = setup.farmerX;
    this.farmer.state = setup.farmerState;
    this.zone = ZONES[zoneId];
    this.lastZoneId = zoneId;
    this.farmer.zoneId = zoneId;
    this.graceUntil = performance.now() + 4000;
    // A readable play scene: fences, corn arc, golden corn, feather.
    this.hazards = [
      makeFence(760, 600),
      makeHayBale(980, 600),
    ];
    this.pickups = [
      ...makeCornArc(700, 600, 5),
      makeGoldenCorn(880, 470, 600),
      makeFeather(1040, 420, 600),
      ...makeCornLine(1120, 600, 3),
    ];
    if (zoneId === 'kitchen') {
      // Boss scene: an oven and a falling knife well clear of the turkey.
      this.hazards.push(makeOven(1300, 600));
      const knife = makeFallingKnife(1150, 600);
      knife.y = 180;
      this.hazards.push(knife);
    }
  }

  showFlashMessage(text, milliseconds) {
    this.flashMessage = text;
    this.flashMessageUntil = performance.now() + (milliseconds || 2600);
  }

  /** End the run: record it, build the report, show the end screen. */
  finishRun(escaped, preset) {
    const now = performance.now();
    const result = preset || {
      escaped: !!escaped,
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      corn: this.corn,
      bestCombo: this.combo.bestCombo,
      zonesCleared: this.zonesCleared,
      time: this.runTime,
      mode: this.mode,
    };
    result.endLine = randomEndLine(escaped ? 'escaped' : 'caught');
    result.tip = randomTip();
    this.endResult = result;
    recordRun(this.save, result);
    // Achievements: check this run's milestones and celebrate new ones.
    const runSummary = {
      totalRunsStarted: this.runStats.totalRunsStarted,
      corn: result.corn,
      bestCombo: result.bestCombo,
      zonesCleared: result.zonesCleared,
      escaped: result.escaped,
      time: result.time,
      mode: result.mode,
      distance: result.distance,
      stuns: this.runStats.stuns,
      hitsTaken: this.runStats.hitsTaken,
    };
    const newlyUnlocked = checkRunAchievements(this.save, this.unlockedAchievements, runSummary);
    if (newlyUnlocked.length > 0) {
      result.newAchievements = newlyUnlocked.map((a) => a.name);
      storeSave(this.save);
    }
    this.save = loadSave();
    this.unlockedAchievements = loadAchievements(this.save);
    this.state = 'end';
    this.endButtons = [];
    if (escaped) this.audio.playFanfare();
    else this.audio.playSting();
  }

  /** Restart the current mode immediately (R key or button). */
  restartRun() {
    this.startMode(this.mode, { seed: Math.floor(Math.random() * 100000) + 1 });
  }

  quitToTitle() {
    this.state = 'title';
    this.audio.setZone('title');
    this.audio.startMusic('title');
  }

  // ---- Spawning -----------------------------------------------------------

  spawnSegmentItems(segment, difficulty) {
    for (const item of segment.items) {
      const x = item.x;
      const groundY = 600;
      switch (item.code) {
        case 'F': this.hazards.push(makeFence(x, groundY)); break;
        case 'H': this.hazards.push(makeHayBale(x, groundY)); break;
        case 'M': this.hazards.push(makeMud(x, groundY)); break;
        case 'T': this.hazards.push(makeTrap(x, groundY)); break;
        case 'O': this.hazards.push(makeOven(x, groundY)); break;
        case 'K': this.hazards.push(makeFallingKnife(x, groundY)); break;
        case 'S': this.hazards.push(makeSweepingKnife(x, groundY)); break;
        case 'c': this.pickups.push(...makeCornLine(x, groundY, 3)); break;
        case 'A': this.pickups.push(...makeCornArc(x, groundY, 5)); break;
        case 'G': this.pickups.push(makeGoldenCorn(x, groundY - 120, groundY)); break;
        case 'f': this.pickups.push(makeFeather(x, groundY - 150, groundY)); break;
        case 'p': this.pickups.push(makeChili(x, groundY - 60, groundY)); break;
        case 'h': this.pickups.push(makeHeart(x, groundY - 90, groundY)); break;
        case 'D': this.pickups.push(new Pickup('decoy', x, groundY - 60, groundY)); break;
        default: break;
      }
      this.debug.hazardsSpawned += 1;
    }
  }

  /** A falling knife aimed at the turkey, from the boss. */
  bossKnifeAttack() {
    const targetX = clamp(this.turkey.x + (Math.random() * 160 - 40), 200, 1100);
    const knife = makeFallingKnife(targetX, 600);
    this.hazards.push(knife);
    this.audio.playHurt();
  }

  // ---- Update -------------------------------------------------------------

  update(dt) {
    const now = performance.now();
    this.time += dt;
    this.particles.update(dt);
    this.weather.update(dt, this.zone);

    // Frozen ?shot= tableaus: render exactly as staged, no simulation.
    if (this.frozen) return;

    if (this.state === 'title') {
      this.updateTitle(dt, now);
      return;
    }
    if (this.state === 'intro') {
      this.introTimer -= dt * 1000;
      if (this.introTimer <= 0) this.state = 'play';
      this.updateTitleIdle(dt);
      return;
    }
    if (this.state === 'paused') {
      return;
    }
    if (this.state === 'end') {
      return;
    }
    if (this.state !== 'play') return;

    // --- Play ---
    this.runTime += dt;
    const difficulty = difficultyAt(this.distance, this.mode);
    const zone = this.mode === 'endless'
      ? ZONES[ZONE_ORDER[Math.floor(this.distance / 1100) % 3]]
      : zoneForDistance(this.distance);
    if (zone.id !== this.lastZoneId) {
      this.onZoneChange(zone);
    }
    this.zone = zone;
    this.audio.setZone(this.bossActive ? 'boss' : zone.id);

    // World speed: base + difficulty, boosted by dash/chili, cut by mud.
    let speed = zone.speedBase * difficulty.speedMultiplier * this.stats.speedBonus;
    if (this.turkey.isDashing) speed *= 1.55;
    if (this.turkey.isChili) speed *= 1.35;
    if (this.turkey.isMudSlowed) speed *= 0.8;
    this.worldSpeed = speed;
    this.distance += (speed * dt) / 10; // 10 px of scroll = 1 m
    this.score += speed * dt * 0.06;

    // Input.
    if (this.input.jumpPressed) this.turkey.tryJump(now, this.audio);
    if (this.input.dashPressed) this.turkey.tryDash(now, this.audio);
    if (this.input.decoyPressed) {
      const decoy = this.turkey.dropDecoy(now, this.audio);
      if (decoy) this.decoys.push(decoy);
    }

    this.turkey.update(dt, this.input, now, speed, this.mouseSteer);
    this.farmer.update(dt, now, this.turkey, zone, this.hazards.filter((h) => h.kind === 'haybale'), speed, this.distance);

    // Boss stretches: at the end of each zone Bram sprints.
    if (isBossStretch(this.distance) && !this.bossActive && this.mode !== 'endless' && this.bossDoneZone !== zone.id) {
      this.bossActive = true;
      this.bossBannerTimer = 2400;
      this.farmer.startBoss(now, zone.id);
      this.audio.playBossRoar();
      this.particles.addShake(8);
      this.showFlashMessage(BOSS_INTROS[zone.id], 3000);
    }
    if (this.bossBannerTimer > 0) this.bossBannerTimer -= dt * 1000;
    if (this.bossActive && this.farmer.bossTimer > 0 && !this.noBossKnives && Math.random() < dt * 0.7) {
      this.bossKnifeAttack();
    }
    if (this.bossActive && !this.farmer.bossMode) {
      this.bossActive = false;
      this.bossDoneZone = zone.id;
      this.zonesCleared = Math.max(this.zonesCleared, zone.index + 1);
      this.audio.playZoneClear();
      this.showFlashMessage('Zone cleared! +' + 500 + ' points');
      this.score += 500;
      this.particles.spawnSparkle(this.turkey.x, this.turkey.screenY, '#ffd166', 16);
    }

    // Spawning.
    this.spawner.setZone(zone.id);
    this.spawner.ensureAhead(0);
    const furthest = Math.max(1280, ...this.hazards.map((h) => h.x), ...this.pickups.map((p) => p.x));
    if (furthest < 1500) {
      const segment = this.spawner.nextSegment(difficulty);
      this.spawnSegmentItems(segment, difficulty);
    }

    // Decoys: Bram eats one and gets stunned.
    for (let i = this.decoys.length - 1; i >= 0; i--) {
      const decoy = this.decoys[i];
      decoy.life -= dt * 1000;
      decoy.x -= speed * dt;
      if (decoy.life <= 0 || decoy.x < -80) {
        this.decoys.splice(i, 1);
        continue;
      }
      if (Math.abs(this.farmer.x - decoy.x) < 46 && !this.farmer.isStunned) {
        this.farmer.stun(now, 2600);
        this.runStats.stuns += 1;
        this.particles.spawnCornBurst(decoy.x, decoy.y - 30);
        this.particles.addFloatingText(decoy.x, decoy.y - 60, 'STUNNED!', '#ffd23f', 22);
        this.audio.playDecoy();
        this.decoys.splice(i, 1);
      }
    }

    // Hazards: scroll, collide, clean up.
    const turkeyBox = this.turkey.hitbox;
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const hazard = this.hazards[i];
      hazard.update(dt, speed);
      if (hazard.isOffScreen) {
        this.hazards.splice(i, 1);
        continue;
      }
      this.debug.collisionsChecked += 1;
      if (hazard.kind === 'mud') {
        if (boxesOverlap(turkeyBox, hazard.hitbox) && this.turkey.onGround) {
          this.turkey.mudSlowUntil = now + 350;
          if (Math.random() < dt * 4) this.particles.spawnDust(this.turkey.x, 600, 1);
        }
        continue;
      }
      if (hazard.kind === 'trap' && hazard.state === 'armed') {
        if (boxesOverlap(turkeyBox, hazard.hitbox) && this.turkey.onGround) {
          hazard.spring(now);
          this.hurtTurkey(now, hazard);
        }
        continue;
      }
      if (!hazard.isDangerous) continue;
      if (boxesOverlap(turkeyBox, hazard.hitbox)) {
        // Jumping clean over a fence/hay bale/oven scores a style bonus.
        if (hazard.isSolid && !this.turkey.onGround && this.turkey.y > hazard.height * 0.55) {
          continue;
        }
        if (hazard.kind === 'oven' && this.turkey.y > 120) continue;
        this.hurtTurkey(now, hazard);
        if (hazard.kind === 'knife' || hazard.kind === 'knifeSweep') {
          hazard.hitDone = true;
          hazard.state = 'cooling';
        }
      }
    }

    // Pickups: scroll, magnet, collect.
    const magnetRadius = this.stats.magnetRadius;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      pickup.update(dt, speed, { x: this.turkey.x, y: this.turkey.screenY + 20 }, magnetRadius);
      if (pickup.isOffScreen) {
        this.pickups.splice(i, 1);
        continue;
      }
      if (boxesOverlap(turkeyBox, pickup.hitbox)) {
        this.collectPickup(pickup, now);
        this.pickups.splice(i, 1);
      }
    }

    // Ambient particles per zone.
    if (this.zone.ember && Math.random() < dt * 14) {
      this.particles.spawnEmber(200 + Math.random() * 900, 600, 1);
    }
    if (this.zone.leaves && Math.random() < dt * 6) {
      this.particles.spawnLeaf(1200, 60 + Math.random() * 200, 1);
    }
    if (this.zone.dust && this.turkey.onGround && Math.random() < dt * 8) {
      this.particles.spawnDust(this.turkey.x - 20, 600, 1);
    }
    if (this.zone.rain && Math.random() < dt * 10) {
      this.particles.spawnRainSplash(100 + Math.random() * 1100, 600);
    }
    this.combo.update(now);

    // Tutorial hints for new players (first 3 runs only).
    this.tutorial.checkDistanceTriggers(this.distance, now);
    this.tutorial.checkProximityTriggers(this, now);

    // Caught by Bram?
    if (now > this.graceUntil && this.farmer.catches(this.turkey)) {
      this.particles.spawnFeather(this.turkey.x, this.turkey.screenY + 20, 14);
      this.particles.addShake(14);
      this.finishRun(false);
      return;
    }

    // Escaped? (Story / Time Trial: cross the forest's end.)
    if (this.mode !== 'endless' && this.distance >= storyTotalDistance()) {
      this.zonesCleared = 3;
      this.finishRun(true);
      return;
    }

    // Pause / restart.
    if (this.input.restartPressed) this.restartRun();
  }

  hurtTurkey(now, hazard) {
    if (this.turkey.isInvulnerable || this.turkey.isDashing) return;
    const result = this.turkey.takeHit(now, this.audio);
    if (!result) return;
    this.runStats.hitsTaken += 1;
    this.particles.spawnFeather(this.turkey.x, this.turkey.screenY + 20, 10);
    this.particles.addShake(10);
    this.particles.addFlash('#ff3b30', 0.35);
    this.particles.addFloatingText(this.turkey.x, this.turkey.screenY - 20, '-1 ❤', '#ff3b5c', 24);
    this.combo.reset();
    if (result === 'dead') {
      this.finishRun(false);
    }
  }

  collectPickup(pickup, now) {
    this.debug.pickupsCollected += 1;
    if (pickup.kind === 'decoy') {
      this.turkey.decoys = Math.min(this.turkey.decoyCapacity, this.turkey.decoys + 1);
      this.particles.addFloatingText(pickup.x, pickup.y - 20, '+1 DECOY', '#ffd23f', 18);
      this.audio.playPickup(0);
      return;
    }
    this.combo.add(now, 1);
    const value = pickup.scoreValue(this.combo.multiplier);
    this.score += value;
    if (pickup.kind === 'corn') {
      this.corn += 1;
      this.audio.playPickup(this.combo.combo);
      this.particles.spawnCornBurst(pickup.x, pickup.y);
    } else if (pickup.kind === 'golden') {
      this.corn += 5;
      this.turkey.applyPowerUp('golden', now, this.audio);
      this.particles.spawnSparkle(pickup.x, pickup.y, '#ffd23f', 12);
      this.particles.addFloatingText(pickup.x, pickup.y - 24, 'SHIELD + DASH!', '#7ee0ff', 20);
    } else if (pickup.kind === 'feather') {
      this.combo.add(now, 1);
      this.audio.playFeather();
      this.particles.spawnFeather(pickup.x, pickup.y, 3);
    } else if (pickup.kind === 'chili') {
      this.turkey.applyPowerUp('chili', now, this.audio);
      this.particles.addFloatingText(pickup.x, pickup.y - 24, 'CHILI RUSH!', '#ff6b35', 20);
    } else if (pickup.kind === 'heart') {
      this.turkey.applyPowerUp('heart', now, this.audio);
      this.particles.addFloatingText(pickup.x, pickup.y - 24, '+1 ❤', '#ff3b5c', 20);
    }
    if (this.combo.combo > 0 && this.combo.combo % 5 === 0) {
      this.particles.addFloatingText(this.turkey.x, this.turkey.screenY - 30, 'COMBO ×' + this.combo.multiplier + '!', '#ff9f1c', 22);
    }
  }

  onZoneChange(zone) {
    this.lastZoneId = zone.id;
    this.zonesCleared = Math.max(this.zonesCleared, zone.index);
    this.state = 'intro';
    this.introTimer = 2600;
    this.zoneIntroShownFor = zone.id;
    this.bossActive = false;
    this.farmer.endBoss();
    this.farmer.zoneId = zone.id;
    this.audio.setZone(zone.id);
    this.audio.playZoneClear();
    this.showFlashMessage(zone.name + '!', 2600);
  }

  updateTitle(dt, now) {
    // Title screen: gentle idle animation, click handling.
    if (this.input.mutePressed) this.toggleMute();
    if (this.input.confirmPressed && this.input.pointerClicked) {
      this.handleClick(this.input.pointerX, this.input.pointerY);
    } else if (this.input.wasPressed('Enter')) {
      this.startRun();
    }
    // Keyboard mode select: 1/2/3.
    if (this.input.wasPressed('Digit1')) this.selectedMode = 'story';
    if (this.input.wasPressed('Digit2')) this.selectedMode = 'endless';
    if (this.input.wasPressed('Digit3')) this.selectedMode = 'trial';
    if (this.input.wasPressed('Space')) this.startRun();
  }

  updateTitleIdle(dt) {
    // The turkey idles on the title backdrop; nothing to simulate.
  }

  toggleMute() {
    const muted = this.audio.toggleMute();
    this.save.muted = muted;
    storeSave(this.save);
    return muted;
  }

  handleClick(px, py) {
    if (this.state === 'title') {
      for (const button of this.titleButtons) {
        if (!pointInButton(button, px, py)) continue;
        this.audio.ensureContext();
        this.audio.playClick();
        if (button.action && button.action.startsWith('mode:')) {
          this.selectedMode = button.modeId;
          this.startRun();
          return;
        }
        if (button.action && button.action.startsWith('buy:')) {
          const bought = buyUpgrade(this.save, button.upgradeId);
          if (bought) {
            this.save = loadSave();
            const trophy = unlockAchievement(this.save, this.unlockedAchievements, 'shopper');
            if (trophy) this.showFlashMessage('Achievement unlocked: ' + trophy.name + '!');
            else this.showFlashMessage('Upgrade bought!');
            storeSave(this.save);
            this.audio.playGoldenCorn();
          } else {
            this.showFlashMessage('Not enough corn — or already maxed!');
          }
          return;
        }
      }
      return;
    }
    if (this.state === 'paused') {
      for (const button of this.pauseButtons) {
        if (!pointInButton(button, px, py)) continue;
        this.audio.playClick();
        if (button.action === 'resume') this.state = 'play';
        if (button.action === 'restart') this.restartRun();
        if (button.action === 'quit') this.quitToTitle();
        return;
      }
      return;
    }
    if (this.state === 'end') {
      for (const button of this.endButtons) {
        if (!pointInButton(button, px, py)) continue;
        this.audio.playClick();
        if (button.action === 'restart') this.restartRun();
        if (button.action === 'quit') this.quitToTitle();
        return;
      }
    }
  }

  // ---- Render -------------------------------------------------------------

  render() {
    if (!ctx) return;
    const now = performance.now();
    ctx.save();
    ctx.translate(this.particles.shakeX, this.particles.shakeY);
    const hover = { x: this.input.pointerX, y: this.input.pointerY };

    if (this.state === 'title') {
      this.titleButtons = drawTitleScreen(ctx, this.save, this.selectedMode, hover, this.time);
      if (this.flashMessage && now < this.flashMessageUntil) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Trebuchet MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.flashMessage, 640, 640);
        ctx.textAlign = 'left';
      }
      ctx.restore();
      this.drawFlashOverlay();
      return;
    }

    // World (intro / play / paused / end backdrop).
    drawBackground(ctx, this.zone, this.distance * 10, this.time);
    drawWeather(ctx, this.weather, this.zone);
    for (const hazard of this.hazards) drawHazard(ctx, hazard, this.time);
    for (const pickup of this.pickups) drawPickup(ctx, pickup, this.time);
    for (const decoy of this.decoys) drawDecoy(ctx, decoy, this.time);
    drawFarmer(ctx, this.farmer, this.zone, this.time);
    drawTurkey(ctx, this.turkey, this.time);
    drawParticles(ctx, this.particles);

    if (this.state === 'intro') {
      const intro = ZONE_INTROS[this.zoneIntroShownFor] || ZONE_INTROS.barnyard;
      const progress = 1 - this.introTimer / 2600;
      drawZoneIntro(ctx, this.zone, intro, progress);
    }

    if (this.state === 'play' || this.state === 'paused') {
      const zoneStart = this.mode === 'endless' ? 0
        : this.zone.index === 0 ? 0
        : this.zone.index === 1 ? ZONE_LENGTHS.barnyard
        : ZONE_LENGTHS.barnyard + ZONE_LENGTHS.kitchen;
      const intoZone = this.mode === 'endless' ? this.distance % 1100 : this.distance - zoneStart;
      const zoneLength = this.mode === 'endless' ? 1100 : ZONE_LENGTHS[this.zone.id];
      const bossInMetres = Math.max(0, Math.round((zoneLength - 180) - intoZone));
      drawHUD(ctx, {
        score: this.score,
        distance: this.distance,
        lives: this.turkey.lives,
        maxLives: this.turkey.maxLives,
        stamina: this.turkey.stamina,
        staminaMax: this.turkey.staminaMax,
        zoneName: this.zone.name,
        zoneShortName: 'Zone ' + (this.zone.index + 1) + ' — ' + this.zone.shortName,
        zoneProgress: this.mode === 'endless' ? (this.distance % 1100) / 1100 : zoneProgress(this.distance),
        modeLabel: MODES[this.mode].name,
        bossLabel: this.bossActive ? 'BOSS: ' + this.zone.boss.name : 'Boss in ' + bossInMetres + ' m',
        corn: this.corn,
        combo: this.combo.combo,
        comboMultiplier: this.combo.multiplier,
        comboFraction: this.combo.windowFraction(now),
        farmerGap: this.farmer.gapTo(this.turkey),
        decoys: this.turkey.decoys,
        time: this.mode === 'trial' ? this.runTime : null,
      }, this.time);
      if (this.bossBannerTimer > 0) {
        drawBossBanner(ctx, this.zone.boss.title + ' — ' + this.zone.boss.name, this.zone.boss.taunt, 1 - this.bossBannerTimer / 2400);
      }
      if (this.flashMessage && now < this.flashMessageUntil) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Trebuchet MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 5;
        ctx.strokeText(this.flashMessage, 640, 180);
        ctx.fillText(this.flashMessage, 640, 180);
        ctx.textAlign = 'left';
      }
      // Contextual tutorial hint for new players.
      const hint = this.tutorial.currentHint(now);
      if (hint && this.state === 'play') {
        ctx.fillStyle = 'rgba(20,12,4,0.72)';
        ctx.font = 'bold 17px Trebuchet MS, sans-serif';
        ctx.textAlign = 'center';
        const hw = ctx.measureText(hint.text).width + 32;
        ctx.beginPath();
        ctx.roundRect(640 - hw / 2, 196, hw, 34, 10);
        ctx.fill();
        ctx.fillStyle = '#ffe9b0';
        ctx.fillText(hint.text, 640, 219);
        ctx.textAlign = 'left';
      }
    }

    if (this.state === 'paused') {
      this.pauseButtons = drawPauseMenu(ctx, hover);
    }

    if (this.state === 'end' && this.endResult) {
      this.endButtons = drawEndScreen(ctx, this.endResult, this.save, hover);
    }

    ctx.restore();
    this.drawFlashOverlay();
  }

  drawFlashOverlay() {
    if (this.particles.flash > 0.02) {
      ctx.globalAlpha = this.particles.flash * 0.5;
      ctx.fillStyle = this.particles.flashColor;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.globalAlpha = 1;
    }
  }

  // ---- Main loop ----------------------------------------------------------

  frame(now) {
    const dt = clamp((now - this.lastFrame) / 1000, 0, 0.05);
    this.lastFrame = now;
    // Global keys that work in every state.
    if (this.input.mutePressed && this.state !== 'title' && this.state !== 'play') this.toggleMute();
    if (this.state === 'play' && this.input.mutePressed) this.toggleMute();
    if (this.state === 'end' && this.input.restartPressed) this.restartRun();
    if (this.state === 'end' && this.input.confirmPressed && this.input.pointerClicked) {
      this.handleClick(this.input.pointerX, this.input.pointerY);
    }
    if (this.state === 'paused') {
      if (this.input.pausePressed || this.input.wasPressed('Escape')) {
        this.state = 'play';
      } else if (this.input.restartPressed) {
        this.restartRun();
      } else if (this.input.confirmPressed && this.input.pointerClicked) {
        this.handleClick(this.input.pointerX, this.input.pointerY);
      }
    } else if (this.state === 'play' && this.input.pausePressed) {
      this.state = 'paused';
      this.audio.playClick();
    }
    if (this.state === 'play' && this.input.pointerClicked) {
      // Clicking during play = jump (mouse control), unless it hit a button.
      this.turkey.tryJump(now, this.audio);
    }
    // A frozen ?shot= tableau wakes up on any jump/restart key.
    if (this.frozen && (this.input.restartPressed || this.input.jumpPressed || this.input.confirmPressed)) {
      this.frozen = false;
      this.noBossKnives = false;
    }
    this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  start() {
    this.audio.startMusic('title');
    requestAnimationFrame((t) => {
      this.lastFrame = t;
      this.frame(t);
    });
  }
}

const game = new TurkeyTrotGame();
game.start();
