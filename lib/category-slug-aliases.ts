export const FILM_SLUG_ALIASES = ['movie', 'movies', 'film', 'film-serial', 'series', 'cinema'] as const;
export const BOOK_SLUG_ALIASES = ['book', 'books', 'podcast', 'podcasts'] as const;

const FILM_SLUG_SET = new Set<string>(FILM_SLUG_ALIASES);
const BOOK_SLUG_SET = new Set<string>(BOOK_SLUG_ALIASES);

export function isSameCategorySlug(a: string, b: string): boolean {
  if (a === b) return true;
  if (FILM_SLUG_SET.has(a) && FILM_SLUG_SET.has(b)) return true;
  if (BOOK_SLUG_SET.has(a) && BOOK_SLUG_SET.has(b)) return true;
  return false;
}

/** @deprecated از lib/category-slug-aliases استفاده کنید */
export function resolveCategorySlugAliases(slug: string): string[] {
  if (FILM_SLUG_SET.has(slug)) return [...FILM_SLUG_ALIASES];
  if (BOOK_SLUG_SET.has(slug)) return [...BOOK_SLUG_ALIASES];
  return [];
}
