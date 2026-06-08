import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  countMultiListCatalogItems,
  findDuplicateCatalogGroups,
  getCatalogCategoryFilters,
  getCatalogListFilters,
  listCatalogItems,
} from '@/lib/catalog-items';

export type CatalogPageMode = 'browse' | 'place' | 'create';

export type CatalogPlacementList = {
  id: string;
  title: string;
  icon: string | null;
  categorySlug: string | null;
};

export type CatalogPageData = {
  initialTab: 'browse' | 'duplicates';
  initialMode: CatalogPageMode;
  placementList: CatalogPlacementList | null;
  initialRows: Awaited<ReturnType<typeof listCatalogItems>>['rows'];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialQuery: string;
  initialCategory: string;
  initialListId: string;
  initialMultiListOnly: boolean;
  initialMultiListCount: number;
  initialCategoryFilters: Awaited<ReturnType<typeof getCatalogCategoryFilters>>;
  initialListFilters: Awaited<ReturnType<typeof getCatalogListFilters>>;
  initialDuplicateGroups: Awaited<ReturnType<typeof findDuplicateCatalogGroups>>;
  lists: { id: string; title: string; icon: string | null }[];
};

export async function loadCatalogPageData(params: {
  page?: string;
  q?: string;
  tab?: string;
  category?: string;
  listId?: string;
  multiList?: string;
  mode?: string;
}): Promise<CatalogPageData> {
  const page = parseInt(params.page || '1', 10);
  const q = params.q?.trim() || '';
  const tab = params.tab === 'duplicates' ? 'duplicates' : 'browse';
  const category = params.category?.trim() || '';
  const rawListId = params.listId?.trim() || '';
  const initialMode: CatalogPageMode =
    params.mode === 'place' ? 'place' : params.mode === 'create' ? 'create' : 'browse';
  const browseListId = initialMode === 'place' ? '' : rawListId;
  const multiListOnly = params.multiList === '1';

  let placementList: CatalogPlacementList | null = null;
  if ((initialMode === 'place' || initialMode === 'create') && rawListId) {
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: rawListId },
        select: {
          id: true,
          title: true,
          categories: { select: { icon: true, slug: true } },
        },
      })
    );
    if (list) {
      placementList = {
        id: list.id,
        title: list.title,
        icon: list.categories?.icon ?? null,
        categorySlug: list.categories?.slug ?? null,
      };
    }
  }

  const [{ rows, total }, duplicateGroups, categoryFilters, listFilters, multiListCount] =
    await dbQuery(() =>
      Promise.all([
        listCatalogItems(prisma, {
          page,
          perPage: 24,
          q: q || undefined,
          categorySlug: category || undefined,
          listId: browseListId || undefined,
          placementListId:
            initialMode === 'place' && rawListId ? rawListId : undefined,
          multiListOnly,
        }).then((r) => ({
          ...r,
          totalPages: Math.ceil(r.total / 24) || 1,
        })),
        tab === 'duplicates'
          ? findDuplicateCatalogGroups(prisma, { limit: 50 })
          : Promise.resolve([]),
        getCatalogCategoryFilters(prisma),
        getCatalogListFilters(prisma, { categorySlug: category || undefined }),
        countMultiListCatalogItems(prisma, {
          categorySlug: category || undefined,
          listId: browseListId || undefined,
        }),
      ])
    );

  const totalPages = Math.ceil(total / 24) || 1;

  const allLists = await dbQuery(() =>
    prisma.lists.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        categories: { select: { icon: true } },
      },
    })
  );

  return {
    initialTab: tab,
    initialMode,
    placementList,
    initialRows: rows,
    initialTotal: total,
    initialPage: page,
    initialTotalPages: totalPages,
    initialQuery: q,
    initialCategory: category,
    initialListId: browseListId,
    initialMultiListOnly: multiListOnly,
    initialMultiListCount: multiListCount,
    initialCategoryFilters: categoryFilters,
    initialListFilters: listFilters,
    initialDuplicateGroups: duplicateGroups,
    lists: allLists.map((l) => ({
      id: l.id,
      title: l.title,
      icon: l.categories?.icon ?? null,
    })),
  };
}
