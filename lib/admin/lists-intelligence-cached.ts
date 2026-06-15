import { unstable_cache } from 'next/cache';
import { dbQuery } from '@/lib/db';
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

async function loadListsIntelligence(query: ListsIntelligenceQuery): Promise<ListsIntelligenceData> {
  return dbQuery(() =>
    getListsIntelligenceData(query.trash, {
      page: query.page,
      categoryId: query.categoryId === 'all' ? undefined : query.categoryId,
      q: query.q,
    })
  );
}

export function getCachedListsIntelligenceData(
  query: ListsIntelligenceQuery
): Promise<ListsIntelligenceData> {
  const getCached = unstable_cache(
    () => loadListsIntelligence(query),
    cacheKey(query),
    {
      revalidate: ADMIN_LISTS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.lists],
    }
  );
  return getCached();
}
