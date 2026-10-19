#!/usr/bin/env node
/**
 * Audit consumer UI for design-token drift (gray utilities, arbitrary font sizes, purple accents).
 * Scope: app (non-admin/api) + components/{mobile,shared,category,profile,ui}
 *
 * Usage: node scripts/audit-consumer-design-tokens.mjs [--json] [--top=N]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const roots = [
  'app',
  'components/mobile',
  'components/shared',
  'components/category',
  'components/profile',
  'components/ui',
].map((p) => join(ROOT, p));

const skipDir = new Set(['admin', 'api', 'node_modules', '.next', 'wibe']);
const exts = new Set(['.tsx', '.ts', '.css']);

const patterns = {
  'bg-gray': /bg-gray-\d+/g,
  'border-gray': /border-gray-\d+/g,
  'text-gray': /text-gray-\d+/g,
  'hover-bg-gray': /hover:bg-gray-\d+/g,
  'arbitrary-text': /text-\[[0-9.]+(?:px|rem)\]/g,
  'violet/purple': /(?:violet|purple)-\d+|from-(?:purple|violet)|to-(?:purple|violet)/g,
};

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (skipDir.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else {
      const ext = name.slice(name.lastIndexOf('.'));
      if (exts.has(ext)) out.push(full);
    }
  }
  return out;
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const topArg = args.find((a) => a.startsWith('--top='));
const topN = topArg ? Number(topArg.split('=')[1]) || 40 : 40;

const files = roots.flatMap((r) => walk(r));
const counts = Object.fromEntries(Object.keys(patterns).map((k) => [k, 0]));
const byFile = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const hits = {};
  let total = 0;
  for (const [name, rx] of Object.entries(patterns)) {
    const m = text.match(rx);
    const n = m ? m.length : 0;
    if (n) {
      hits[name] = n;
      counts[name] += n;
      total += n;
    }
  }
  if (total) byFile.push({ file: relative(ROOT, file), total, hits });
}

byFile.sort((a, b) => b.total - a.total);

if (asJson) {
  console.log(JSON.stringify({ counts, fileCount: byFile.length, top: byFile.slice(0, topN) }, null, 2));
  process.exit(0);
}

console.log('Consumer design-token audit\n');
console.log('Totals:');
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log(`\nFiles with hits: ${byFile.length}`);
console.log(`\nTop ${Math.min(topN, byFile.length)}:`);
for (const row of byFile.slice(0, topN)) {
  const detail = Object.entries(row.hits)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  console.log(`  ${String(row.total).padStart(3)}  ${row.file}  (${detail})`);
}

console.log('\nSee docs/CONSUMER_DESIGN_TOKENS.md for migration map.');
