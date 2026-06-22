export type ListsViewMode = 'grid' | 'compact';

export const LISTS_VIEW_MODE_MOBILE_KEY = 'listsPage_viewMode_mobile';
export const LISTS_VIEW_MODE_DESKTOP_KEY = 'listsPage_viewMode_desktop';

export function defaultListsViewMode(isDesktop: boolean): ListsViewMode {
  return isDesktop ? 'grid' : 'compact';
}

export function readStoredListsViewMode(isDesktop: boolean): ListsViewMode {
  if (typeof window === 'undefined') return defaultListsViewMode(isDesktop);
  const key = isDesktop ? LISTS_VIEW_MODE_DESKTOP_KEY : LISTS_VIEW_MODE_MOBILE_KEY;
  const saved = localStorage.getItem(key);
  if (saved === 'grid' || saved === 'compact') return saved;
  return defaultListsViewMode(isDesktop);
}

export function resolveListCardVariant(
  viewMode: ListsViewMode,
  isDesktop: boolean
): 'grid' | 'compact' | 'mini' {
  if (viewMode === 'compact') return 'compact';
  return isDesktop ? 'grid' : 'mini';
}

/** گرید واکنش‌گرا — بدون سلول خالی در RTL وقتی آیتم کم است */
export function listsResultsGridClass(viewMode: ListsViewMode, isDesktop: boolean): string {
  if (viewMode === 'compact') {
    return 'grid grid-cols-1 gap-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:gap-3';
  }
  if (!isDesktop) {
    return 'grid grid-cols-2 gap-2';
  }
  return 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 xl:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] xl:gap-4';
}
