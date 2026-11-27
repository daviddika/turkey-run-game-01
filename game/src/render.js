// Turkey Trot — render.js
// All canvas drawing: parallax zone backgrounds (dawn barnyard, warm
// kitchen, dusk-rain forest), the turkey, Farmer Bram in his three outfits,
// every hazard and pickup, particles, weather and the HUD. Everything is
// drawn with canvas paths — original art, no images, no external assets.
// The game logic never draws; it hands this module the world state.

import { clamp, lerp } from './utils.js';
import { formatDistance, formatScore, formatTime } from './utils.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Draw the zone background: sky gradient, sun/moon, parallax hills, barns. */
export function drawBackground(ctx, zone, distance, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, zone.skyTop);
  sky.addColorStop(0.55, zone.skyMid);
  sky.addColorStop(1, zone.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Sun / moon.
  const sunX = 1060;
  const sunY = zone.id === 'forest' ? 120 : 96;
  ctx.fillStyle = zone.sunColor;
  ctx.globalAlpha = 0.9;
  ellipse(ctx, sunX, sunY, 46, 46);
  ctx.globalAlpha = 0.25;
  ellipse(ctx, sunX, sunY, 70, 70);
  ctx.globalAlpha = 1;

  // Clouds drift slowly.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 340 - distance * 0.12 + time * 6) % 1500 + 1500) % 1500 - 110;
    const cy = 70 + (i % 3) * 46;
    ellipse(ctx, cx, cy, 52, 18);
    ellipse(ctx, cx + 34, cy + 6, 40, 15);
    ellipse(ctx, cx - 36, cy + 7, 34, 13);
  }

  // Far hills (slow parallax).
  drawHills(ctx, distance * 0.18, zone, 0.5);
  // Near trees / barn silhouettes (faster parallax).
  drawHills(ctx, distance * 0.42, zone, 1);
  drawScenery(ctx, zone, distance, time);

  // Ground.
  const ground = ctx.createLinearGradient(0, zone.groundY, 0, VIEW_H);
  ground.addColorStop(0, zone.groundTop);
  ground.addColorStop(1, zone.groundBottom);
  ctx.fillStyle = ground;
  ctx.fillRect(0, zone.groundY, VIEW_W, VIEW_H - zone.groundY);
  // Grass / floor strip.
  ctx.fillStyle = zone.grassColor;
  ctx.fillRect(0, zone.groundY, VIEW_W, 10);
  // Ground texture dashes scrolling with the world.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  const dashOffset = distance % 90;
  for (let x = -dashOffset; x < VIEW_W; x += 90) {
    ctx.fillRect(x, zone.groundY + 34, 34, 5);
    ctx.fillRect(x + 46, zone.groundY + 64, 26, 4);
  }
  if (zone.id === 'kitchen') {
    // Kitchen tile floor.
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2;
    for (let x = -((distance * 1) % 64); x < VIEW_W; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, zone.groundY + 12);
      ctx.lineTo(x, VIEW_H);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, zone.groundY + 44);
    ctx.lineTo(VIEW_W, zone.groundY + 44);
    ctx.stroke();
  }
  if (zone.id === 'forest') {
    // Puddles reflecting the dusk sky.
    ctx.fillStyle = 'rgba(120,150,200,0.35)';
    for (let i = 0; i < 4; i++) {
      const px = ((i * 380 - distance * 0.9) % 1500 + 1500) % 1500 - 100;
      ellipse(ctx, px, zone.groundY + 52, 70, 8);
    }
  }
}

