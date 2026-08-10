import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import {
  getListsIntelligenceData,
  type ListsIntelligenceData,
} from '@/lib/admin/lists-intelligence';
import {
  ADMIN_CACHE_TAGS,
  ADMIN_LISTS_CACHE_SECONDS,
} from '@/lib/admin/admin-cache';

export type ListsIntelligenceQuery = {
  trash: boolean;
  page: number;
  categoryId: string;
  q?: string;
};

function cacheKey(query: ListsIntelligenceQuery): string[] {
  return [
    'admin-lists-intelligence',
    query.trash ? 'trash' : 'active',
    String(query.page),
    query.categoryId,
    query.q?.trim() || '',
  ];
}

async function loadListsIntelligence(
  query: ListsIntelligenceQuery
): Promise<ListsIntelligenceData> {
  return getListsIntelligenceData(query.trash, {
    page: query.page,
    categoryId: query.categoryId === 'all' ? undefined : query.categoryId,
    q: query.q,
  });
}

function getCrossRequestCachedListsIntelligence(query: ListsIntelligenceQuery) {
  return unstable_cache(
    () => loadListsIntelligence(query),
    cacheKey(query),
    {
      revalidate: ADMIN_LISTS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.lists],
    }
  )();
}

/** Per-request dedupe (server-cache-react) + short TTL */
export const getCachedListsIntelligenceData = cache(
  (query: ListsIntelligenceQuery) =>
    getCrossRequestCachedListsIntelligence(query)
);
