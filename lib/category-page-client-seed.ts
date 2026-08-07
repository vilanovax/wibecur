import type { CategoryListCard, CategoryPageData } from '@/types/category-page';

/** Minimal list stub for spotlight id compare / RQ shell (server-dedup-props). */
function slimListCard(list: CategoryListCard): CategoryListCard {
  return {
    id: list.id,
    title: list.title,
    slug: list.slug,
    saveCount: list.saveCount,
    likeCount: list.likeCount,
    itemCount: list.itemCount,
    creator: list.creator,
  };
}

/**
 * When RSC slots already render heavy sections, don't also serialize full list/item
 * arrays into the client component props.
 */
export function toCategoryClientSeed(data: CategoryPageData): CategoryPageData {
  return {
    ...data,
    trendingLists: data.trendingLists.slice(0, 1).map(slimListCard),
    viralSpotlight: data.viralSpotlight ? slimListCard(data.viralSpotlight) : null,
    newLists: [],
    trendingNow24h: [],
    topSavedThisWeek: [],
    popularAllTime: [],
    suggestedLists: [],
    mostDebatedLists: [],
    topCurators: [],
    topCuratorSpotlight: null,
    mostSavedItems: [],
    latestItems: [],
    cityBreakdown: (data.cityBreakdown ?? []).map((c) => ({
      city: c.city,
      listCount: c.listCount,
      sampleLists: [],
    })),
    filmGenres: data.filmGenres ?? [],
  };
}
