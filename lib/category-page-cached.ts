import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCategoryPageData } from '@/lib/category-page-data';
import type { CategoryPageData } from '@/types/category-page';

const CACHE_SECONDS = 300;

export async function getCachedCategoryPageData(
  categoryId: string,
  categorySlug?: string | null
): Promise<CategoryPageData> {
  const getCached = unstable_cache(
    () => getCategoryPageData(prisma, categoryId, categorySlug),
    [`category-page-v2-${categoryId}`],
    { revalidate: CACHE_SECONDS, tags: [`category-${categoryId}`] }
  );
  return getCached();
}
