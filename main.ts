import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
mkdirSync(output, { recursive: true });
for (const directory of ['app', 'screenshots']) {
  cpSync(resolve(directory), join(output, directory), { recursive: true });
}
writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
}));
