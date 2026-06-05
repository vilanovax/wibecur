import fs from 'fs';
import path from 'path';
import type { BackupManifestV1 } from './types';
import type { BackupDataFiles } from './types';
import type { MediaManifestEntry } from './media-manifest';

const README_FA = `پشتیبان WibeCur
================

این بسته شامل manifest.json و پوشه data/ با خروجی JSON جداول است.
فایل media-manifest.json (در صورت وجود) فقط URL تصاویر را دارد — فایل باینری دانلود نشده.

بازیابی کامل در فاز بعدی پنل ادمین اضافه می‌شود.
رمز عبور کاربران و کلیدهای API عمداً حذف شده‌اند.
`;

export async function writeBackupArchive(params: {
  outputPath: string;
  manifest: BackupManifestV1;
  dataFiles: BackupDataFiles;
  mediaManifest?: MediaManifestEntry[];
}): Promise<{ format: 'zip' | 'json'; sizeBytes: number }> {
  const { outputPath, manifest, dataFiles, mediaManifest } = params;
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  try {
    const archiver = (await import('archiver')).default;
    const { createWriteStream } = await import('fs');
    const zipPath = outputPath.endsWith('.zip') ? outputPath : `${outputPath}.zip`;

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 6 } });
      output.on('close', () => resolve());
      archive.on('error', reject);
      archive.pipe(output);

      archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
      archive.append(README_FA, { name: 'README-fa.txt' });

      for (const [table, rows] of Object.entries(dataFiles)) {
        archive.append(JSON.stringify(rows, null, 2), { name: `data/${table}.json` });
      }

      if (mediaManifest && mediaManifest.length > 0) {
        archive.append(JSON.stringify(mediaManifest, null, 2), {
          name: 'media-manifest.json',
        });
      }

      void archive.finalize();
    });

    const stat = fs.statSync(zipPath);
    return { format: 'zip', sizeBytes: stat.size };
  } catch (err) {
    console.warn('[backup] archiver unavailable, falling back to JSON bundle:', err);
    const jsonPath = outputPath.replace(/\.zip$/, '.json');
    const bundle = {
      manifest,
      data: dataFiles,
      mediaManifest: mediaManifest ?? [],
      readme: README_FA,
    };
    fs.writeFileSync(jsonPath, JSON.stringify(bundle, null, 2), 'utf-8');
    const stat = fs.statSync(jsonPath);
    return { format: 'json', sizeBytes: stat.size };
  }
}
