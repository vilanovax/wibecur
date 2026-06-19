import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const standaloneDir = join(root, '.next/standalone');
const serverEntry = join(standaloneDir, 'server.js');

if (!existsSync(serverEntry)) {
  console.log('[prepare-standalone] standalone build not found, skipping');
  process.exit(0);
}

const copies = [
  { from: join(root, '.next/static'), to: join(standaloneDir, '.next/static') },
  { from: join(root, 'public'), to: join(standaloneDir, 'public') },
];

for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.warn(`[prepare-standalone] missing source: ${from}`);
    continue;
  }
  mkdirSync(join(to, '..'), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`[prepare-standalone] copied ${from} -> ${to}`);
}
