'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export type ItemViewerSavedState = {
  savedInPrivateList: boolean;
  savedInPublicList: boolean;
  lists: Array<{ id: string; title: string; isPublic: boolean }>;
};

export type ItemViewerState = {
  like: { isLiked: boolean; likeCount: number };
  saved: ItemViewerSavedState;
  profilePick: {
    isPicked: boolean;
    pickId: string | null;
    canPick: boolean;
    catalogItemId: string | null;
    maxPerCategory: number;
  };
};

export const itemViewerStateQueryKey = (itemId: string) =>
  ['item-viewer-state', itemId] as const;

async function fetchItemViewerState(itemId: string): Promise<ItemViewerState> {
  const res = await fetch(`/api/items/${itemId}/viewer-state`);
  const json = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error('viewer-state fetch failed');
  }
  return json.data as ItemViewerState;
}

type UseItemViewerStateOptions = {
  enabled?: boolean;
  initialLikeCount?: number;
};

export function useItemViewerState(
  itemId: string,
  options: UseItemViewerStateOptions = {}
): UseQueryResult<ItemViewerState, Error> {
  const { status } = useSession();
  const { enabled = true, initialLikeCount = 0 } = options;

  return useQuery({
    queryKey: itemViewerStateQueryKey(itemId),
    queryFn: () => fetchItemViewerState(itemId),
    // Only authenticated users need like/save/pick state from API
    enabled: enabled && status === 'authenticated',
    staleTime: 60_000,
    retry: false,
    placeholderData: (prev) =>
      prev ?? {
        like: { isLiked: false, likeCount: initialLikeCount },
        saved: { savedInPrivateList: false, savedInPublicList: false, lists: [] },
        profilePick: {
          isPicked: false,
          pickId: null,
          canPick: false,
          catalogItemId: null,
          maxPerCategory: 5,
        },
      },
  });
}

export function invalidateItemViewerState(
  queryClient: { invalidateQueries: (opts: { queryKey: readonly string[] }) => void },
  itemId: string
) {
  queryClient.invalidateQueries({ queryKey: itemViewerStateQueryKey(itemId) });
}
