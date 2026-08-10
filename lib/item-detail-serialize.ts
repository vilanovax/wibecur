/** فیلدهای metadata لازم برای صفحه جزئیات آیتم (hero + facts) */
const ITEM_DETAIL_METADATA_KEYS = [
  'director',
  'year',
  'genre',
  'actors',
  'country',
  'author',
  'translator',
  'address',
  'cuisine',
  'priceRange',
  'phone',
  'mapsUrl',
  'instagram',
  'website',
  'posterUrl',
  'poster',
  'imageUrl',
  'coverUrl',
  'searchProfile',
  'sourceCategorySlug',
  'categorySlug',
  'entryKind',
  'factType',
  'imdbRating',
  'tip',
  'duration',
] as const;

const MAX_DESCRIPTION_CHARS = 1200;

export function slimItemDetailMetadata(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const out: Record<string, unknown> = {};
  for (const key of ITEM_DETAIL_METADATA_KEYS) {
    const val = metadata[key];
    if (val != null && val !== '') out[key] = val;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function trimItemDescription(
  description: string | null | undefined
): string | null {
  const trimmed = description?.trim() || null;
  if (!trimmed) return null;
  if (trimmed.length <= MAX_DESCRIPTION_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_CHARS)}…`;
}
