/**
 * Server loader for /lists — aligned with client default browse mode (trending).
 * Perf: correct sort on SSR avoids immediate client refetch of 120 rows.
 */

import { cache } from 'react';
import { fetchListsBrowse, LISTS_SSR_LIMIT } from '@/lib/lists-browse';
import { fetchActiveCategoryIndex } from '@/lib/category-menu';
import { getCachedGlobalTrending } from '@/lib/trending/cached';
import type { ListsBrowseList, ListsBrowseSort } from '@/lib/lists-browse-shared';

export type ListsBrowseMode = 'trending' | 'newest' | 'popular' | 'saved';

export type ListsPageCategory = {
  id: string;
  name: string;
  slug: string | null;
  icon: string | null;
  color: string | null;
  order: number | null;
  isActive: boolean;
};

export type ListsPageBootstrap = {
  lists: ListsBrowseList[];
  totalListCount: number;
  categories: ListsPageCategory[];
  initialCategory?: string;
  initialSearch?: string;
  initialMode: ListsBrowseMode;
  initialSort: ListsBrowseSort;
  initialCategoryId: string | null;
  initialTrendingIds: string[];
};

function parseBrowseMode(raw?: string): ListsBrowseMode {
  if (raw === 'newest' || raw === 'popular' || raw === 'saved' || raw === 'trending') {
    return raw;
  }
  return 'trending';
}

export function browseModeToSort(mode: ListsBrowseMode): ListsBrowseSort {
  switch (mode) {
    case 'newest':
      return 'newest';
    case 'popular':
    case 'saved':
      return 'most_saved';
    case 'trending':
    default:
      return 'rising';
  }
}

function resolveCategoryId(
  param: string | undefined,
  categories: ListsPageCategory[]
): string | null {
  if (!param) return null;
  const byId = categories.find((c) => c.id === param);
  if (byId) return byId.id;
  const bySlug = categories.find((c) => c.slug === param);
  return bySlug?.id ?? null;
}

function mapCategories(
  categoryRows: Awaited<ReturnType<typeof fetchActiveCategoryIndex>>
): ListsPageCategory[] {
  return categoryRows.map((c, index) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    order: c.order ?? index,
    isActive: true,
  }));
}

async function loadListsPageBootstrap(params: {
  category?: string;
  tag?: string;
  q?: string;
  mode?: string;
}): Promise<ListsPageBootstrap> {
  const initialMode = parseBrowseMode(params.mode);
  const initialSort = browseModeToSort(initialMode);
  const needsTrendingIds = initialMode === 'trending';
  const trendingPromise = needsTrendingIds
    ? getCachedGlobalTrending(24)
    : Promise.resolve([] as Awaited<ReturnType<typeof getCachedGlobalTrending>>);

  // No category filter → all three queries in parallel (async-parallel)
  if (!params.category) {
    const [categoryRows, browseResult, trendingRows] = await Promise.all([
      fetchActiveCategoryIndex(),
      fetchListsBrowse({
        offset: 0,
        limit: LISTS_SSR_LIMIT,
        sort: initialSort,
        categoryId: null,
      }),
      trendingPromise,
    ]);

    return {
      lists: browseResult.lists,
      totalListCount: browseResult.pagination.total,
      categories: mapCategories(categoryRows),
      initialCategory: params.category,
      initialSearch: params.q || params.tag,
      initialMode,
      initialSort,
      initialCategoryId: null,
      initialTrendingIds: trendingRows.map((row) => row.listId).filter(Boolean),
    };
  }

  // Category slug/id must resolve before browse where
  const categoryRows = await fetchActiveCategoryIndex();
  const categories = mapCategories(categoryRows);
  const initialCategoryId = resolveCategoryId(params.category, categories);

  const [browseResult, trendingRows] = await Promise.all([
    fetchListsBrowse({
      offset: 0,
      limit: LISTS_SSR_LIMIT,
      sort: initialSort,
      categoryId: initialCategoryId,
    }),
    trendingPromise,
  ]);

  return {
    lists: browseResult.lists,
    totalListCount: browseResult.pagination.total,
    categories,
    initialCategory: params.category,
    initialSearch: params.q || params.tag,
    initialMode,
    initialSort,
    initialCategoryId,
    initialTrendingIds: trendingRows.map((row) => row.listId).filter(Boolean),
  };
}

/** Per-request dedupe for generateMetadata / page if both call */
export const getListsPageBootstrap = cache(loadListsPageBootstrap);
