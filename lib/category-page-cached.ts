import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCategoryPageData } from '@/lib/category-page-data';
import type { CategoryPageData } from '@/types/category-page';

const CACHE_SECONDS = 300;

export async function getCachedCategoryPageData(categoryId: string): Promise<CategoryPageData> {
  const getCached = unstable_cache(
    () => getCategoryPageData(prisma, categoryId),
    [`category-page-${categoryId}`],
    { revalidate: CACHE_SECONDS, tags: [`category-${categoryId}`] }
  );
  return getCached();
}
