import type { CuratedList } from '@/types/curated';
import type { ExplorePayload } from '@/lib/curated/explore-data';

/**
 * Slim RSC → client seed (server-dedup-props).
 * Trending lane is already SSR; keep enough lists for for-you / surprise only.
 */
function slimExploreList(list: CuratedList): CuratedList {
  return {
    id: list.id,
    slug: list.slug,
    title: list.title,
    subtitle: null,
    categoryId: list.categoryId,
    category: list.category
      ? {
          name: list.category.name,
          icon: list.category.icon,
          slug: list.category.slug,
        }
      : null,
    coverUrl: list.coverUrl,
    itemsCount: list.itemsCount,
    savesCount: list.savesCount,
    likesCount: list.likesCount,
    badges: list.badges,
    creator: {
      id: list.creator.id,
      name: list.creator.name,
      username: list.creator.username,
      avatarUrl: list.creator.avatarUrl,
      levelTitle: list.creator.levelTitle,
      badges: list.creator.badges,
    },
    createdAt: list.createdAt,
    trendScore: list.trendScore,
    weeklyVelocity: list.weeklyVelocity,
    tags: list.tags?.slice(0, 8),
  };
}

export function toExploreClientSeed(data: ExplorePayload): ExplorePayload {
  return {
    categories: data.categories,
    preferredKeywordIds: data.preferredKeywordIds,
    preferredCategoryIds: data.preferredCategoryIds,
    bookmarkedListIds: data.bookmarkedListIds,
    lists: data.lists.map(slimExploreList),
  };
}
