import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getUsersIntelligenceData } from '@/lib/admin/users-intelligence';
import type {
  UsersIntelligenceData,
  UsersIntelligenceQuery,
} from '@/lib/admin/users-types';
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

function getCrossRequestCachedUsersIntelligence(query: UsersIntelligenceQuery) {
  return unstable_cache(
    () => getUsersIntelligenceData(query),
    cacheKey(query),
    {
      revalidate: ADMIN_USERS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.users],
    }
  )();
}

/** Per-request dedupe + short TTL cross-request cache */
export const getCachedUsersIntelligenceData = cache(
  (query: UsersIntelligenceQuery): Promise<UsersIntelligenceData> =>
    getCrossRequestCachedUsersIntelligence(query)
);