function drawHills(ctx, offset, zone, alpha) {
  ctx.fillStyle = zone.id === 'kitchen' ? 'rgba(90,40,26,0.55)' : 'rgba(60,80,40,0.5)';
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, zone.groundY);
  for (let x = 0; x <= VIEW_W; x += 80) {
    const hill = Math.sin((x + offset) * 0.008) * 46 + Math.sin((x + offset) * 0.021) * 18;
    ctx.lineTo(x, zone.groundY - 60 - hill);
  }
  ctx.lineTo(VIEW_W, zone.groundY);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawScenery(ctx, zone, distance, time) {
  if (zone.id === 'barnyard') {
    // Red barn + windmill, scrolling slowly.
    const bx = ((900 - distance * 0.42) % 2200 + 2200) % 2200 - 400;
    drawBarn(ctx, bx, zone.groundY);
    const wx = ((1700 - distance * 0.42) % 2200 + 2200) % 2200 - 400;
    drawWindmill(ctx, wx, zone.groundY, time);
    // Fence posts along the back.
    ctx.fillStyle = '#7a4a22';
    for (let x = -((distance * 0.42) % 96); x < VIEW_W; x += 96) {
      ctx.fillRect(x, zone.groundY - 44, 8, 44);
    }
    ctx.fillRect(0, zone.groundY - 34, VIEW_W, 5);
  } else if (zone.id === 'kitchen') {
    // Window with warm light + hanging pots, fixed to the kitchen wall.
    ctx.fillStyle = '#3a1c10';
    roundRect(ctx, 90, 120, 190, 150, 10);
    ctx.fill();
    ctx.fillStyle = '#ffca6a';
    ctx.globalAlpha = 0.85;
    ctx.fillRect(106, 136, 74, 118);
    ctx.fillRect(192, 136, 74, 118);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3a1c10';
    ctx.fillRect(176, 136, 8, 118);
    ctx.fillRect(106, 188, 160, 8);
    // Hanging copper pots.
    ctx.fillStyle = '#b87333';
    for (let i = 0; i < 4; i++) {
      const px = 980 + i * 70;
      ellipse(ctx, px, 150 + (i % 2) * 14, 26, 20);
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(px - 2, 108, 4, 26);
      ctx.fillStyle = '#b87333';
    }
    // Big oven glow at the back.
    const glow = ctx.createRadialGradient(640, 420, 10, 640, 420, 260);
    glow.addColorStop(0, 'rgba(255,120,40,0.30)');
    glow.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(380, 160, 520, 440);
  } else {
    // Forest: pine silhouettes, two layers.
    for (let i = 0; i < 9; i++) {
      const tx = ((i * 260 - distance * 0.42) % 1500 + 1500) % 1500 - 120;
      drawPine(ctx, tx, zone.groundY, 90 + (i % 3) * 26, '#2c3a24');
    }
    for (let i = 0; i < 6; i++) {
      const tx = ((i * 340 - distance * 0.7) % 1600 + 1600) % 1600 - 140;
      drawPine(ctx, tx, zone.groundY, 130 + (i % 2) * 30, '#1f2a1a');
    }
    // Fireflies in the dusk.
    ctx.fillStyle = 'rgba(255,240,150,0.8)';
    for (let i = 0; i < 12; i++) {
      const fx = (i * 137 + Math.sin(time * 0.7 + i) * 30 + 1280) % 1280;
      const fy = 260 + ((i * 53) % 260) + Math.cos(time + i * 1.3) * 14;
      ellipse(ctx, fx, fy, 3, 3);
    }
  }
}

function drawBarn(ctx, x, groundY) {
  ctx.fillStyle = '#a93226';
  ctx.fillRect(x, groundY - 150, 190, 150);
  ctx.beginPath();
  ctx.moveTo(x - 12, groundY - 148);
  ctx.lineTo(x + 95, groundY - 220);
  ctx.lineTo(x + 202, groundY - 148);
  ctx.closePath();
  ctx.fillStyle = '#7a241a';
  ctx.fill();
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(x + 66, groundY - 84, 58, 84);
  ctx.strokeStyle = '#f5e6c8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 66, groundY - 84);
  ctx.lineTo(x + 124, groundY);
  ctx.moveTo(x + 124, groundY - 84);
  ctx.lineTo(x + 66, groundY);
  ctx.stroke();
}

