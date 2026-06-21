import type { HomeData, HomeListData, RisingListData } from '@/types/home-data';
import { padHomeFeedLists } from '@/lib/home-feed-grid';

export function selectHomeTrendingLists(
  data: Pick<HomeData, 'trending' | 'featured'>,
  options?: { limit?: number; excludeFeatured?: boolean }
): HomeListData[] {
  const limit = options?.limit ?? 8;
  const featuredId = options?.excludeFeatured !== false ? data.featured?.id : undefined;
  const trending = featuredId
    ? data.trending.filter((list) => list.id !== featuredId)
    : data.trending;
  return trending.slice(0, limit);
}

export function selectHomeTrendingDesktopLists(
  data: Pick<HomeData, 'trending' | 'rising' | 'featured'>,
  options?: { limit?: number }
): HomeListData[] {
  const limit = options?.limit ?? 8;
  const featuredId = data.featured?.id;
  const excludeIds = featuredId ? new Set([featuredId]) : new Set<string>();
  const trending = data.trending.filter((list) => !excludeIds.has(list.id));
  return padHomeFeedLists(trending, data.rising, limit, excludeIds);
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
  return featured.bannerImage ?? featured.coverImage ?? null;
}
