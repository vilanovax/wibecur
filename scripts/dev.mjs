#!/usr/bin/env node
/**
 * Dev server launcher: frees port 3003 (or DEV_PORT) then starts Next.js.
 * Prevents stacked `next dev` processes from exhausting RAM.
 */
import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const PORT = Number(process.env.DEV_PORT || process.env.PORT || 3003);
const useWebpack = process.argv.includes('--webpack');

const NODE_OPTIONS = [
  process.env.NODE_OPTIONS,
  '--max-http-header-size=16384',
  '--max-old-space-size=4096',
]
  .filter(Boolean)
  .join(' ');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPidsOnPort(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    if (!out) return [];
    return [...new Set(out.split('\n').map((line) => Number(line.trim())).filter(Boolean))];
  } catch {
    return [];
  }
}

async function freePort(port) {
  let pids = getPidsOnPort(port);
  if (pids.length === 0) {
    console.log(`[dev] port ${port} is free`);
    return;
  }

  console.log(`[dev] stopping ${pids.length} process(es) on port ${port}: ${pids.join(', ')}`);
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // already exited
    }
  }

  await sleep(800);

  pids = getPidsOnPort(port);
  if (pids.length === 0) return;

  console.log(`[dev] force-killing: ${pids.join(', ')}`);
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // ignore
    }
  }

  await sleep(200);
}

function resolveNextBin() {
  const bin = process.platform === 'win32' ? 'next.cmd' : 'next';
  const local = join(process.cwd(), 'node_modules', '.bin', bin);
  if (existsSync(local)) return local;
  return bin;
}

async function main() {
  await freePort(PORT);

  const args = ['dev', '-p', String(PORT)];
  if (useWebpack) args.push('--webpack');

  const mode = useWebpack ? 'webpack' : 'turbopack';
  console.log(`[dev] starting http://localhost:${PORT} (${mode})`);

  const child = spawn(resolveNextBin(), args, {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS },
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('[dev] failed:', err);
  process.exit(1);
});
