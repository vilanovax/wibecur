import { unstable_cache } from 'next/cache';
import { dbQuery } from '@/lib/db';
import {
  getUsersIntelligenceData,
  type UsersIntelligenceData,
  type UsersIntelligenceQuery,
} from '@/lib/admin/users-intelligence';
import {
  ADMIN_CACHE_TAGS,
  ADMIN_USERS_CACHE_SECONDS,
} from '@/lib/admin/admin-cache';

function cacheKey(q: UsersIntelligenceQuery): string[] {
  return [
    'admin-users-intelligence',
    String(q.page),
    q.search,
    q.filter,
    q.hideBots ? 'hide-bots' : 'all-bots',
    q.sort,
    q.trash ? 'trash' : 'active',
  ];
}

async function loadUsersIntelligence(
  query: UsersIntelligenceQuery
): Promise<UsersIntelligenceData> {
  return dbQuery(() => getUsersIntelligenceData(query));
}

export function getCachedUsersIntelligenceData(
  query: UsersIntelligenceQuery
): Promise<UsersIntelligenceData> {
  const getCached = unstable_cache(
    () => loadUsersIntelligence(query),
    cacheKey(query),
    {
      revalidate: ADMIN_USERS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.users],
    }
  );
  return getCached();
}
