import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  CatalogNotReadyError,
  countMultiListCatalogItems,
  findDuplicateCatalogGroups,
  isCatalogClientReady,
} from '@/lib/catalog-items';
import { getSuggestionsStats } from '@/lib/admin/suggestions-stats';
import { ADMIN_LISTS_CACHE_SECONDS, ADMIN_CACHE_TAGS } from '@/lib/admin/admin-cache';

export type ContentHubStats = {
  activeLists: number;
  catalogEntities: number;
  placements: number;
  multiListCatalog: number;
  duplicateCatalogGroups: number;
  lowEngagementLists: number;
  suggestionsPending: number;
  insightLine: string;
};

export async function getContentHubStats(): Promise<ContentHubStats> {
  const catalogReady = isCatalogClientReady(prisma);

  const [
    activeLists,
    placements,
    suggestions,
    lowEngagementLists,
    catalogEntities,
    multiListCatalog,
    duplicateGroups,
  ] = await dbQuery(() =>
    Promise.all([
      prisma.lists.count({ where: { deletedAt: null, isActive: true } }),
      prisma.items.count({
        where: { lists: { deletedAt: null, isActive: true } },
      }),
      getSuggestionsStats(),
      prisma.lists.count({
        where: {
          deletedAt: null,
          isActive: true,
          saveCount: { lte: 5 },
          itemCount: { gt: 0 },
        },
      }),
      catalogReady
        ? prisma.catalog_items.count()
        : Promise.resolve(0),
      catalogReady
        ? countMultiListCatalogItems(prisma)
        : Promise.resolve(0),
      catalogReady
        ? findDuplicateCatalogGroups(prisma, { limit: 100 })
        : Promise.resolve([]),
    ])
  );

  const dupCount = duplicateGroups.length;

  const parts: string[] = [];
  if (lowEngagementLists > 0) {
    parts.push(`${lowEngagementLists.toLocaleString('fa-IR')} لیست کم‌تعامل`);
  }
  if (multiListCatalog > 0) {
    parts.push(`${multiListCatalog.toLocaleString('fa-IR')} موجودیت چندلیستی`);
  }
  if (dupCount > 0) {
    parts.push(`${dupCount.toLocaleString('fa-IR')} گروه تکراری کاتالوگ`);
  }
  if (suggestions.totalPending > 0) {
    parts.push(`${suggestions.totalPending.toLocaleString('fa-IR')} پیشنهاد در انتظار`);
  }

  return {
    activeLists,
    catalogEntities,
    placements,
    multiListCatalog,
    duplicateCatalogGroups: dupCount,
    lowEngagementLists,
    suggestionsPending: suggestions.totalPending,
    insightLine: parts.length > 0 ? parts.join(' · ') : 'همه چیز مرتب به نظر می‌رسد',
  };
}

/**
 * نسخهٔ کش‌شده — getContentHubStats روی هر لود صفحهٔ لیست‌ها ~۷ کوئری (شامل
 * count کل‌جدولِ catalog_items و اسکن گروه‌های تکراری) می‌زد و کشِ دادهٔ لیست‌ها
 * را خنثی می‌کرد. با tag `admin-lists` پس از mutation ابطال می‌شود.
 */
export const getCachedContentHubStats = unstable_cache(
  getContentHubStats,
  ['admin-content-hub-stats'],
  { revalidate: ADMIN_LISTS_CACHE_SECONDS, tags: [ADMIN_CACHE_TAGS.lists] }
);

export { CatalogNotReadyError };
