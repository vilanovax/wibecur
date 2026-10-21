import type { HomeData, HomeListData, RisingListData } from '@/types/home-data';
import { padHomeFeedLists } from '@/lib/home-feed-grid';
import { dedupeListsById } from '@/lib/dedupe-lists';

export function selectHomeTrendingLists(
  data: Pick<HomeData, 'trending' | 'featured'>,
  options?: { limit?: number; excludeFeatured?: boolean }
): HomeListData[] {
  const limit = options?.limit ?? 8;
  const featuredId = options?.excludeFeatured !== false ? data.featured?.id : undefined;
  const trending = dedupeListsById(
    featuredId ? data.trending.filter((list) => list.id !== featuredId) : data.trending
  );
  return trending.slice(0, limit);
}

export function selectHomeTrendingDesktopLists(
  data: Pick<HomeData, 'trending' | 'rising' | 'featured'>,
  options?: { limit?: number }
): HomeListData[] {
  const limit = options?.limit ?? 8;
  const featuredId = data.featured?.id;
  const excludeIds = featuredId ? new Set([featuredId]) : new Set<string>();
  const trending = dedupeListsById(
    data.trending.filter((list) => !excludeIds.has(list.id))
  );
  return padHomeFeedLists(trending, dedupeListsById(data.rising), limit, excludeIds);
}

/**
 * ردیف «برای تو»: اول لیست‌هایی که در هیرو و ترند نیستند.
 * اگر پیشنهادها همان ترند باشند، سه تای انتهای همان مجموعه می‌ماند
 * تا ردیف خالی نشود. اگر هیچ پیشنهادی نباشد، ردیف ساخته نمی‌شود.
 */
export function selectForYouHomeLists<T extends { id: string }>(input: {
  recommendations: T[];
  trending: { id: string }[];
  featuredId?: string | null;
  rising?: T[];
  limit?: number;
}): { pool: T[]; mobile: T[]; usedRisingOnly: boolean } {
  const featuredId = input.featuredId ?? undefined;
  const onScreen = new Set(
    selectHomeTrendingLists(
      {
        trending: input.trending as HomeListData[],
        featured: featuredId
          ? ({ id: featuredId } as HomeData['featured'])
          : null,
      },
      { limit: 6, excludeFeatured: true },
    ).map((list) => list.id),
  );
  if (featuredId) onScreen.add(featuredId);

  const fromApi = input.recommendations.filter((list) => !onScreen.has(list.id));
  const apiIds = new Set(fromApi.map((list) => list.id));
  const fromRising = (input.rising ?? []).filter(
    (list) => !onScreen.has(list.id) && !apiIds.has(list.id),
  );
  const limit = input.limit ?? 8;
  let pool = dedupeListsById([...fromApi, ...fromRising]).slice(0, limit);
  const usedRisingOnly = fromApi.length === 0 && pool.length > 0;

  if (pool.length === 0) {
    pool = dedupeListsById(
      input.recommendations.filter((list) => list.id !== featuredId),
    ).slice(-3);
  }

  return { pool, mobile: pool.slice(0, 3), usedRisingOnly };
}

export function selectHomeRisingLists(
  data: Pick<HomeData, 'rising'>,
  options?: { limit?: number }
): RisingListData[] {
  return data.rising.slice(0, options?.limit ?? 8);
}

export function selectHomeLcpImageUrl(data: Pick<HomeData, 'featured'>): string | null {
  const featured = data.featured;
  if (!featured) return null;
  return (
    featured.bannerImage ??
    featured.horizontalImage ??
    featured.coverImage ??
    null
  );
}
