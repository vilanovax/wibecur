'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

type InteractionCount = {
  total: number;
  bookmarks: number;
  likes: number;
};

async function fetchInteractionCount(): Promise<InteractionCount> {
  const res = await fetch('/api/user/interaction-count');
  const json = await res.json();
  if (!json.success || !json.data) {
    return { total: 0, bookmarks: 0, likes: 0 };
  }
  return json.data;
}

export function useHomeUserState() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const interactionQuery = useQuery({
    queryKey: ['user', 'interaction-count', userId ?? 'guest'],
    queryFn: fetchInteractionCount,
    enabled: status !== 'loading' && !!userId,
    staleTime: 60_000,
  });

  const isGuest = status !== 'loading' && !userId;
  const isLoggedIn = !!userId;
  const bookmarks = userId ? (interactionQuery.data?.bookmarks ?? 0) : 0;
  const hasSaves = bookmarks > 0;
  const isNewUser = !hasSaves;
  const isLoading =
    status === 'loading' || (!!userId && interactionQuery.isLoading && !interactionQuery.data);

  return {
    isGuest,
    isLoggedIn,
    hasSaves,
    isNewUser,
    isLoading,
    bookmarkCount: bookmarks,
  };
}
