export type ListsViewMode = 'grid' | 'compact';

export const LISTS_VIEW_MODE_MOBILE_KEY = 'listsPage_viewMode_mobile';
export const LISTS_VIEW_MODE_DESKTOP_KEY = 'listsPage_viewMode_desktop';

/** پیش‌نمایش سکشن دسته — موبایل با CSS مخفی می‌شود، دسکتاپ از SSR همان تعداد را دارد. */
export const LISTS_SECTION_PREVIEW_MOBILE = 4;
export const LISTS_SECTION_PREVIEW_DESKTOP = 8;

export function defaultListsViewMode(_isDesktop: boolean): ListsViewMode {
  return 'grid';
}

export function readStoredListsViewMode(isDesktop: boolean): ListsViewMode {
  if (typeof window === 'undefined') return defaultListsViewMode(isDesktop);
  const key = isDesktop ? LISTS_VIEW_MODE_DESKTOP_KEY : LISTS_VIEW_MODE_MOBILE_KEY;
  const saved = localStorage.getItem(key);
  if (saved === 'grid' || saved === 'compact') return saved;
  return defaultListsViewMode(isDesktop);
}

/**
 * Variant از viewMode — نه از JS breakpoint.
 * کارت grid خودش با lg: واکنش‌گراست؛ سوئیچ mini→grid بعد از hydrate منبع CLS بود.
 */
export function resolveListCardVariant(viewMode: ListsViewMode): 'grid' | 'compact' {
  return viewMode === 'compact' ? 'compact' : 'grid';
}

/** گرید واکنش‌گرا با CSS — بدون isDesktop تا SSR و کلاینت یکی باشند */
export function listsResultsGridClass(viewMode: ListsViewMode): string {
  if (viewMode === 'compact') {
    return 'grid grid-cols-1 gap-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:gap-3';
  }
  return 'grid grid-cols-2 gap-2 lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] lg:gap-3 xl:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] xl:gap-4';
}
