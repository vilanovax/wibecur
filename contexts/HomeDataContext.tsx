'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FeaturedListData, HomeData, HomeListData } from '@/types/home-data';
import { EMPTY_HOME_DATA as emptyHomeData } from '@/types/home-data';

export type { HomeListData, FeaturedListData, RisingListData, HomeData } from '@/types/home-data';

interface HomeDataContextValue {
  data: HomeData | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => void;
}

const HomeDataContext = createContext<HomeDataContextValue | null>(null);

function mapApiItem(l: {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  saveCount?: number;
  itemCount?: number;
  likes?: number;
  badge?: string;
  categories?: { id: string; name: string; slug: string; icon: string };
}): HomeListData {
  return {
    id: l.id,
    title: l.title,
    slug: l.slug,
    description: l.description ?? '',
    coverImage: l.coverImage ?? '',
    saveCount: l.saveCount ?? 0,
    itemCount: l.itemCount ?? 0,
    likes: l.likes ?? 0,
    badge: (l.badge?.toLowerCase() as 'trending' | 'new' | 'featured') ?? undefined,
    categories: l.categories,
  };
}

async function fetchHomeData(): Promise<HomeData> {
  const res = await fetch('/api/lists/home');
  const json = await res.json();
  if (!json.success || !json.data) return emptyHomeData;
  const d = json.data;
  const featured = d.featured
    ? { ...mapApiItem(d.featured), creator: d.featured.creator ?? null } as FeaturedListData
    : null;
  const rising = Array.isArray(d.rising)
    ? d.rising.map((r: { isFastRising?: boolean } & typeof d.rising[0]) => ({
        ...mapApiItem(r),
        isFastRising: r.isFastRising,
      }))
    : [];

  return {
    featured,
    featuredSlotId: d.featuredSlotId ?? null,
    trending: Array.isArray(d.trending) ? d.trending.map(mapApiItem) : [],
    rising,
    recommendations: Array.isArray(d.recommendations) ? d.recommendations.map(mapApiItem) : [],
  };
}

export function HomeDataProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: HomeData | null;
}) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['home', 'lists'],
    queryFn: fetchHomeData,
    initialData: initialData ?? undefined,
    staleTime: 5 * 60 * 1000,
  });

  const value: HomeDataContextValue = {
    data: data ?? null,
    isLoading: initialData ? false : isLoading,
    isRefetching: isFetching && !isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  };

  return (
    <HomeDataContext.Provider value={value}>
      {children}
    </HomeDataContext.Provider>
  );
}

export function useHomeData() {
  const ctx = useContext(HomeDataContext);
  if (!ctx) {
    throw new Error('useHomeData must be used within HomeDataProvider');
  }
  return ctx;
}
