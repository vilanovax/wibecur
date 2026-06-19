import { isPlaceholderCoverPath } from '@/lib/image-url-policy';
import { parseItemMetadata } from '@/lib/resolve-admin-item-image';

function extractImdbId(metadata: unknown, externalUrl?: string | null): string | null {
  const meta = parseItemMetadata(metadata as Record<string, unknown> | null);
  const fromMeta =
    (typeof meta?.imdbId === 'string' && meta.imdbId.trim()) ||
    (typeof meta?.imdbID === 'string' && meta.imdbID.trim()) ||
    null;
  if (fromMeta) return fromMeta.replace(/^imdb-/i, '');

  const url = externalUrl?.trim() || '';
  const m = url.match(/imdb\.com\/title\/(tt\d+)/i);
  return m?.[1] ?? null;
}

export function extractCatalogImdbId(row: {
  metadata: unknown;
  externalUrl: string | null;
  externalKey: string | null;
}): string | null {
  const fromMeta = extractImdbId(row.metadata, row.externalUrl);
  if (fromMeta) return fromMeta;

  const key = row.externalKey?.trim() || '';
  const m = key.match(/^imdb:(tt\d+)$/i);
  return m?.[1] ?? null;
}

export function extractItemImdbId(row: {
  metadata: unknown;
  externalUrl: string | null;
  catalog?: {
    metadata: unknown;
    externalUrl: string | null;
    externalKey: string | null;
  } | null;
}): string | null {
  const fromItem = extractImdbId(row.metadata, row.externalUrl);
  if (fromItem) return fromItem;
  if (row.catalog) return extractCatalogImdbId(row.catalog);
  return null;
}

export function catalogMissingPosterImage(imageUrl: string | null | undefined): boolean {
  const t = imageUrl?.trim() || '';
  if (!t) return true;
  return isPlaceholderCoverPath(t);
}
