# turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

[![rank](https://make.fun/badge/turkey-run-game-01/daviddika/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

[![reward](https://make.fun/badge/turkey-run-game-01/daviddika/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Turkey Trot: The Great Thanksgiving Escape** is a complete original 2D turkey escape game built for [make.fun](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01). You are the turkey. Farmer Bram wants you for Thanksgiving dinner, the oven is preheating, and the carving knife is out. Run the barnyard at dawn, survive the farmhouse kitchen, and sprint through the rainy autumn forest — outrun all three Brams and you are free.

## How to play

- **Goal:** survive all three zones (Barnyard → Kitchen → Forest) and escape, or run as far as you can in Endless. Getting caught by Bram ends the run.
- **Move:** Arrow keys / A D to drift, or hold the mouse to steer. **Jump:** Space / W (press twice for a double jump). **Dash:** Shift / X (costs stamina). **Corn decoy:** C — stuns Bram. **Pause:** P. **Mute:** M. **Restart:** R.
- **Dodge:** fences, hay bales, mud puddles, snap traps, oven heat zones, falling carving knives and sweeping knives. Hay bales block Bram's line of sight — hide behind them.
- **Collect:** corn (score), golden corn (dash refill + shield), feathers (combo), chili peppers (speed burst), hearts. Corn is banked between runs and spent on permanent upgrades (speed, stamina, extra life, decoys, magnet, combo) on the title screen.
- **Modes:** Story (3 zones, 3 boss Brams), Endless (procedural, escalating), Time Trial (escape as fast as you can). Best score, distance and escape time are saved locally.
- **Sound:** a procedural chiptune loop and synthesised gobbles, jumps, pickups and stings — all generated live with WebAudio, no audio files.

## Screenshots

Deterministic states for reproducible screenshots (fixed seeds):

- `?shot=title&seed=7` — title screen
- `?shot=play&seed=7` — a run in play, HUD visible
- `?shot=boss&seed=11` — Chef Bram's boss sprint in the kitchen
- `?shot=end&seed=7` — the escaped end screen

## Files

- `game/index.html` — the game page (loads `src/main.js`)
- `game/styles.css` — page chrome
- `game/src/main.js` — bootstrap, state machine, game loop, collisions, scoring
- `game/src/render.js` — all canvas art: zones, turkey, farmer, hazards, HUD
- `game/src/menus.js` — title, zone intro, boss banner, pause and end screens
- `game/src/turkey.js` — player physics: jump, double jump, dash, stamina
- `game/src/farmer.js` — Bram's chase AI: patrol / suspicious / chase / sprint / stunned
- `game/src/hazards.js` — fences, hay bales, mud, traps, ovens, carving knives
- `game/src/collectibles.js` — corn, golden corn, feathers, chili, hearts, combo meter
- `game/src/levels.js` — hand-written segment templates + seeded spawner
- `game/src/zones.js` — the three zones, modes and difficulty ramp
- `game/src/particles.js` — feathers, dust, embers, leaves, rain, screen shake
- `game/src/audio.js` — synthesised WebAudio music and sound effects
- `game/src/music.js` — original chiptune melodies, bass lines and drum patterns
- `game/src/dialogue.js` — Bram's taunts, turkey thoughts, tips, end lines
- `game/src/fieldguide.js` — Bram's Field Guide: encyclopedia of hazards, pickups, farmers, zones
- `game/src/achievements.js` — 15 trophies: escapes, combos, distances, decoy stuns
- `game/src/tutorial.js` — contextual first-run hints that appear when each mechanic first shows up
- `game/src/input.js` — keyboard, mouse and touch input
- `game/src/storage.js` — bests, banked corn and upgrades in localStorage
- `game/src/utils.js` — seeded random, easing, geometry helpers
- `game/src/shots.js` — deterministic `?shot=` screenshot states
- `main.ts` — hand-in program: copies `game/` + `screenshots/` and writes `dossier.json`
- `serve.ts` — tiny static server for local play
- `vendor/makefun-game.ts` — the make.fun dossier library, copied from the kit unchanged
- `screenshots/` — real renders of this game in desktop Chrome

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network requests, no external assets — everything runs from these files.

Entered on [make.fun](https://make.fun/?ref=2vjd5xyx&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards
