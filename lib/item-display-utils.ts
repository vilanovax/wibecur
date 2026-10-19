import { isDisplayableDescription } from '@/lib/lists-card-utils';
import { normalizeSearchQuery } from '@/lib/list-search';
import { isLocationCategorySlug } from '@/lib/category-layout';
import { buildItemSearchHaystack } from '@/lib/search-keywords';

type ItemMeta = Record<string, unknown> | null | undefined;

function metaString(meta: ItemMeta, key: string): string | null {
  const val = meta?.[key];
  if (val == null || val === '') return null;
  return String(val).trim() || null;
}

function metaYear(meta: ItemMeta): string | null {
  const raw = meta?.year;
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1800) return null;
  return n.toLocaleString('fa-IR');
}

function shortenAddress(address: string): string {
  const trimmed = address.trim();
  if (trimmed.length <= 44) return trimmed;
  return `${trimmed.slice(0, 42)}…`;
}

function formatPriceRangeLabel(value: string): string {
  if (value === '$') return 'ارزان';
  if (value === '$$') return 'متوسط';
  if (value === '$$$') return 'گران';
  if (value === '$$$$') return 'لوکس';
  return value;
}

function buildCafeCardSubtitle(meta: ItemMeta): string | null {
  const parts: string[] = [];
  const address = metaString(meta, 'address');
  if (address) parts.push(shortenAddress(address));
  const cuisine = metaString(meta, 'cuisine');
  if (cuisine) parts.push(cuisine);
  const priceRange = metaString(meta, 'priceRange');
  if (priceRange) parts.push(formatPriceRangeLabel(priceRange));
  return parts.length > 0 ? parts.slice(0, 3).join(' · ') : null;
}

/** زیرعنوان کارت آیتم — metadata اول، بعد description، بعد rating */
export function getItemCardSubtitle(item: {
  description?: string | null;
  rating?: number;
  metadata?: ItemMeta;
  categorySlug?: string | null;
}): string | null {
  const meta = item.metadata;
  const slug = item.categorySlug?.toLowerCase() ?? '';

  if (slug && isLocationCategorySlug(slug)) {
    const cafeLine = buildCafeCardSubtitle(meta);
    if (cafeLine) return cafeLine;
  }

  const parts: string[] = [];
  const isBook =
    slug.includes('book') || slug.includes('literature') || slug.includes('podcast');

  // کتاب: نویسنده اول — سال/ژانر در گرید شلوغ می‌کند
  if (isBook) {
    const author = metaString(meta, 'author');
    if (author) return author;
    const genre = metaString(meta, 'genre');
    if (genre) return genre;
  }

  const year = metaYear(meta);
  if (year) parts.push(year);

  const genre = metaString(meta, 'genre');
  if (genre) parts.push(genre);

  const author = metaString(meta, 'author');
  if (author) parts.push(author);

  const director = metaString(meta, 'director');
  if (director) parts.push(director);

  const country = metaString(meta, 'country');
  if (country) parts.push(country);

  const actors = meta?.actors;
  if (Array.isArray(actors) && actors.length > 0) {
    parts.push(actors.slice(0, 2).map(String).join(' · '));
  } else if (typeof actors === 'string' && actors.trim()) {
    parts.push(actors.trim());
  }

  const imdb = metaString(meta, 'imdbRating');
  if (imdb) parts.push(`IMDb ${imdb}`);

  const cuisine = metaString(meta, 'cuisine');
  if (cuisine) parts.push(cuisine);

  if (parts.length > 0) return parts.slice(0, 3).join(' · ');

  const desc = item.description?.trim();
  if (desc && isDisplayableDescription(desc)) return desc;

  if (item.rating && item.rating > 0) {
    return `امتیاز ${item.rating.toLocaleString('fa-IR')}`;
  }

  return null;
}

/** فیلتر آیتم‌های یک لیست — client-side */
export function filterItemsByQuery<
  T extends {
    title: string;
    description?: string | null;
    metadata?: ItemMeta;
  },
>(items: T[], query: string): T[] {
  const q = normalizeSearchQuery(query).toLowerCase();
  if (!q) return items;

  return items.filter((item) =>
    buildItemSearchHaystack({
      title: item.title,
      description: item.description,
      metadata: item.metadata,
    }).includes(q)
  );
}

/** حداقل تعداد آیتم برای نمایش جستجوی درون‌لیستی */
export const LIST_INNER_SEARCH_MIN_ITEMS = 8;
