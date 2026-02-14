/**
 * ساخت آیکون‌های PWA با سایز صحیح برای manifest.
 * اجرا: npx tsx scripts/generate-pwa-icons.ts
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const THEME_COLOR = '#6366F1'; // بنفش WibeCur

async function generateIcon(size: number) {
  const buffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 99, g: 102, b: 241 }, // #6366F1
    },
  })
    .png()
    .toBuffer();
  const outPath = path.join(PUBLIC_DIR, `icon-${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ ${outPath}`);
}

async function main() {
  await generateIcon(192);
  await generateIcon(512);
  console.log('\nآیکون‌ها ساخته شدند. manifest.json باید از /icon-192.png و /icon-512.png استفاده کند.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
