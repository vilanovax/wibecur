'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import type { HomeListData } from '@/types/home-data';
import { useHomeOnboardingInterests } from '@/hooks/useHomeOnboardingInterests';

/** هویت پایدار برای حالت خالی — جلوگیری از تغییر identity آرایه در هر render. */
const EMPTY_LISTS: ForYouList[] = [];

export type ForYouList = HomeListData & {
  reasonType?: 'similar' | 'category' | 'popular';
};

interface ForYouResponse {
  lists: ForYouList[];
  isPersonalized: boolean;
}

export function forYouQueryKey(userId?: string | null, interests?: string[]) {
  const interestKey = interests?.length ? interests.slice().sort().join(',') : '';
  return ['home', 'for-you', userId ?? 'guest', interestKey] as const;
}

export async function fetchForYouRecommendations(
  interests: string[] = []
): Promise<ForYouResponse> {
  const params = new URLSearchParams();
  if (interests.length > 0) {
    params.set('interests', interests.slice(0, 3).join(','));
  }
  const qs = params.toString();
  const res = await fetch(`/api/lists/home/for-you${qs ? `?${qs}` : ''}`);
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
      creator?: ForYouList['creator'];
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
      creator: l.creator ?? null,
    })
  );
  return {
    lists,
    isPersonalized: Boolean(json.data.isPersonalized),
  };
}

export function useForYouRecommendations(options?: { enabled?: boolean }) {
  const { data: session, status } = useSession();
  const { interests, hydrated } = useHomeOnboardingInterests();
  const fetchEnabled = options?.enabled ?? true;
  const query = useQuery({
    queryKey: forYouQueryKey(session?.user?.id, interests),
    queryFn: () => fetchForYouRecommendations(interests),
    staleTime: 2 * 60 * 1000,
    enabled: fetchEnabled && status !== 'loading' && hydrated,
  });

  return useMemo(
    () => ({
      lists: query.data?.lists ?? EMPTY_LISTS,
      isPersonalized: query.data?.isPersonalized ?? false,
      isLoading: query.isLoading,
      isRefetching: query.isFetching && !query.isLoading,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isFetching, query.refetch]
  );
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