function drawWindmill(ctx, x, groundY, time) {
  ctx.fillStyle = '#8a6a3b';
  ctx.beginPath();
  ctx.moveTo(x - 16, groundY);
  ctx.lineTo(x - 8, groundY - 170);
  ctx.lineTo(x + 8, groundY - 170);
  ctx.lineTo(x + 16, groundY);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.translate(x, groundY - 178);
  ctx.rotate(time * 0.5);
  ctx.fillStyle = '#e8dcc0';
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, -64);
    ctx.lineTo(26, -64);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawPine(ctx, x, groundY, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 5, groundY - 18, 10, 18);
  for (let i = 0; i < 3; i++) {
    const w = 66 - i * 18;
    const y = groundY - 20 - i * (height / 3.4);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x, y - height / 3);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
    ctx.fill();
  }
}

/** Draw the turkey with squash-and-stretch, flapping wings and tail fan. */
export function drawTurkey(ctx, turkey, time) {
  const now = performance.now();
  const sq = turkey.squashStretch();
  const x = turkey.x;
  const baseY = turkey.groundY - turkey.y;
  const blink = turkey.isInvulnerable && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(x, baseY);
  if (blink) ctx.globalAlpha = 0.35;
  ctx.scale(sq.scaleX * turkey.facing, sq.scaleY);
  // Soft warm glow so the turkey reads in dark zones (kitchen, forest).
  ctx.fillStyle = 'rgba(255,220,150,0.16)';
  ellipse(ctx, 0, -30, 52, 44);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ellipse(ctx, 0, 2, 34, 7);
  // Tail fan.
  const fan = Math.sin(turkey.runCycle * 0.9) * 0.08;
  ctx.fillStyle = '#7a4a21';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(-26, -34);
    ctx.rotate(-0.9 + i * 0.42 + fan);
    ellipse(ctx, 0, -20, 9, 24);
    ctx.restore();
  }
  ctx.fillStyle = '#a9713a';
  for (let i = -1; i <= 1; i++) {
    ctx.save();
    ctx.translate(-24, -34);
    ctx.rotate(-0.7 + i * 0.5 + fan);
    ellipse(ctx, 0, -18, 7, 20);
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = '#8b5a2b';
  ellipse(ctx, 0, -30, 30, 26);
  ctx.fillStyle = '#a9713a';
  ellipse(ctx, 2, -26, 24, 20);
  // Wing (flaps when running or flying).
  const flap = turkey.onGround ? Math.sin(turkey.runCycle) * 0.5 : -0.9 + Math.sin(time * 18) * 0.25;
  ctx.save();
  ctx.translate(-4, -32);
  ctx.rotate(flap);
  ctx.fillStyle = '#6b4423';
  ellipse(ctx, -6, 0, 20, 11);
  ctx.restore();
  // Legs.
  const legSwing = turkey.onGround ? Math.sin(turkey.runCycle) * 10 : 6;
  ctx.strokeStyle = '#e8a317';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -8);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  // Head + beak + wattle + snood.
  ctx.fillStyle = '#8b5a2b';
  ellipse(ctx, 26, -58, 15, 14);
  ctx.fillStyle = '#e8a317';
  ctx.beginPath();
  ctx.moveTo(38, -60);
  ctx.lineTo(52, -55);
  ctx.lineTo(38, -51);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d94f2b';
  ellipse(ctx, 34, -46, 5, 9);
  ctx.fillStyle = '#c0392b';
  ellipse(ctx, 30, -66, 3, 8);
  // Eye.
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 30, -62, 5, 5);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 32, -62, 2.5, 2.5);
  // Shield ring.
  if (turkey.hasShield) {
    ctx.strokeStyle = 'rgba(120,200,255,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -32, 48 + Math.sin(time * 5) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Chili flames.
  if (turkey.isChili) {
    ctx.fillStyle = '#ff6b35';
    ellipse(ctx, -18, -20, 8, 14 + Math.sin(time * 20) * 4);
    ctx.fillStyle = '#ffd23f';
    ellipse(ctx, -18, -18, 4, 8);
  }
  ctx.restore();

  // Dash trail.
  if (turkey.isDashing) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 1; i <= 3; i++) {
      ellipse(ctx, x - i * 26 * turkey.facing, baseY - 30, 22 - i * 4, 14 - i * 2);
    }
  }
}

