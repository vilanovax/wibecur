/** شِل یکسان صفحه دسته — موبایل + دسکتاپ */
export const CATEGORY_PAGE_SHELL = 'mx-auto w-full max-w-[1024px] px-4 pb-6 lg:px-6 lg:pb-8';

export const CATEGORY_SECTION = 'py-5 lg:py-6';

export function isFilmCategorySlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return (
    s.includes('movie') ||
    s.includes('film') ||
    s === 'series' ||
    s.includes('cinema') ||
    s.includes('serial')
  );
}

export function isLocationCategorySlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return (
    s.includes('cafe') ||
    s.includes('restaurant') ||
    s.includes('food') ||
    s.includes('رستوران') ||
    s.includes('کافه')
  );
}
