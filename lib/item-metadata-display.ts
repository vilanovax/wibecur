/** کلیدهای داخلی — در UI نمایش داده نمی‌شوند (فقط برای کاتالوگ/ادغام) */
export const INTERNAL_METADATA_KEYS = new Set([
  'imdbId',
  'imdbID',
  'tmdbId',
  'tmdbID',
]);

/** نکته جداگانه نمایش داده می‌شود — نه در grid متادیتا */
export const ITEM_TIP_METADATA_KEY = 'tip';

/** کلیدهایی که در هیرو نمایش داده می‌شوند */
export const HERO_METADATA_KEYS = new Set(['year', 'genre', 'imdbRating']);

export function extractItemTip(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const raw = metadata[ITEM_TIP_METADATA_KEY];
  if (typeof raw !== 'string') return null;
  const tip = raw.trim();
  return tip || null;
}

export type MetadataFact = {
  key: string;
  label: string;
  value: string;
  icon: string;
};

const FACT_LABELS: Record<string, { label: string; icon: string }> = {
  director: { label: 'کارگردان', icon: '🎬' },
  imdbRating: { label: 'امتیاز IMDb', icon: '⭐' },
  country: { label: 'ساخت', icon: '🌍' },
  actors: { label: 'بازیگران', icon: '🎭' },
  author: { label: 'نویسنده', icon: '✍️' },
  address: { label: 'آدرس', icon: '📍' },
  priceRange: { label: 'بازه قیمت', icon: '💰' },
  cuisine: { label: 'نوع غذا', icon: '🍽️' },
  phone: { label: 'تلفن', icon: '📞' },
};

const MOVIE_FACT_ORDER = ['director', 'imdbRating', 'country', 'actors'] as const;
const BOOK_FACT_ORDER = ['author'] as const;
const CAFE_FACT_ORDER = ['address', 'priceRange', 'cuisine', 'phone'] as const;

function isMovieLikeCategory(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return s.includes('movie') || s.includes('film') || s === 'series' || s.includes('cinema');
}

function isBookCategory(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return s.includes('book') || s.includes('literature');
}

function isCafeCategory(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s.includes('cafe') ||
    s.includes('restaurant') ||
    s.includes('food') ||
    s.includes('رستوران') ||
    s.includes('کافه')
  );
}

function formatPriceRange(value: string): string {
  if (value === '$') return 'ارزان';
  if (value === '$$') return 'متوسط';
  if (value === '$$$') return 'گران';
  if (value === '$$$$') return 'لوکس';
  return value;
}

function formatActors(value: unknown): string | null {
  if (Array.isArray(value)) {
    const names = value.map((v) => String(v).trim()).filter(Boolean).slice(0, 2);
    return names.length > 0 ? names.join(' · ') : null;
  }
  if (typeof value === 'string' && value.trim()) {
    const names = value
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2);
    return names.length > 0 ? names.join(' · ') : null;
  }
  return null;
}

function formatImdbRating(value: unknown): string | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toLocaleString('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatFactValue(key: string, value: unknown): string | null {
  if (value == null || value === '') return null;
  if (key === 'imdbRating') return formatImdbRating(value);
  if (key === 'actors') return formatActors(value);
  if (key === 'priceRange' && typeof value === 'string') return formatPriceRange(value);
  return String(value).trim() || null;
}

function pushFact(
  facts: MetadataFact[],
  key: string,
  metadata: Record<string, unknown>
): void {
  const formatted = formatFactValue(key, metadata[key]);
  if (!formatted) return;
  const meta = FACT_LABELS[key] ?? { label: key, icon: '📋' };
  facts.push({ key, label: meta.label, value: formatted, icon: meta.icon });
}

/** فکت‌های قابل نمایش برای UI جزئیات آیتم */
export function buildItemMetadataFacts(
  metadata: Record<string, unknown> | null | undefined,
  categorySlug?: string | null,
  options?: { fallbackImdbRating?: unknown }
): MetadataFact[] {
  const baseMeta =
    metadata != null && typeof metadata === 'object' ? { ...metadata } : ({} as Record<string, unknown>);

  if (
    isMovieLikeCategory(categorySlug) &&
    baseMeta.imdbRating == null &&
    options?.fallbackImdbRating != null &&
    options.fallbackImdbRating !== ''
  ) {
    baseMeta.imdbRating = options.fallbackImdbRating;
  }

  if (Object.keys(baseMeta).length === 0) return [];

  const facts: MetadataFact[] = [];
  const order = isMovieLikeCategory(categorySlug)
    ? MOVIE_FACT_ORDER
    : isBookCategory(categorySlug)
      ? BOOK_FACT_ORDER
      : isCafeCategory(categorySlug)
        ? CAFE_FACT_ORDER
        : null;

  if (order) {
    for (const key of order) {
      pushFact(facts, key, baseMeta);
    }
    return facts;
  }

  for (const [key, value] of Object.entries(baseMeta)) {
    if (HERO_METADATA_KEYS.has(key) || INTERNAL_METADATA_KEYS.has(key) || key === ITEM_TIP_METADATA_KEY) {
      continue;
    }
    if (value == null || value === '') continue;
    pushFact(facts, key, baseMeta);
  }

  return facts;
}

/** برای preview sheet — همان فکت‌ها به‌صورت chip */
export function buildItemMetadataChips(
  metadata: Record<string, unknown> | null | undefined,
  categorySlug?: string | null,
  options?: { fallbackImdbRating?: unknown }
): Array<{ key: string; label: string; value: string }> {
  return buildItemMetadataFacts(metadata, categorySlug, options).map(({ key, label, value }) => ({
    key,
    label,
    value,
  }));
}
