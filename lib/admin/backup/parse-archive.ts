import type { BackupDataFiles, BackupManifestV1 } from './types';
import type { MediaManifestEntry } from './media-manifest';

export interface ParsedBackupBundle {
  format: 'zip' | 'json';
  fileName: string;
  manifest: BackupManifestV1;
  data: BackupDataFiles;
  mediaManifest?: MediaManifestEntry[];
}

function isManifestV1(v: unknown): v is BackupManifestV1 {
  if (!v || typeof v !== 'object') return false;
  const m = v as BackupManifestV1;
  return m.version === 1 && m.app === 'WibeCur' && Array.isArray(m.tables);
}

function parseJsonBuffer(buf: Buffer, fileName: string): ParsedBackupBundle {
  const raw = JSON.parse(buf.toString('utf-8')) as Record<string, unknown>;

  if (isManifestV1(raw) && !raw.data) {
    throw new Error('فایل JSON فقط manifest است؛ بسته کامل ZIP یا bundle.json لازم است');
  }

  if (raw.manifest && raw.data) {
    const manifest = raw.manifest as BackupManifestV1;
    if (!isManifestV1(manifest)) throw new Error('manifest نامعتبر');
    return {
      format: 'json',
      fileName,
      manifest,
      data: raw.data as BackupDataFiles,
      mediaManifest: Array.isArray(raw.mediaManifest)
        ? (raw.mediaManifest as MediaManifestEntry[])
        : undefined,
    };
  }

  if (isManifestV1(raw)) {
    return {
      format: 'json',
      fileName,
      manifest: raw,
      data: {},
    };
  }

  const data: BackupDataFiles = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) data[k] = v;
  }
  if (Object.keys(data).length === 0) {
    throw new Error('ساختار JSON شناخته نشد');
  }

  const manifest: BackupManifestV1 = {
    version: 1,
    app: 'WibeCur',
    createdAt: new Date().toISOString(),
    createdById: 'import',
    options: { scopes: [], assetMode: 'none', includeTrash: false },
    stats: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
    tables: Object.keys(data).sort(),
    secretsExcluded: [],
    notes: ['وارد شده از JSON بدون manifest'],
  };

  return { format: 'json', fileName, manifest, data };
}

async function parseZipBuffer(buf: Buffer, fileName: string): Promise<ParsedBackupBundle> {
  const unzipper = await import('unzipper');
  const directory = await unzipper.Open.buffer(buf);

  const readText = async (entryPath: string): Promise<string | null> => {
    const entry = directory.files.find(
      (f) => f.path === entryPath || f.path.endsWith(`/${entryPath}`)
    );
    if (!entry) return null;
    return (await entry.buffer()).toString('utf-8');
  };

  const manifestText = await readText('manifest.json');
  if (!manifestText) {
    throw new Error('manifest.json در ZIP یافت نشد');
  }

  const manifest = JSON.parse(manifestText) as BackupManifestV1;
  if (!isManifestV1(manifest)) {
    throw new Error('manifest.json نامعتبر است');
  }

  const data: BackupDataFiles = {};
  for (const table of manifest.tables) {
    const tableText = await readText(`data/${table}.json`);
    if (tableText) {
      const rows = JSON.parse(tableText) as unknown[];
      if (Array.isArray(rows) && rows.length > 0) {
        data[table] = rows;
      }
    }
  }

  let mediaManifest: MediaManifestEntry[] | undefined;
  const mediaText = await readText('media-manifest.json');
  if (mediaText) {
    const parsed = JSON.parse(mediaText) as unknown;
    if (Array.isArray(parsed)) mediaManifest = parsed as MediaManifestEntry[];
  }

  return { format: 'zip', fileName, manifest, data, mediaManifest };
}

export async function parseBackupFile(
  buffer: Buffer,
  fileName: string
): Promise<ParsedBackupBundle> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.zip')) {
    return parseZipBuffer(buffer, fileName);
  }
  if (lower.endsWith('.json')) {
    return parseJsonBuffer(buffer, fileName);
  }
  throw new Error('فقط فایل .zip یا .json پشتیبانی می‌شود');
}