/** Draw Farmer Bram (farmer / chef / hunter outfits by zone). */
export function drawFarmer(ctx, farmer, zone, time) {
  const boss = zone.boss;
  const x = farmer.x;
  const groundY = farmer.groundY;
  const stunned = farmer.isStunned;
  const sprinting = farmer.state === 'sprint';
  ctx.save();
  ctx.translate(x, groundY);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ellipse(ctx, 0, 2, 40, 8);
  const bob = Math.abs(Math.sin(farmer.runCycle)) * (farmer.state === 'patrol' ? 2 : 5);
  ctx.translate(0, -bob);
  if (stunned) ctx.rotate(Math.sin(time * 30) * 0.06);
  // Legs (running).
  const legSwing = stunned ? 0 : Math.sin(farmer.runCycle) * 14;
  ctx.strokeStyle = '#2c2115';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-10, -46);
  ctx.lineTo(-10 + legSwing, 0);
  ctx.moveTo(10, -46);
  ctx.lineTo(10 - legSwing, 0);
  ctx.stroke();
  // Body: overalls or chef whites or hunter green.
  ctx.fillStyle = boss.color;
  roundRect(ctx, -26, -96, 52, 54, 12);
  ctx.fill();
  if (zone.id === 'barnyard') {
    ctx.fillStyle = '#2f4a7a';
    ctx.fillRect(-26, -96, 52, 20);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-6, -96, 12, 54);
  } else if (zone.id === 'kitchen') {
    ctx.fillStyle = '#d94f2b';
    ctx.fillRect(-26, -70, 52, 8);
  }
  // Arms: one reaching forward, one holding the weapon.
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(14, -84);
  ctx.lineTo(40 + Math.sin(farmer.runCycle) * 6, -70);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-14, -84);
  ctx.lineTo(-38, -60 + Math.sin(farmer.runCycle + 1) * 6);
  ctx.stroke();
  // Weapon.
  drawFarmerWeapon(ctx, zone, time, farmer.runCycle);
  // Head.
  ctx.fillStyle = '#f0c08a';
  ellipse(ctx, 0, -112, 17, 16);
  // Eyes: angry when chasing.
  ctx.fillStyle = '#1a1a1a';
  const eyeY = sprinting || farmer.state === 'chase' ? -116 : -114;
  ellipse(ctx, 8, eyeY, 2.5, 3);
  ellipse(ctx, -4, eyeY, 2.5, 3);
  if (farmer.state === 'chase' || sprinting) {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, -122);
    ctx.lineTo(13, -119);
    ctx.moveTo(-10, -122);
    ctx.lineTo(1, -119);
    ctx.stroke();
  }
  // Moustache.
  ctx.fillStyle = '#5d3a17';
  ellipse(ctx, 4, -102, 10, 3.5);
  // Hat by zone.
  if (zone.id === 'barnyard') {
    ctx.fillStyle = boss.hatColor;
    ctx.beginPath();
    ctx.moveTo(-22, -124);
    ctx.lineTo(22, -124);
    ctx.lineTo(14, -138);
    ctx.lineTo(-14, -138);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-24, -126, 48, 5);
  } else if (zone.id === 'kitchen') {
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, 0, -134, 18, 12);
    ctx.fillRect(-18, -130, 36, 10);
  } else {
    ctx.fillStyle = boss.hatColor;
    ctx.beginPath();
    ctx.moveTo(-20, -124);
    ctx.lineTo(20, -124);
    ctx.lineTo(12, -142);
    ctx.lineTo(-12, -142);
    ctx.closePath();
    ctx.fill();
  }
  // Stun stars.
  if (stunned) {
    ctx.fillStyle = '#ffd23f';
    for (let i = 0; i < 3; i++) {
      const a = time * 4 + (i * Math.PI * 2) / 3;
      ellipse(ctx, Math.cos(a) * 26, -142 + Math.sin(a) * 8, 4, 4);
    }
  }
  // "!" when spotted.
  if (farmer.spottedFlash > 0.4 && !stunned) {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 34px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -158);
  }
  ctx.restore();

  // Taunt speech bubble.
  if (farmer.taunt && performance.now() < farmer.tauntUntil) {
    drawSpeechBubble(ctx, x + 60, groundY - 190, farmer.taunt);
  }
  // Boss bar above Bram (clear of the taunt bubble below it).
  if (farmer.bossMode) {
    const w = 120;
    const frac = clamp(farmer.bossTimer / 12000, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, x - w / 2, groundY - 232, w, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#ff3b30';
    roundRect(ctx, x - w / 2 + 2, groundY - 230, (w - 4) * frac, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(boss.title, x, groundY - 238);
  }
}

function drawFarmerWeapon(ctx, zone, time, cycle) {
  ctx.save();
  ctx.translate(40, -66);
  ctx.rotate(Math.sin(cycle) * 0.15 - 0.4);
  if (zone.id === 'barnyard') {
    ctx.strokeStyle = '#8a6a3b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26, -34);
    ctx.stroke();
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(26, -34);
      ctx.lineTo(34 + i * 6, -52);
      ctx.stroke();
    }
  } else if (zone.id === 'kitchen') {
    ctx.fillStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(44, -10);
    ctx.lineTo(40, 2);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2408';
    ctx.fillRect(-12, -2, 14, 10);
    // Glint.
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(18, -8, 12, 3);
  } else {
    // Net.
    ctx.strokeStyle = '#8a6a3b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20, -26);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,240,240,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(30, -36, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, -36);
    ctx.lineTo(46, -36);
    ctx.moveTo(30, -52);
    ctx.lineTo(30, -20);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSpeechBubble(ctx, x, y, text) {
  ctx.font = 'bold 16px Trebuchet MS, sans-serif';
  const w = Math.min(320, ctx.measureText(text).width + 24);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  roundRect(ctx, x - w / 2, y - 18, w, 34, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 15);
  ctx.lineTo(x + 6, y + 15);
  ctx.lineTo(x - 2, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b1a08';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - 1);
  ctx.textBaseline = 'alphabetic';
}

/** Draw one hazard. */
export function drawHazard(ctx, hazard, time) {
  const groundY = hazard.groundY;
  if (hazard.kind === 'fence') {
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(hazard.x - 20, groundY - 74, 8, 74);
    ctx.fillRect(hazard.x + 12, groundY - 74, 8, 74);
    ctx.fillRect(hazard.x - 24, groundY - 66, 48, 7);
    ctx.fillRect(hazard.x - 24, groundY - 40, 48, 7);
    ctx.fillStyle = '#a9713a';
    ctx.fillRect(hazard.x - 24, groundY - 66, 48, 3);
  } else if (hazard.kind === 'haybale') {
    ctx.fillStyle = '#d9a441';
    ellipse(ctx, hazard.x, groundY - 34, 46, 36);
    ctx.fillStyle = '#b9832e';
    ellipse(ctx, hazard.x, groundY - 34, 36, 26);
    ctx.strokeStyle = '#8a6a1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hazard.x, groundY - 34, 28, 0.4, 2.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hazard.x, groundY - 34, 18, 2.8, 5.4);
    ctx.stroke();
  } else if (hazard.kind === 'mud') {
    ctx.fillStyle = '#5d3a17';
    ellipse(ctx, hazard.x, groundY - 2, hazard.width / 2, 9);
    ctx.fillStyle = '#7a5230';
    ellipse(ctx, hazard.x - 20, groundY - 3, 30, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ellipse(ctx, hazard.x + 24, groundY - 4, 18, 3);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MUD!', hazard.x, groundY - 18);
  } else if (hazard.kind === 'trap') {
    const sprung = hazard.state === 'sprung';
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(hazard.x - 34, groundY - 8, 68, 8);
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (sprung) {
      ctx.moveTo(hazard.x - 30, groundY - 8);
      ctx.lineTo(hazard.x, groundY - 34);
      ctx.lineTo(hazard.x + 30, groundY - 8);
    } else {
      ctx.moveTo(hazard.x - 30, groundY - 10);
      ctx.lineTo(hazard.x - 4, groundY - 14);
      ctx.moveTo(hazard.x + 30, groundY - 10);
      ctx.lineTo(hazard.x + 4, groundY - 14);
    }
    ctx.stroke();
    ctx.fillStyle = '#d94f2b';
    ellipse(ctx, hazard.x, groundY - 12, 6, 6);
  } else if (hazard.kind === 'oven') {
    // Oven body with glowing mouth and heat shimmer.
    ctx.fillStyle = '#2b2b2b';
    roundRect(ctx, hazard.x - 95, groundY - 150, 190, 150, 12);
    ctx.fill();
    const glowPulse = 0.55 + Math.sin(time * 6) * 0.25;
    const glow = ctx.createRadialGradient(hazard.x, groundY - 70, 8, hazard.x, groundY - 70, 120);
    glow.addColorStop(0, `rgba(255,140,40,${glowPulse})`);
    glow.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(hazard.x - 120, groundY - 190, 240, 220);
    ctx.fillStyle = '#ff7b24';
    roundRect(ctx, hazard.x - 62, groundY - 118, 124, 78, 10);
    ctx.fill();
    ctx.fillStyle = '#3a1c10';
    ctx.fillRect(hazard.x - 62, groundY - 118, 124, 12);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 15px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT!', hazard.x, groundY - 160);
    ctx.fillStyle = '#ff9f1c';
    for (let i = 0; i < 3; i++) {
      const fx = hazard.x - 40 + i * 40;
      const fh = 16 + Math.sin(time * 8 + i * 2) * 6;
      ellipse(ctx, fx, groundY - 128 - fh / 2, 7, fh);
    }
  } else if (hazard.kind === 'knife') {
    // Telegraph shadow on the ground while falling.
    if (hazard.state === 'falling') {
      ctx.fillStyle = 'rgba(255,0,0,0.35)';
      const progress = clamp((hazard.y + 80) / (groundY - hazard.height), 0, 1);
      const sw = lerp(60, 16, progress);
      ellipse(ctx, hazard.targetX, groundY - 2, sw, 6);
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 13px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', hazard.targetX, groundY - 90);
    }
    ctx.save();
    ctx.translate(hazard.x, hazard.y + hazard.height / 2);
    ctx.fillStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.moveTo(0, -hazard.height / 2);
    ctx.lineTo(10, hazard.height / 2 - 14);
    ctx.lineTo(0, hazard.height / 2);
    ctx.lineTo(-10, hazard.height / 2 - 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2408';
    ctx.fillRect(-6, hazard.height / 2 - 16, 12, 16);
    ctx.restore();
  } else if (hazard.kind === 'knifeSweep') {
    ctx.strokeStyle = 'rgba(255,60,40,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(hazard.x - 260, groundY - 96);
    ctx.lineTo(hazard.x + 260, groundY - 96);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.save();
    ctx.translate(hazard.sweepX, groundY - 78);
    ctx.fillStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(60, 0);
    ctx.lineTo(52, -12);
    ctx.lineTo(-52, -12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2408';
    ctx.fillRect(-8, -6, 16, 12);
    ctx.restore();
  }
}

/** Draw one pickup. */
export function drawPickup(ctx, pickup, time) {
  const bob = pickup.bobOffset;
  const y = pickup.y + bob;
  if (pickup.kind === 'corn') {
    ctx.save();
    ctx.translate(pickup.x, y);
    ctx.rotate(Math.sin(pickup.spin) * 0.2);
    ctx.fillStyle = '#ffd23f';
    ellipse(ctx, 0, 0, 10, 15);
    ctx.fillStyle = '#e8a317';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(i * 5 - 1, -11, 2, 22);
    }
    ctx.fillStyle = '#7fb069';
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(0, 22);
    ctx.lineTo(8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (pickup.kind === 'golden') {
    const pulse = 1 + Math.sin(time * 6) * 0.12;
    ctx.save();
    ctx.translate(pickup.x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(255,210,63,0.3)';
    ellipse(ctx, 0, 0, 26, 26);
    ctx.fillStyle = '#ffd23f';
    ellipse(ctx, 0, 0, 12, 18);
    ctx.fillStyle = '#fff3b0';
    ellipse(ctx, -3, -4, 5, 8);
    ctx.fillStyle = '#7fb069';
    ctx.beginPath();
    ctx.moveTo(-9, 14);
    ctx.lineTo(0, 26);
    ctx.lineTo(9, 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (pickup.kind === 'feather') {
    ctx.save();
    ctx.translate(pickup.x, y);
    ctx.rotate(Math.sin(pickup.spin) * 0.5);
    ctx.fillStyle = '#f5e6c8';
    ellipse(ctx, 0, 0, 7, 14);
    ctx.strokeStyle = '#b9832e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 14);
    ctx.stroke();
    ctx.restore();
  } else if (pickup.kind === 'chili') {
    ctx.save();
    ctx.translate(pickup.x, y);
    ctx.rotate(Math.sin(pickup.spin) * 0.25);
    ctx.fillStyle = '#d94f2b';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(14, 2, 4, 16);
    ctx.quadraticCurveTo(-12, 8, 0, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a7a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(6, -22, 12, -20);
    ctx.stroke();
    ctx.restore();
  } else if (pickup.kind === 'heart') {
    const pulse = 1 + Math.sin(time * 7) * 0.15;
    ctx.save();
    ctx.translate(pickup.x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff3b5c';
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(-16, -2, -12, -14, 0, -6);
    ctx.bezierCurveTo(12, -14, 16, -2, 0, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** Draw a dropped corn decoy. */
export function drawDecoy(ctx, decoy, time) {
  ctx.save();
  ctx.translate(decoy.x, decoy.y - 20 + Math.sin(time * 4) * 2);
  ctx.fillStyle = '#ffd23f';
  ellipse(ctx, 0, 0, 16, 10);
  ctx.fillStyle = '#e8a317';
  for (let i = -2; i <= 2; i++) ctx.fillRect(i * 6 - 1, -8, 2, 16);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DECOY!', 0, -22);
  ctx.restore();
}

/** Draw all particles and floating texts. */
export function drawParticles(ctx, particles) {
  for (const p of particles.particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (p.kind === 'feather' || p.kind === 'leaf') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ellipse(ctx, 0, 0, p.size, p.size * 0.5);
      ctx.restore();
    } else if (p.kind === 'ember' || p.kind === 'sparkle') {
      ellipse(ctx, p.x, p.y, p.size, p.size);
    } else {
      ellipse(ctx, p.x, p.y, p.size, p.size * 0.7);
    }
  }
  ctx.globalAlpha = 1;
  for (const t of particles.texts) {
    const alpha = clamp(t.life / t.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.font = `bold ${t.size}px Trebuchet MS, sans-serif`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

/** Draw rain / leaves / dust motes for the current zone. */
export function drawWeather(ctx, weather, zone) {
  if (zone.rain) {
    ctx.strokeStyle = 'rgba(180,200,230,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const d of weather.drops) {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 4, d.y + d.length);
    }
    ctx.stroke();
  }
  if (zone.leaves) {
    for (const l of weather.leaves) {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.sway);
      ctx.fillStyle = 'rgba(217,79,43,0.8)';
      ellipse(ctx, 0, 0, l.size, l.size * 0.5);
      ctx.restore();
    }
  }
  ctx.fillStyle = 'rgba(255,240,200,0.25)';
  for (const m of weather.motes) {
    ellipse(ctx, m.x, m.y, m.size, m.size);
  }
}

/** The in-run HUD: score, distance, hearts, stamina, zone, corn, combo. */
export function drawHUD(ctx, hud, time) {
  // Top bar.
  ctx.fillStyle = 'rgba(20,12,4,0.55)';
  roundRect(ctx, 12, 10, 1256, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 26px Trebuchet MS, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE ' + formatScore(hud.score), 28, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Trebuchet MS, sans-serif';
  ctx.fillText('DIST ' + formatDistance(hud.distance), 300, 40);
  // Hearts.
  for (let i = 0; i < hud.maxLives; i++) {
    const hx = 560 + i * 36;
    const hy = 34;
    ctx.fillStyle = i < hud.lives ? '#ff3b5c' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 10);
    ctx.bezierCurveTo(hx - 15, hy - 2, hx - 11, hy - 13, hx, hy - 5);
    ctx.bezierCurveTo(hx + 11, hy - 13, hx + 15, hy - 2, hx, hy + 10);
    ctx.closePath();
    ctx.fill();
  }
  // Stamina bar.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 700, 22, 180, 16, 8);
  ctx.fill();
  const staminaFrac = clamp(hud.stamina / hud.staminaMax, 0, 1);
  ctx.fillStyle = hud.stamina < 25 ? '#ff5d3b' : '#7ee081';
  roundRect(ctx, 702, 24, 176 * staminaFrac, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Trebuchet MS, sans-serif';
  ctx.fillText('DASH', 704, 52);
  // Corn count.
  ctx.fillStyle = '#ffd23f';
  ellipse(ctx, 896, 34, 10, 14);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Trebuchet MS, sans-serif';
  ctx.fillText('× ' + hud.corn, 912, 42);
  // Zone + boss progress (short name, so it never overlaps the corn count).
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 18px Trebuchet MS, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(hud.zoneShortName, 1252, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Trebuchet MS, sans-serif';
  ctx.fillText(hud.modeLabel + '  •  ' + hud.bossLabel, 1252, 54);
  ctx.textAlign = 'left';
  // Zone progress bar (bottom centre).
  const barW = 420;
  const barX = (VIEW_W - barW) / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, barX, VIEW_H - 26, barW, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  roundRect(ctx, barX + 2, VIEW_H - 24, (barW - 4) * clamp(hud.zoneProgress, 0, 1), 8, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(hud.zoneName + ' — ' + Math.round(hud.zoneProgress * 100) + '%', VIEW_W / 2, VIEW_H - 32);
  ctx.textAlign = 'left';
  // Combo meter.
  if (hud.combo > 1) {
    ctx.fillStyle = 'rgba(20,12,4,0.55)';
    roundRect(ctx, 12, 84, 190, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#ff9f1c';
    ctx.font = 'bold 20px Trebuchet MS, sans-serif';
    ctx.fillText('COMBO ×' + hud.comboMultiplier, 24, 106);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(ctx, 24, 114, 166, 6, 3);
    ctx.fill();
    ctx.fillStyle = '#ff9f1c';
    roundRect(ctx, 24, 114, 166 * clamp(hud.comboFraction, 0, 1), 6, 3);
    ctx.fill();
  }
  // Farmer proximity warning.
  if (hud.farmerGap < 260) {
    const pulse = 0.6 + Math.sin(time * 10) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 24px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!! BRAM IS RIGHT BEHIND YOU !!', VIEW_W / 2, 120);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  // Decoy count.
  if (hud.decoys > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Trebuchet MS, sans-serif';
    ctx.fillText('Decoys [C]: ' + hud.decoys, 28, 150);
  }
  // Time Trial clock.
  if (hud.time != null) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TIME ' + formatTime(hud.time), VIEW_W / 2, 150);
    ctx.textAlign = 'left';
  }
}
