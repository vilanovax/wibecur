'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

export type HomeBookmarkList = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  saveCount?: number;
  categories?: { slug?: string; icon?: string | null } | null;
};

export function homeBookmarksQueryKey(userId?: string | null) {
  return ['user', userId ?? 'guest', 'home-bookmarks'] as const;
}

/** سقف برای وضعیت نشانک روی کارت‌ها؛ UI ذخیره‌ها معمولاً ۸ تای اول را نشان می‌دهد */
export const HOME_BOOKMARKS_FETCH_LIMIT = 100;

export async function fetchHomeBookmarks(
  limit = HOME_BOOKMARKS_FETCH_LIMIT
): Promise<HomeBookmarkList[]> {
  const res = await fetch(`/api/user/bookmarks?page=1&limit=${limit}`);
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  const items = json.data?.bookmarks ?? [];
  return items.map((b: { list: HomeBookmarkList }) => b.list).filter(Boolean);
}

export function useHomeBookmarks(options?: { enabled?: boolean }) {
  const { data: session, status } = useSession();
  const enabled =
    (options?.enabled ?? true) && status !== 'loading' && !!session?.user?.id;

  return useQuery({
    queryKey: homeBookmarksQueryKey(session?.user?.id),
    queryFn: () => fetchHomeBookmarks(HOME_BOOKMARKS_FETCH_LIMIT),
    enabled,
    staleTime: 60_000,
  });
}
