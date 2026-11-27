// Turkey Trot — menus.js
// Every screen that is not the run itself: the title screen (with mode
// pick, upgrade shop and bests), the zone-intro card, the boss banner,
// the pause menu and the end screen (caught or escaped) with restart.
// Menus are drawn on the same canvas and read clicks through the same
// button rectangles the game loop tests — one source of truth for layout.

import { clamp } from './utils.js';
import { formatDistance, formatScore, formatTime } from './utils.js';
import { MODES, ZONES } from './zones.js';
import { UPGRADE_DEFS, upgradeCost } from './storage.js';
import { diaryLineForTime } from './dialogue.js';
import { fieldGuideLineForTime } from './fieldguide.js';
import { achievementProgress } from './achievements.js';

export function makeButton(x, y, w, h, label, action) {
  return { x, y, w, h, label, action };
}

export function pointInButton(button, px, py) {
  return px >= button.x && px <= button.x + button.w && py >= button.y && py <= button.y + button.h;
}

function drawButton(ctx, button, hovered, accent, fontSize) {
  ctx.fillStyle = hovered ? (accent || '#ff9f1c') : 'rgba(20,12,4,0.78)';
  ctx.strokeStyle = hovered ? '#ffffff' : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const r = 12;
  const { x, y, w, h } = button;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hovered ? '#1d1206' : '#ffffff';
  ctx.font = 'bold ' + (fontSize || 19) + 'px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(button.label, x + w / 2, y + h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function drawPanel(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = `rgba(24,14,5,${alpha == null ? 0.82 : alpha})`;
  ctx.strokeStyle = 'rgba(255,209,102,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const r = 16;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Title screen. Returns the buttons it drew, for click handling. */
export function drawTitleScreen(ctx, save, selectedMode, hover, time) {
  // Warm autumn backdrop.
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#ffcf7d');
  sky.addColorStop(0.6, '#ff9e4f');
  sky.addColorStop(1, '#c96f3b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.ellipse(1060, 110, 52, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  // Rolling hills + barn silhouette.
  ctx.fillStyle = '#7a9a4a';
  ctx.beginPath();
  ctx.moveTo(0, 560);
  ctx.quadraticCurveTo(320, 470, 640, 550);
  ctx.quadraticCurveTo(960, 620, 1280, 520);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a93226';
  ctx.fillRect(90, 430, 170, 130);
  ctx.beginPath();
  ctx.moveTo(78, 432);
  ctx.lineTo(175, 372);
  ctx.lineTo(272, 432);
  ctx.closePath();
  ctx.fillStyle = '#7a241a';
  ctx.fill();
  // Drifting leaves.
  ctx.fillStyle = 'rgba(217,79,43,0.85)';
  for (let i = 0; i < 14; i++) {
    const lx = (i * 173 + time * 22) % 1300 - 10;
    const ly = 120 + ((i * 97) % 380) + Math.sin(time * 1.5 + i) * 12;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(time + i);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Big turkey mascot (drawn with the same shapes as the in-game turkey).
  drawTitleTurkey(ctx, 1120, 540, time);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7a241a';
  ctx.font = 'bold 30px Trebuchet MS, sans-serif';
  ctx.fillText('A THANKSGIVING ESCAPE', 640, 92);
  ctx.fillStyle = '#fff8e6';
  ctx.font = 'bold 84px Trebuchet MS, sans-serif';
  ctx.strokeStyle = '#7a241a';
  ctx.lineWidth = 8;
  ctx.strokeText('TURKEY TROT', 640, 168);
  ctx.fillText('TURKEY TROT', 640, 168);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 28px Trebuchet MS, sans-serif';
  ctx.fillText('The Great Thanksgiving Escape', 640, 208);
  ctx.fillStyle = '#fff';
  ctx.font = '19px Trebuchet MS, sans-serif';
  ctx.fillText('Farmer Bram wants you for dinner. The oven is hot. The knife is sharp.', 640, 244);
  ctx.fillText('Run the barnyard, survive the kitchen, vanish into the forest. Gobble!', 640, 272);

  // Mode buttons.
  const buttons = [];
  const modeIds = ['story', 'endless', 'trial'];
  modeIds.forEach((modeId, i) => {
    const mode = MODES[modeId];
    const bx = 300 + i * 230;
    const button = makeButton(bx, 300, 210, 64, '▶ ' + mode.name, 'mode:' + modeId);
    button.modeId = modeId;
    button.selected = selectedMode === modeId;
    buttons.push(button);
    const hovered = hover && pointInButton(button, hover.x, hover.y);
    drawButton(ctx, button, hovered || button.selected, button.selected ? '#ffd166' : null);
    ctx.fillStyle = '#fff';
    ctx.font = '13px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mode.tagline, bx + 105, 392);
  });
  const selected = MODES[selectedMode];
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '17px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(selected.description, 640, 420);

  // Rotating field-guide line (alternates with Bram's diary every few seconds).
  ctx.fillStyle = '#fff8e6';
  ctx.font = 'italic 15px Trebuchet MS, sans-serif';
  const guideLine = Math.floor(time / 5) % 2 === 0
    ? fieldGuideLineForTime(time)
    : 'Bram’s diary: ' + diaryLineForTime(time);
  ctx.fillText(guideLine, 640, 444);

  // Bests line.
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  const trophies = achievementProgress(new Set(save.achievements || []));
  const bestLine = 'Best score ' + formatScore(save.bestScore)
    + '   •   Best distance ' + formatDistance(save.bestDistance)
    + '   •   Escapes ' + save.escapes
    + (save.bestEscapeTime ? '   •   Fastest escape ' + formatTime(save.bestEscapeTime) : '')
    + '   •   Corn bank ' + formatScore(save.totalCorn)
    + '   •   Trophies ' + trophies.unlocked + '/' + trophies.total;
  ctx.fillText(bestLine, 640, 468);

  // Upgrade shop (compact, on the title screen).
  drawPanel(ctx, 300, 478, 680, 150, 0.85);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 19px Trebuchet MS, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('UPGRADE SHOP — spend banked corn (click to buy)', 320, 506);
  UPGRADE_DEFS.forEach((def, i) => {
    const level = save.upgrades[def.id] || 0;
    const cost = upgradeCost(def, level);
    const ux = 320 + (i % 3) * 220;
    const uy = 516 + Math.floor(i / 3) * 52;
    const label = def.name + ' Lv' + level + '/' + def.max + (cost === null ? ' MAX' : ' ' + cost + 'c');
    const button = makeButton(ux, uy, 205, 40, label, 'buy:' + def.id);
    button.upgradeId = def.id;
    buttons.push(button);
    const hovered = hover && pointInButton(button, hover.x, hover.y);
    drawButton(ctx, button, hovered, null, 14);
  });

  // Controls footer.
  ctx.fillStyle = '#fff8e6';
  ctx.font = '16px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Move: ← → / A D  •  Jump: SPACE / W (twice = double jump)  •  Dash: SHIFT / X  •  Decoy: C  •  Pause: P  •  Mute: M  •  Restart: R', 640, 660);
  ctx.fillText('Mouse: hold to steer the turkey, click the buttons. Touch works the same way.', 640, 688);
  ctx.textAlign = 'left';
  return buttons;
}

function drawTitleTurkey(ctx, x, y, time) {
  const bob = Math.sin(time * 2.2) * 6;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 70, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a4a21';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(-52, -64);
    ctx.rotate(-0.9 + i * 0.42);
    ctx.beginPath();
    ctx.ellipse(0, -38, 17, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath();
  ctx.ellipse(0, -56, 58, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a9713a';
  ctx.beginPath();
  ctx.ellipse(4, -48, 46, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(-8, -60);
  ctx.rotate(Math.sin(time * 3) * 0.3 - 0.4);
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.ellipse(-12, 0, 38, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath();
  ctx.ellipse(52, -108, 28, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a317';
  ctx.beginPath();
  ctx.moveTo(74, -112);
  ctx.lineTo(102, -102);
  ctx.lineTo(74, -94);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d94f2b';
  ctx.beginPath();
  ctx.ellipse(64, -86, 9, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(58, -116, 9, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(61, -116, 4.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8a317';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-16, -12);
  ctx.lineTo(-16, 2);
  ctx.moveTo(16, -12);
  ctx.lineTo(16, 2);
  ctx.stroke();
  ctx.restore();
}

/** Zone-intro card shown for ~2.6 s when a zone starts. */
export function drawZoneIntro(ctx, zone, intro, progress) {
  const alpha = clamp(progress < 0.15 ? progress / 0.15 : progress > 0.8 ? (1 - progress) / 0.2 : 1, 0, 1);
  ctx.globalAlpha = alpha;
  drawPanel(ctx, 240, 200, 800, 240, 0.9);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 40px Trebuchet MS, sans-serif';
  ctx.fillText(intro.title, 640, 268);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Trebuchet MS, sans-serif';
  intro.lines.forEach((line, i) => {
    ctx.fillText(line, 640, 312 + i * 32);
  });
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'italic 16px Trebuchet MS, sans-serif';
  ctx.fillText(zone.flavor, 640, 412);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

/** Boss banner: big red flash text when a boss sprint starts. */
export function drawBossBanner(ctx, bossName, taunt, progress) {
  const alpha = clamp(progress < 0.2 ? progress / 0.2 : progress > 0.75 ? (1 - progress) / 0.25 : 1, 0, 1);
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff3b30';
  ctx.font = 'bold 52px Trebuchet MS, sans-serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 8;
  ctx.strokeText('⚠ ' + bossName + ' ⚠', 640, 200);
  ctx.fillText('⚠ ' + bossName + ' ⚠', 640, 200);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Trebuchet MS, sans-serif';
  ctx.fillText(taunt, 640, 244);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

/** Pause overlay. Returns its buttons. */
export function drawPauseMenu(ctx, hover) {
  ctx.fillStyle = 'rgba(10,6,2,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  drawPanel(ctx, 390, 180, 500, 330, 0.95);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 44px Trebuchet MS, sans-serif';
  ctx.fillText('PAUSED', 640, 250);
  ctx.fillStyle = '#ffffff';
  ctx.font = '19px Trebuchet MS, sans-serif';
  ctx.fillText('The turkey catches its breath. Bram waits…', 640, 292);
  ctx.fillText('P / Esc — resume    •    R — restart run    •    M — mute', 640, 326);
  const buttons = [
    makeButton(490, 360, 300, 56, '▶ Resume (P)', 'resume'),
    makeButton(490, 428, 300, 56, '↻ Restart run (R)', 'restart'),
    makeButton(490, 496, 300, 56, 'Quit to title', 'quit'),
  ];
  buttons.forEach((b) => {
    const hovered = hover && pointInButton(b, hover.x, hover.y);
    drawButton(ctx, b, hovered, null);
  });
  ctx.textAlign = 'left';
  return buttons;
}

/** End screen (caught or escaped). Returns its buttons. */
export function drawEndScreen(ctx, result, save, hover) {
  const escaped = result.escaped;
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  if (escaped) {
    sky.addColorStop(0, '#7ec850');
    sky.addColorStop(0.6, '#4a9a3a');
    sky.addColorStop(1, '#2c5a24');
  } else {
    sky.addColorStop(0, '#8a3a2a');
    sky.addColorStop(0.6, '#5b2418');
    sky.addColorStop(1, '#2b1008');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#fff8e6' : '#ffd166';
  ctx.font = 'bold 72px Trebuchet MS, sans-serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 8;
  const title = escaped ? 'ESCAPED!' : 'CAUGHT!';
  ctx.strokeText(title, 640, 150);
  ctx.fillText(title, 640, 150);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px Trebuchet MS, sans-serif';
  ctx.fillText(result.endLine, 640, 196);

  drawPanel(ctx, 330, 226, 620, 250, 0.88);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 24px Trebuchet MS, sans-serif';
  ctx.fillText('RUN REPORT', 640, 268);
  ctx.fillStyle = '#ffffff';
  ctx.font = '21px Trebuchet MS, sans-serif';
  const rows = [
    'Score: ' + formatScore(result.score) + (result.score >= save.bestScore && result.score > 0 ? '  ★ NEW BEST!' : '  (best ' + formatScore(save.bestScore) + ')'),
    'Distance: ' + formatDistance(result.distance) + (result.distance >= save.bestDistance && result.distance > 0 ? '  ★ NEW BEST!' : ''),
    'Corn collected: ' + result.corn + '   •   Best combo: ×' + result.bestCombo,
    'Zones cleared: ' + result.zonesCleared + ' / 3' + (result.mode === 'trial' ? '   •   Time: ' + formatTime(result.time) : ''),
  ];
  rows.forEach((row, i) => ctx.fillText(row, 640, 308 + i * 34));
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'italic 17px Trebuchet MS, sans-serif';
  if (result.newAchievements && result.newAchievements.length > 0) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 18px Trebuchet MS, sans-serif';
    ctx.fillText('TROPHY UNLOCKED: ' + result.newAchievements.join(', '), 640, 452);
  } else {
    ctx.fillText(result.tip || '', 640, 452);
  }
  const buttons = [
    makeButton(430, 500, 200, 60, '↻ Play again (R)', 'restart'),
    makeButton(650, 500, 200, 60, 'Title screen', 'quit'),
  ];
  buttons.forEach((b) => {
    const hovered = hover && pointInButton(b, hover.x, hover.y);
    drawButton(ctx, b, hovered, null);
  });
  ctx.fillStyle = '#fff8e6';
  ctx.font = '17px Trebuchet MS, sans-serif';
  ctx.fillText('Press R to run again, or click a button. Your corn is banked for upgrades.', 640, 600);
  ctx.textAlign = 'left';
  return buttons;
}
