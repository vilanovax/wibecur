/** فیلدهای metadata لازم برای کارت لیست + مودال پیش‌نمایش آیتم */
const CLIENT_ITEM_METADATA_KEYS = [
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
  // فیلتر دسته‌بندی در /user-lists/[id]
  'sourceCategorySlug',
  'categorySlug',
  // مودال پیش‌نمایش (ItemPreviewSheet)
  'entryKind',
  'factType',
  'imdbRating',
  'tip',
  'duration',
] as const;

const MAX_ITEM_DESCRIPTION_CHARS = 320;

function slimItemMetadata(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;

  const out: Record<string, unknown> = {};
  for (const key of CLIENT_ITEM_METADATA_KEYS) {
    const val = metadata[key];
    if (val != null && val !== '') out[key] = val;
  }
  return Object.keys(out).length > 0 ? out : null;
}

type ListItemLike = {
  description?: string | null;
  metadata?: unknown;
};

/** سبک‌سازی payload آیتم‌ها برای صفحه جزئیات لیست */
export function prepareListDetailForClient<T extends { items: ListItemLike[] }>(list: T): T {
  return {
    ...list,
    items: list.items.map((item) => {
      const meta =
        item.metadata != null &&
        typeof item.metadata === 'object' &&
        !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : null;

      const description = item.description?.trim() ?? null;
      const trimmedDescription =
        description && description.length > MAX_ITEM_DESCRIPTION_CHARS
          ? `${description.slice(0, MAX_ITEM_DESCRIPTION_CHARS)}…`
          : description;

      return {
        ...item,
        description: trimmedDescription,
        metadata: slimItemMetadata(meta),
      };
    }),
  };
}
