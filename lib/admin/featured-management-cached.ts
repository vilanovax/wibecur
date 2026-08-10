import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getFeaturedManagementData } from '@/lib/admin/featured-management-data';
import type { FeaturedManagementData } from '@/lib/admin/featured-management-types';
import {
  ADMIN_CACHE_TAGS,
  ADMIN_FEATURED_CACHE_SECONDS,
} from '@/lib/admin/admin-cache';

function getCrossRequestCachedFeaturedManagement() {
  return unstable_cache(
    () => getFeaturedManagementData({ includeLists: false }),
    ['admin-featured-management'],
    {
      revalidate: ADMIN_FEATURED_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.featured],
    }
  )();
}

/** Per-request dedupe + short TTL — lists omitted (lazy on wizard open) */
export const getCachedFeaturedManagementData = cache(
  (): Promise<FeaturedManagementData> => getCrossRequestCachedFeaturedManagement()
);
