export const MOVIE_CATEGORY_SLUGS = new Set(['movie', 'film', 'movies']);

export function isMovieCategorySlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return MOVIE_CATEGORY_SLUGS.has(slug.toLowerCase());
}
