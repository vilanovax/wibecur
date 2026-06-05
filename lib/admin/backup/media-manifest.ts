import type { BackupDataFiles } from './types';

export type MediaManifestEntry = {
  entityType: string;
  entityId: string;
  field: string;
  url: string;
};

const IMAGE_FIELDS: Record<string, string[]> = {
  categories: ['heroImage', 'icon'],
  lists: ['coverImage'],
  catalog_items: ['imageUrl'],
  items: ['imageUrl'],
  users: ['image'],
  suggested_items: ['imageUrl'],
  suggested_lists: ['coverImage'],
};

function pushUrl(
  entries: MediaManifestEntry[],
  entityType: string,
  entityId: string,
  field: string,
  url: unknown
) {
  if (typeof url !== 'string' || !url.trim()) return;
  entries.push({ entityType, entityId, field, url: url.trim() });
}

export function buildMediaManifest(dataFiles: BackupDataFiles): MediaManifestEntry[] {
  const entries: MediaManifestEntry[] = [];

  for (const [table, fields] of Object.entries(IMAGE_FIELDS)) {
    const rows = dataFiles[table];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const id = String(r.id ?? '');
      if (!id) continue;
      for (const field of fields) {
        pushUrl(entries, table, id, field, r[field]);
      }
    }
  }

  return entries;
}
