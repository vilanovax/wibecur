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

function normCategorySlug(slug: string): string {
  return slug.trim().toLowerCase();
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
