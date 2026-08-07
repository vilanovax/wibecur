export const FILM_SLUG_ALIASES = [
  'movie',
  'movies',
  'film',
  'film-serial',
  'series',
  'cinema',
] as const;

export const BOOK_SLUG_ALIASES = [
  'book',
  'books',
  'bookpodcast',
  'book-podcast',
  'podcast',
  'podcasts',
  'literature',
] as const;

const FILM_SLUG_SET = new Set<string>(FILM_SLUG_ALIASES);
const BOOK_SLUG_SET = new Set<string>(BOOK_SLUG_ALIASES);

const FILM_CANONICAL_SLUG_PRIORITY = [
  'movies',
  'movie',
  'film',
  'film-serial',
  'series',
  'cinema',
] as const;

const BOOK_CANONICAL_SLUG_PRIORITY = [
  'bookpodcast',
  'book-podcast',
  'books',
  'book',
  'podcast',
  'podcasts',
  'literature',
] as const;

function normCategorySlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export type CategoryAliasGroup = 'film' | 'book';

export function getCategoryAliasGroup(slug: string): CategoryAliasGroup | null {
  const s = normCategorySlug(slug);
  if (FILM_SLUG_SET.has(s)) return 'film';
  if (BOOK_SLUG_SET.has(s)) return 'book';
  return null;
}

function pickCanonicalInGroup<T extends { slug: string; order?: number }>(
  candidates: T[],
  priority: readonly string[]
): T {
  const bySlug = new Map(candidates.map((c) => [normCategorySlug(c.slug), c]));
  for (const preferred of priority) {
    const hit = bySlug.get(preferred);
    if (hit) return hit;
  }
  return [...candidates].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]!;
}

/** یک دستهٔ فعال به ازای هر گروه alias (مثلاً books + bookpodcast → فقط کتاب و پادکست) */
export function dedupeActiveCategoriesByAlias<
  T extends { slug: string; name: string; order?: number },
>(categories: T[]): T[] {
  const buckets = new Map<CategoryAliasGroup, T[]>();
  const standalone: T[] = [];

  for (const cat of categories) {
    const group = getCategoryAliasGroup(cat.slug);
    if (!group) {
      standalone.push(cat);
      continue;
    }
    const bucket = buckets.get(group) ?? [];
    bucket.push(cat);
    buckets.set(group, bucket);
  }

  const merged: T[] = [...standalone];
  for (const [group, bucket] of buckets) {
    const priority =
      group === 'film' ? FILM_CANONICAL_SLUG_PRIORITY : BOOK_CANONICAL_SLUG_PRIORITY;
    merged.push(pickCanonicalInGroup(bucket, priority));
  }

  return merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function slugGroup(slug: string): readonly string[] | null {
  const s = normCategorySlug(slug);
  if (FILM_SLUG_SET.has(s)) return FILM_SLUG_ALIASES;
  if (BOOK_SLUG_SET.has(s)) return BOOK_SLUG_ALIASES;
  return null;
}

export function isSameCategorySlug(a: string, b: string): boolean {
  const x = normCategorySlug(a);
  const y = normCategorySlug(b);
  if (x === y) return true;
  if (FILM_SLUG_SET.has(x) && FILM_SLUG_SET.has(y)) return true;
  if (BOOK_SLUG_SET.has(x) && BOOK_SLUG_SET.has(y)) return true;
  return false;
}

/** همهٔ slugهای معادل برای فیلتر کاتالوگ */
export function expandCategorySlugFilter(slug: string): string[] {
  const raw = slug.trim();
  if (!raw || raw === '__none__') return [];
  const group = slugGroup(raw);
  if (!group) return [raw];
  return [...new Set([raw, normCategorySlug(raw), ...group])];
}

/** @deprecated از expandCategorySlugFilter استفاده کنید */
export function resolveCategorySlugAliases(slug: string): string[] {
  return expandCategorySlugFilter(slug);
}
