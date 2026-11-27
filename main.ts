// Turkey Trot — The Great Thanksgiving Escape: the hand-in program.
// Node 22, standard library only. It copies this repository's game/ and
// screenshots/ into the output directory (MAKEFUN_OUTPUT_DIR outside the
// grader, /output inside it) and writes /output/dossier.json with the
// vendored make.fun library, so the scorer can rebuild the same dossier
// byte for byte from the same files. It writes nothing else and reads
// nothing outside this repository.
//
// Run it locally to check the hand-in:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The same caps the gate scorer applies: at most 4 screenshots of 256 KiB,
// at most 993 files and 48 MiB under game/, paths under 1000 bytes, and a
// dossier text capped at 160 KiB. Keeping the build inside them here means
// the entry the grader sees is the entry the scorer accepts.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
