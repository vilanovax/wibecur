/**
 * Writes a machine-readable Lighthouse baseline snapshot from .lighthouseci/
 * for before/after comparison of home / category / list.
 *
 * Usage: node scripts/lighthouse-baseline.mjs
 * Optional: LHCI_BASELINE_LABEL=post-perf-phase3
 */
import fs from 'node:fs';
import path from 'node:path';

const reportDir = path.join(process.cwd(), '.lighthouseci');
const outDir = path.join(process.cwd(), 'perf', 'baselines');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function score(value) {
  return typeof value === 'number' ? Math.round(value * 100) : null;
}

function ms(value) {
  return typeof value === 'number' ? Math.round(value) : null;
}

function classifyUrl(url) {
  try {
    const { pathname } = new URL(url);
    if (pathname === '/' || pathname === '') return 'home';
    if (pathname.startsWith('/categories/')) return 'category';
    if (pathname.startsWith('/lists/') && pathname !== '/lists') return 'list';
    if (pathname === '/lists') return 'lists-index';
    return pathname;
  } catch {
    return 'unknown';
  }
}

if (!fs.existsSync(reportDir)) {
  console.error('No .lighthouseci directory. Run lhci autorun first.');
  process.exit(1);
}

const manifest = readJson(path.join(reportDir, 'manifest.json'));
const links = Array.isArray(manifest) ? manifest : [];
if (links.length === 0) {
  console.error('Lighthouse manifest is empty.');
  process.exit(1);
}

const pages = [];
for (const entry of links) {
  const reportPath = entry.jsonPath || entry.jsonFile;
  if (!reportPath) continue;
  const absolutePath = path.isAbsolute(reportPath)
    ? reportPath
    : path.join(reportDir, reportPath);
  const report = readJson(absolutePath);
  if (!report) continue;

  const url = report.finalUrl || report.requestedUrl || entry.url || '';
  const categories = report.categories || {};
  const audits = report.audits || {};

  pages.push({
    key: classifyUrl(url),
    url,
    scores: {
      performance: score(categories.performance?.score),
      accessibility: score(categories.accessibility?.score),
      bestPractices: score(categories['best-practices']?.score),
      seo: score(categories.seo?.score),
    },
    metrics: {
      fcpMs: ms(audits['first-contentful-paint']?.numericValue),
      lcpMs: ms(audits['largest-contentful-paint']?.numericValue),
      tbtMs: ms(audits['total-blocking-time']?.numericValue),
      cls: typeof audits['cumulative-layout-shift']?.numericValue === 'number'
        ? Number(audits['cumulative-layout-shift'].numericValue.toFixed(3))
        : null,
      siMs: ms(audits['speed-index']?.numericValue),
    },
  });
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const label = process.env.LHCI_BASELINE_LABEL || 'baseline';
const snapshot = {
  label,
  createdAt: new Date().toISOString(),
  preset: 'desktop',
  pages,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${label}-${stamp}.json`);
const latestFile = path.join(outDir, 'latest.json');
fs.writeFileSync(outFile, `${JSON.stringify(snapshot, null, 2)}\n`);
fs.writeFileSync(latestFile, `${JSON.stringify(snapshot, null, 2)}\n`);

const lines = [
  `Lighthouse baseline → ${path.relative(process.cwd(), outFile)}`,
  '',
  '| Page | Perf | A11y | BP | SEO | LCP | FCP | TBT | CLS |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
];

for (const page of pages) {
  const { scores: s, metrics: m } = page;
  lines.push(
    `| ${page.key} | ${s.performance ?? '—'} | ${s.accessibility ?? '—'} | ${s.bestPractices ?? '—'} | ${s.seo ?? '—'} | ${m.lcpMs ?? '—'} | ${m.fcpMs ?? '—'} | ${m.tbtMs ?? '—'} | ${m.cls ?? '—'} |`
  );
}

const summary = lines.join('\n');
console.log(summary);
fs.writeFileSync(path.join(outDir, 'latest.md'), `${summary}\n`);
