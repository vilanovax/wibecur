/**
 * مدل ورودی لیست — tip/fact/link در مقابل ارجاع کاتالوگ
 */

export const ENTRY_KINDS = ['tip', 'fact', 'catalog_ref', 'link'] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export const FACT_TYPES = [
  'science',
  'health',
  'productivity',
  'family',
  'general',
] as const;
export type FactType = (typeof FACT_TYPES)[number];

export const ENTRY_KIND_LABELS: Record<EntryKind, string> = {
  tip: 'نکته / داده',
  fact: 'فکت علمی',
  catalog_ref: 'از کاتالوگ',
  link: 'لینک',
};

export const FACT_TYPE_LABELS: Record<FactType, string> = {
  science: 'علمی',
  health: 'سلامت',
  productivity: 'بهره‌وری',
  family: 'خانواده',
  general: 'عمومی',
};

const STRICT_ENTITY_SLUGS = [
  'movie',
  'movies',
  'film',
  'series',
  'cinema',
  'book',
  'books',
  'cafe',
  'restaurant',
] as const;

/** دسته‌هایی که آیتم‌های ترکیبی (tip + catalog_ref) دارند */
export function isMixedListCategory(slug: string | null | undefined): boolean {
  if (!slug) return true;
  const s = slug.toLowerCase();
  return !STRICT_ENTITY_SLUGS.some((key) => s === key || s.includes(key));
}

/** لیست‌های لایف‌استایل — نمایش سبک‌تر ورودی‌های tip/fact/link */
export function isLifestyleCategory(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return s === 'lifestyle' || s.includes('lifestyle');
}

export function isLightweightEntryKind(kind: EntryKind): boolean {
  return kind === 'tip' || kind === 'fact' || kind === 'link';
}

function asMetaRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function parseEntryKind(value: unknown): EntryKind | null {
  if (typeof value !== 'string') return null;
  return ENTRY_KINDS.includes(value as EntryKind) ? (value as EntryKind) : null;
}

/** تعیین نوع ورودی — از metadata یا catalogItemId */
export function resolveEntryKind(item: {
  catalogItemId?: string | null;
  metadata?: unknown;
  imageUrl?: string | null;
  externalUrl?: string | null;
}): EntryKind {
  const meta = asMetaRecord(item.metadata);
  const explicit = parseEntryKind(meta.entryKind);
  if (explicit) return explicit;

  if (item.catalogItemId) return 'catalog_ref';

  if (item.externalUrl?.trim() && !item.imageUrl?.trim()) return 'link';

  return 'tip';
}

export function isLightweightListItem(item: {
  catalogItemId?: string | null;
  metadata?: unknown;
  imageUrl?: string | null;
  externalUrl?: string | null;
}): boolean {
  return isLightweightEntryKind(resolveEntryKind(item));
}

export function entryKindIcon(kind: EntryKind): string {
  switch (kind) {
    case 'fact':
      return '📊';
    case 'link':
      return '🔗';
    case 'catalog_ref':
      return '📎';
    default:
      return '💡';
  }
}

export function entryKindBadgeLabel(kind: EntryKind): string {
  return ENTRY_KIND_LABELS[kind] ?? kind;
}

export function sourceCategorySlugFromItem(item: {
  metadata?: unknown;
  catalogItemId?: string | null;
}): string | null {
  const meta = asMetaRecord(item.metadata);
  const fromMeta = meta.sourceCategorySlug;
  if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim();
  return null;
}

/** metadata پیش‌فرض برای placement از کاتالوگ */
export function catalogRefMetadata(
  catalog: { categorySlug?: string | null; metadata?: unknown },
  existing?: unknown
): Record<string, unknown> {
  const base = asMetaRecord(existing);
  const catalogMeta = asMetaRecord(catalog.metadata);
  return {
    ...catalogMeta,
    ...base,
    entryKind: 'catalog_ref' as const,
    sourceCategorySlug: catalog.categorySlug ?? base.sourceCategorySlug ?? null,
  };
}

/** metadata برای ورودی سبک بدون کاتالوگ */
export function lightweightEntryMetadata(
  entryKind: EntryKind,
  input: Record<string, unknown> = {}
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...input, entryKind };
  if (entryKind === 'link' && !out.entryKind) out.entryKind = 'link';
  return out;
}
