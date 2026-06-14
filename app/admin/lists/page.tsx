import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCachedListsIntelligenceData } from '@/lib/admin/lists-intelligence-cached';
import { getCachedContentHubStats } from '@/lib/admin/content-hub-stats';
import { loadCatalogPageData } from '@/lib/admin/catalog-page-data';
import { isCatalogClientReady } from '@/lib/catalog-items';
import AdminDatabaseUnavailable from '@/components/admin/shared/AdminDatabaseUnavailable';
import ContentHubClient, { type ContentHubView } from './ContentHubClient';

async function resolveCategoryId(categoryParam: string | undefined): Promise<string> {
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
  if (raw === 'catalog' || raw === 'import') return raw;
  return 'lists';
}

export default async function AdminListsPage({
  searchParams,
}: {
  searchParams: Promise<{
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
  }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const trash = params.trash === 'true';
  const view = resolveView(params.view, trash);
  const initialCategoryId = trash ? 'all' : await resolveCategoryId(params.category);
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  const hubStats = await getCachedContentHubStats();

  if (view === 'import') {
    const [categories, lists] = await Promise.all([
      prisma.categories.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, slug: true, icon: true, isActive: true },
      }),
      prisma.lists.findMany({
        where: { deletedAt: null },
        include: { categories: { select: { id: true, name: true, slug: true, icon: true } } },
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

  if (view === 'catalog') {
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

    const catalogData = await loadCatalogPageData({
      page: params.page,
      q: params.q,
      tab: params.tab,
      category: params.category,
      listId: params.listId,
      multiList: params.multiList,
      mode: params.mode,
    });

    const createLists =
      params.mode === 'create'
        ? await prisma.lists.findMany({
            where: { isActive: true, deletedAt: null },
            include: { categories: true },
            orderBy: { title: 'asc' },
          })
        : undefined;

    return (
      <ContentHubClient
        view="catalog"
        hubStats={hubStats}
        catalogData={catalogData}
        createLists={
          createLists ? JSON.parse(JSON.stringify(createLists)) : undefined
        }
        initialCreateListId={params.listId}
      />
    );
  }

  const listsData = await getCachedListsIntelligenceData({
    trash,
    page: currentPage,
    categoryId: initialCategoryId,
  });

  return (
    <ContentHubClient
      view="lists"
      hubStats={hubStats}
      listsData={listsData}
      trash={trash}
      initialCategoryId={initialCategoryId}
    />
  );
}
