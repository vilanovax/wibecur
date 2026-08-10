import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCachedListsIntelligenceData } from '@/lib/admin/lists-intelligence-cached';
import { getCachedContentHubStats } from '@/lib/admin/content-hub-stats';
import { loadCatalogPageData } from '@/lib/admin/catalog-page-data';
import { isCatalogClientReady } from '@/lib/catalog-items';
import AdminDatabaseUnavailable from '@/components/admin/shared/AdminDatabaseUnavailable';
import ContentHubClient, { type ContentHubView } from './ContentHubClient';
import { loadListDescriptionsPageData } from '@/lib/admin/list-descriptions-data';
import { loadItemTipsPageData } from '@/lib/admin/item-tips-data';
import { parseListFilterParam } from '@/lib/admin/list-list-utils';

async function resolveCategoryId(
  categoryParam: string | undefined
): Promise<string> {
  if (!categoryParam || categoryParam === 'all') return 'all';
  const cat = await dbQuery(() =>
    prisma.categories.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: categoryParam }, { slug: categoryParam }],
      },
      select: { id: true },
    })
  );
  return cat?.id ?? 'all';
}

function resolveView(raw?: string, trash?: boolean): ContentHubView {
  if (trash) return 'lists';
  if (
    raw === 'catalog' ||
    raw === 'import' ||
    raw === 'people' ||
    raw === 'descriptions' ||
    raw === 'item-tips'
  ) {
    return raw;
  }
  return 'lists';
}

function ListsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" dir="rtl">
      <div className="h-16 rounded-2xl bg-[var(--color-border-muted)]" />
      <div className="h-12 rounded-xl bg-[var(--color-border-muted)]" />
      <div className="h-[420px] rounded-2xl bg-[var(--color-border-muted)]" />
    </div>
  );
}

type ListsSearchParams = {
  trash?: string;
  category?: string;
  page?: string;
  view?: string;
  q?: string;
  tab?: string;
  listId?: string;
  multiList?: string;
  categoryId?: string;
  mode?: string;
  tipsCategory?: string;
  tipsList?: string;
  filter?: string;
  externalImages?: string;
};

/** Default lists view — hub stats + intelligence in parallel (async-parallel) */
async function ListsViewContent({
  params,
}: {
  params: ListsSearchParams;
}) {
  const trash = params.trash === 'true';
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  // Start category resolve + hub stats together; lists waits only on categoryId
  const categoryPromise = trash
    ? Promise.resolve('all')
    : resolveCategoryId(params.category);
  const hubPromise = getCachedContentHubStats();

  const initialCategoryId = await categoryPromise;
  const [hubStats, listsData] = await Promise.all([
    hubPromise,
    getCachedListsIntelligenceData({
      trash,
      page: currentPage,
      categoryId: initialCategoryId,
      q: trash ? undefined : params.q,
    }),
  ]);

  const initialFilter = trash ? 'all' : parseListFilterParam(params.filter);

  return (
    <ContentHubClient
      view="lists"
      hubStats={hubStats}
      listsData={listsData}
      trash={trash}
      initialCategoryId={initialCategoryId}
      initialSearch={params.q ?? ''}
      initialFilter={initialFilter}
    />
  );
}

export default async function AdminListsPage({
  searchParams,
}: {
  searchParams: Promise<ListsSearchParams>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const trash = params.trash === 'true';
  const view = resolveView(params.view, trash);

  if (view === 'lists') {
    return (
      <Suspense fallback={<ListsSkeleton />}>
        <ListsViewContent params={params} />
      </Suspense>
    );
  }

  // Non-lists tabs: still parallelize hub stats with tab-specific data
  const hubPromise = getCachedContentHubStats();

  if (view === 'people') {
    const hubStats = await hubPromise;
    return <ContentHubClient view="people" hubStats={hubStats} />;
  }

  if (view === 'descriptions') {
    const [hubStats, descriptionsData] = await Promise.all([
      hubPromise,
      loadListDescriptionsPageData(),
    ]);
    return (
      <ContentHubClient
        view="descriptions"
        hubStats={hubStats}
        descriptionsData={descriptionsData}
      />
    );
  }

  if (view === 'item-tips') {
    const tipsCategoryPromise =
      params.tipsCategory && params.tipsCategory !== 'all'
        ? resolveCategoryId(params.tipsCategory)
        : Promise.resolve('');
    const [hubStats, tipsCategoryId] = await Promise.all([
      hubPromise,
      tipsCategoryPromise,
    ]);
    const itemTipsData = await loadItemTipsPageData({
      categoryId: tipsCategoryId === 'all' ? '' : tipsCategoryId,
      listId: params.tipsList,
    });
    return (
      <ContentHubClient
        view="item-tips"
        hubStats={hubStats}
        itemTipsData={itemTipsData}
      />
    );
  }

  if (view === 'import') {
    const [hubStats, categories, lists] = await Promise.all([
      hubPromise,
      prisma.categories.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          isActive: true,
        },
      }),
      prisma.lists.findMany({
        where: { deletedAt: null },
        include: {
          categories: {
            select: { id: true, name: true, slug: true, icon: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return (
      <ContentHubClient
        view="import"
        hubStats={hubStats}
        importCategories={categories}
        importLists={lists.map((l) => ({
          id: l.id,
          title: l.title,
          slug: l.slug,
          categoryId: l.categoryId,
          itemCount: l.itemCount,
          createdAt: l.createdAt.toISOString(),
          categories: l.categories,
        }))}
        initialImportListId={params.listId}
        initialImportCategoryId={params.categoryId}
      />
    );
  }

  // catalog
  if (!isCatalogClientReady(prisma)) {
    return (
      <div className="space-y-4" dir="rtl">
        <h1 className="text-xl font-bold">لیست‌ها و محتوا</h1>
        <AdminDatabaseUnavailable
          message="Prisma Client قدیمی است یا جدول catalog_items ساخته نشده."
          backHref="/admin/lists"
          backLabel="بازگشت به لیست‌ها"
        />
      </div>
    );
  }

  const [hubStats, catalogData, createLists] = await Promise.all([
    hubPromise,
    loadCatalogPageData({
      page: params.page,
      q: params.q,
      tab: params.tab,
      category: params.category,
      listId: params.listId,
      multiList: params.multiList,
      mode: params.mode,
      externalImages: params.externalImages,
    }),
    params.mode === 'create'
      ? prisma.lists.findMany({
          where: { isActive: true, deletedAt: null },
          include: { categories: true },
          orderBy: { title: 'asc' },
        })
      : Promise.resolve(undefined),
  ]);

  return (
    <ContentHubClient
      view="catalog"
      hubStats={hubStats}
      catalogData={catalogData}
      createLists={
        createLists ? JSON.parse(JSON.stringify(createLists)) : undefined
      }
      initialCreateListId={params.listId}
      catalogMode={params.mode}
    />
  );
}
