/** برچسب‌های فارسی برای UI ادمین — بدون نمایش کلیدهای فنی */

const CATEGORY_LABELS: Record<string, string> = {
  movie: 'فیلم',
  movies: 'فیلم',
  film: 'فیلم',
  book: 'کتاب',
  books: 'کتاب',
  cafe: 'کافه',
  restaurant: 'رستوران',
  podcast: 'پادکست',
  travel: 'سفر',
  general: 'عمومی',
};

export function catalogCategoryLabel(slug: string | null | undefined): string {
  if (!slug) return 'بدون دسته';
  return CATEGORY_LABELS[slug] ?? slug;
}

/** برای ادمین پیشرفته — در tooltip یا حالت توسعه */
export function formatExternalKeyHint(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('imdb:')) return `IMDb · ${key.slice(5)}`;
  if (key.startsWith('tmdb:')) return `TMDb · ${key.slice(5)}`;
  if (key.startsWith('isbn:')) return `ISBN · ${key.slice(5)}`;
  if (key.startsWith('title:')) return 'شناسهٔ عنوان';
  return null;
}
