#!/usr/bin/env node
/** Copy scripts/git-hooks into this clone. Does not change git config. */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let hooksDir;
try {
  hooksDir = execSync('git rev-parse --git-path hooks', {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  process.exit(0);
}

if (!hooksDir) process.exit(0);
if (!path.isAbsolute(hooksDir)) hooksDir = path.join(root, hooksDir);

fs.mkdirSync(hooksDir, { recursive: true });
const dest = path.join(hooksDir, 'pre-commit');
fs.copyFileSync(path.join(root, 'scripts/git-hooks/pre-commit'), dest);
fs.chmodSync(dest, 0o755);
