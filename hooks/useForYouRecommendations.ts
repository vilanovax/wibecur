'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import type { HomeListData } from '@/types/home-data';

export type ForYouList = HomeListData & {
  reasonType?: 'similar' | 'category' | 'popular';
};

interface ForYouResponse {
  lists: ForYouList[];
  isPersonalized: boolean;
}

export function forYouQueryKey(userId?: string | null) {
  return ['home', 'for-you', userId ?? 'guest'] as const;
}

export async function fetchForYouRecommendations(): Promise<ForYouResponse> {
  const res = await fetch('/api/lists/home/for-you');
  const json = await res.json();
  if (!json.success || !json.data) {
    return { lists: [], isPersonalized: false };
  }
  const lists = (json.data.lists ?? []).map(
    (l: {
      id: string;
      title: string;
      slug: string;
      description?: string;
      coverImage?: string;
      saveCount?: number;
      itemCount?: number;
      likes?: number;
      categories?: ForYouList['categories'];
      reasonType?: ForYouList['reasonType'];
    }) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description ?? '',
      coverImage: l.coverImage ?? '',
      saveCount: l.saveCount ?? 0,
      itemCount: l.itemCount ?? 0,
      likes: l.likes ?? 0,
      categories: l.categories,
      reasonType: l.reasonType,
    })
  );
  return {
    lists,
    isPersonalized: Boolean(json.data.isPersonalized),
  };
}

export function useForYouRecommendations() {
  const { data: session, status } = useSession();
  const query = useQuery({
    queryKey: forYouQueryKey(session?.user?.id),
    queryFn: fetchForYouRecommendations,
    staleTime: 2 * 60 * 1000,
    enabled: status !== 'loading',
  });

  return {
    lists: query.data?.lists ?? [],
    isPersonalized: query.data?.isPersonalized ?? false,
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
    refetch: query.refetch,
  };
}

export function getForYouReasonLabel(
  list: ForYouList,
  isPersonalized: boolean
): string | null {
  if (isPersonalized) {
    if (list.reasonType === 'similar') {
      return '🔗 مشابه ذخیره‌های تو';
    }
    if (list.reasonType === 'category' && list.categories?.name) {
      const icon = list.categories.icon ? `${list.categories.icon} ` : '';
      return `${icon}پیشنهاد در ${list.categories.name}`;
    }
  }
  if (list.categories?.name) {
    return `${list.categories.icon ?? ''} ${list.categories.name}`.trim();
  }
  return null;
}
