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
};

function cacheKey(q: ListsIntelligenceQuery): string[] {
  return [
    'admin-lists-intelligence',
    q.trash ? 'trash' : 'active',
    String(q.page),
    q.categoryId,
  ];
}

async function loadListsIntelligence(q: ListsIntelligenceQuery): Promise<ListsIntelligenceData> {
  return dbQuery(() =>
    getListsIntelligenceData(q.trash, {
      page: q.page,
      categoryId: q.categoryId === 'all' ? undefined : q.categoryId,
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
