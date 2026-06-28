/**
 * Process attached funny avatar PNGs → optimized WebP in public/avatars/vibe/
 * Run: npx tsx scripts/process-vibe-avatars.ts
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = join(
  process.cwd(),
  '../.cursor/projects/Users-rum-Documents-Projects-wibe/assets'
);
const ALT_SOURCE = '/Users/rum/.cursor/projects/Users-rum-Documents-Projects-wibe/assets';
const OUT_DIR = join(process.cwd(), 'public/avatars/vibe');
const SIZE = 256;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  let sourceDir = SOURCE_DIR;
  try {
    readdirSync(sourceDir);
  } catch {
    sourceDir = ALT_SOURCE;
  }

  const files = readdirSync(sourceDir)
    .filter((f) => f.startsWith('funny_avatars-') && f.endsWith('.png'))
    .sort((a, b) => {
      const na = Number(basename(a).match(/funny_avatars-(\d+)/)?.[1] ?? 0);
      const nb = Number(basename(b).match(/funny_avatars-(\d+)/)?.[1] ?? 0);
      return na - nb;
    });

  const manifest: { id: string; file: string; bytes: number }[] = [];

  for (const file of files) {
    const num = basename(file).match(/funny_avatars-(\d+)/)?.[1]?.padStart(2, '0') ?? '00';
    const id = num === '01' ? 'vibe' : `char-${num}`;
    const outName = `${id}.webp`;
    const input = join(sourceDir, file);
    const output = join(OUT_DIR, outName);

    const buffer = await sharp(input)
      .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    writeFileSync(output, buffer);
    manifest.push({ id, file: outName, bytes: buffer.length });
    console.log(`${outName} — ${(buffer.length / 1024).toFixed(1)} KB`);
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone: ${manifest.length} avatars → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
