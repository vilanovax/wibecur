#!/usr/bin/env node
/**
 * بهینه‌سازی سنگین بنرهای محلی public/images/banners/
 * خروجی: WebP با ابعاد حداکثر 1280×960 (inside) و هدف ~۱۲۰KB
 *
 * اجرا: node scripts/optimize-banner-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANNERS_DIR = path.join(__dirname, '../public/images/banners');

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 960;
const TARGET_MAX_BYTES = 120 * 1024;
const START_QUALITY = 74;
const MIN_QUALITY = 48;
const FORMAT = 'webp';

function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

async function encodeBanner(inputBuffer, { maxWidth, maxHeight, quality }) {
  const buffer = await sharp(inputBuffer)
    .rotate()
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toBuffer();

  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width, height: meta.height };
}

async function optimizeFile(filePath) {
  const inputBuffer = fs.readFileSync(filePath);
  const originalBytes = inputBuffer.length;
  const base = path.basename(filePath, path.extname(filePath));
  const outPath = path.join(BANNERS_DIR, `${base}.${FORMAT}`);

  let quality = START_QUALITY;
  let width = MAX_WIDTH;
  let height = MAX_HEIGHT;
  let result = await encodeBanner(inputBuffer, { maxWidth: width, maxHeight: height, quality });

  for (let attempt = 0; attempt < 14 && result.buffer.length > TARGET_MAX_BYTES; attempt++) {
    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 6);
    } else if (width > 720) {
      width = Math.round(width * 0.88);
      height = Math.round(height * 0.88);
    } else {
      break;
    }
    result = await encodeBanner(inputBuffer, { maxWidth: width, maxHeight: height, quality });
  }

  fs.writeFileSync(outPath, result.buffer);

  const ext = path.extname(filePath).toLowerCase();
  if (ext !== `.${FORMAT}` && filePath !== outPath) {
    fs.unlinkSync(filePath);
  }

  return {
    name: base,
    originalBytes,
    optimizedBytes: result.buffer.length,
    width: result.width,
    height: result.height,
    quality,
    outPath,
  };
}

async function main() {
  if (!fs.existsSync(BANNERS_DIR)) {
    console.error('Directory not found:', BANNERS_DIR);
    process.exit(1);
  }

  const inputs = fs
    .readdirSync(BANNERS_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort();

  if (inputs.length === 0) {
    console.log('No JPEG/PNG banners to optimize.');
    return;
  }

  console.log(`Optimizing ${inputs.length} banner(s) → WebP (max ${MAX_WIDTH}×${MAX_HEIGHT}, target ${formatBytes(TARGET_MAX_BYTES)})…\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  const rows = [];

  for (const file of inputs) {
    const filePath = path.join(BANNERS_DIR, file);
    const row = await optimizeFile(filePath);
    totalBefore += row.originalBytes;
    totalAfter += row.optimizedBytes;
    rows.push(row);
    console.log(
      `${row.name}: ${formatBytes(row.originalBytes)} → ${formatBytes(row.optimizedBytes)} (${row.width}×${row.height}, q${row.quality})`
    );
  }

  console.log('\n---');
  console.log(`Total: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
