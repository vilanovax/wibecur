import type {
  CategoryInfo,
  CategoryListCard,
  CategoryMetrics,
  CategoryPageData,
} from '@/types/category-page';

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

function slimCategory(category: CategoryInfo): CategoryInfo {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    color: category.color,
    accentColor: category.accentColor ?? null,
    layoutType: category.layoutType ?? null,
  };
}

/** metrics فقط برای شمارنده‌های سبک UI کلاینت — بدون hero fields. */
function slimMetrics(metrics: CategoryMetrics): CategoryMetrics {
  return {
    totalLists: metrics.totalLists,
    totalItems: metrics.totalItems,
    weeklySaveCount: metrics.weeklySaveCount,
    viralCount: metrics.viralCount,
    genreCount: metrics.genreCount,
  };
}

/**
 * When RSC slots already render heavy sections, don't also serialize full list/item
 * arrays (یا hero/description) into the client component props.
 */
export function toCategoryClientSeed(data: CategoryPageData): CategoryPageData {
  return {
    category: slimCategory(data.category),
    metrics: slimMetrics(data.metrics),
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
