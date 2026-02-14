'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';

export interface HomeListData {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  saveCount: number;
  itemCount: number;
  likes: number;
  badge?: 'trending' | 'new' | 'featured';
  categories?: { id: string; name: string; slug: string; icon: string }[];
}

export interface FeaturedListData extends HomeListData {
  badge?: 'trending' | 'new' | 'featured';
}

export interface HomeData {
  featured: FeaturedListData | null;
  trending: HomeListData[];
  recommendations: HomeListData[];
}

interface HomeDataContextValue {
  data: HomeData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const initialState: HomeData = {
  featured: null,
  trending: [],
  recommendations: [],
};

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
  };
}

async function fetchHomeData(): Promise<HomeData> {
  const res = await fetch('/api/lists/home');
  const json = await res.json();
  if (!json.success || !json.data) return initialState;
  const d = json.data;
  return {
    featured: d.featured ? mapApiItem({ ...d.featured }) as FeaturedListData : null,
    trending: Array.isArray(d.trending) ? d.trending.map(mapApiItem) : [],
    recommendations: Array.isArray(d.recommendations) ? d.recommendations.map(mapApiItem) : [],
  };
}

export function HomeDataProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['home', 'lists'],
    queryFn: fetchHomeData,
    staleTime: 5 * 60 * 1000, // 5 min - API has Cache-Control 300
  });

  const value: HomeDataContextValue = {
    data: data ?? null,
    isLoading,
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
