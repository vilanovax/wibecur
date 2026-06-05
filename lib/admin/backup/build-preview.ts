import type { ParsedBackupBundle } from './parse-archive';
import {
  BACKUP_TABLE_REGISTRY,
  getTableMeta,
  GROUP_LABELS,
  type BackupTableGroup,
} from './table-registry';

export interface BackupTablePreview {
  key: string;
  label: string;
  group: BackupTableGroup;
  rowCount: number;
  sampleRows: unknown[];
  restorable: boolean;
  description?: string;
  inManifest: boolean;
}

export interface BackupImportPreview {
  sessionId: string;
  fileName: string;
  format: 'zip' | 'json';
  manifest: ParsedBackupBundle['manifest'];
  tables: BackupTablePreview[];
  totalRows: number;
  warnings: string[];
  mediaUrlCount: number;
}

const SAMPLE_SIZE = 3;

export function buildImportPreview(
  sessionId: string,
  bundle: ParsedBackupBundle
): BackupImportPreview {
  const warnings: string[] = [];
  const tableKeys = new Set([
    ...bundle.manifest.tables,
    ...Object.keys(bundle.data),
  ]);

  if (bundle.manifest.app !== 'WibeCur') {
    warnings.push('این فایل برای اپ دیگری ساخته شده است.');
  }
  if (bundle.manifest.version !== 1) {
    warnings.push('نسخه manifest پشتیبانی نشده است.');
  }

  const tables: BackupTablePreview[] = [];

  for (const key of [...tableKeys].sort()) {
    const rows = bundle.data[key];
    const rowCount = Array.isArray(rows) ? rows.length : 0;
    if (rowCount === 0) continue;

    const meta = getTableMeta(key);
    tables.push({
      key,
      label: meta?.label ?? key,
      group: meta?.group ?? 'other',
      rowCount,
      sampleRows: (rows as unknown[]).slice(0, SAMPLE_SIZE),
      restorable: meta?.restorable ?? false,
      description: meta?.description,
      inManifest: bundle.manifest.tables.includes(key),
    });
  }

  tables.sort((a, b) => {
    const ga = BACKUP_TABLE_REGISTRY.find((t) => t.key === a.key)?.restoreOrder ?? 999;
    const gb = BACKUP_TABLE_REGISTRY.find((t) => t.key === b.key)?.restoreOrder ?? 999;
    return ga - gb;
  });

  const unknown = tables.filter((t) => t.group === 'other' && !t.restorable);
  if (unknown.length > 0) {
    warnings.push(
      `${unknown.length} جدول بدون پشتیبانی بازیابی: ${unknown.map((t) => t.key).join('، ')}`
    );
  }

  return {
    sessionId,
    fileName: bundle.fileName,
    format: bundle.format,
    manifest: bundle.manifest,
    tables,
    totalRows: tables.reduce((s, t) => s + t.rowCount, 0),
    warnings,
    mediaUrlCount: bundle.mediaManifest?.length ?? 0,
  };
}

export { GROUP_LABELS };
