import { isDisplayableDescription } from '@/lib/lists-card-utils';
import { normalizeSearchQuery } from '@/lib/list-search';

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

/** زیرعنوان کارت آیتم — metadata اول، بعد description، بعد rating */
export function getItemCardSubtitle(item: {
  description?: string | null;
  rating?: number;
  metadata?: ItemMeta;
  categorySlug?: string | null;
}): string | null {
  const meta = item.metadata;
  const parts: string[] = [];

  const year = metaYear(meta);
  if (year) parts.push(year);

  const genre = metaString(meta, 'genre');
  if (genre) parts.push(genre);

  const author = metaString(meta, 'author');
  if (author) parts.push(author);

  const director = metaString(meta, 'director');
  if (director) parts.push(director);

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

function itemSearchHaystack(item: {
  title: string;
  description?: string | null;
  metadata?: ItemMeta;
}): string {
  const meta = item.metadata ?? {};
  const parts = [
    item.title,
    item.description ?? '',
    meta.genre,
    meta.director,
    meta.author,
    meta.year,
    meta.imdbRating,
    meta.cuisine,
  ]
    .filter((v) => v != null && String(v).trim())
    .map((v) => String(v));

  return parts.join(' ').toLowerCase();
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

  return items.filter((item) => itemSearchHaystack(item).includes(q));
}

/** حداقل تعداد آیتم برای نمایش جستجوی درون‌لیستی */
export const LIST_INNER_SEARCH_MIN_ITEMS = 8;
