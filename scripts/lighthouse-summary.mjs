import fs from 'node:fs';
import path from 'node:path';

const reportDir = path.join(process.cwd(), '.lighthouseci');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function formatScore(value) {
  if (typeof value !== 'number') return '—';
  return `${Math.round(value * 100)}`;
}

if (!fs.existsSync(reportDir)) {
  console.log('No Lighthouse reports found.');
  process.exit(0);
}

const manifest = readJson(path.join(reportDir, 'manifest.json'));
const links = Array.isArray(manifest) ? manifest : [];

if (links.length === 0) {
  console.log('Lighthouse manifest is empty.');
  process.exit(0);
}

const lines = [
  '## Lighthouse summary',
  '',
  '| URL | Performance | Accessibility | Best practices | SEO | LCP (ms) |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
];

for (const entry of links) {
  const reportPath = entry.jsonPath || entry.jsonFile;
  if (!reportPath) continue;

  const absolutePath = path.isAbsolute(reportPath)
    ? reportPath
    : path.join(reportDir, reportPath);
  const report = readJson(absolutePath);
  if (!report) continue;

  const url = report.finalUrl || report.requestedUrl || entry.url || '—';
  const categories = report.categories || {};
  const lcp = report.audits?.['largest-contentful-paint']?.numericValue;

  lines.push(
    `| ${url} | ${formatScore(categories.performance?.score)} | ${formatScore(categories.accessibility?.score)} | ${formatScore(categories['best-practices']?.score)} | ${formatScore(categories.seo?.score)} | ${typeof lcp === 'number' ? Math.round(lcp) : '—'} |`
  );
}

const summary = lines.join('\n');
console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}
