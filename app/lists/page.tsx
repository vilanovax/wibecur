import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import ListsPageClient from './ListsPageClient';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { activeCategoryWhere } from '@/lib/public-content-filters';
import { fetchListsBrowse, LISTS_SSR_LIMIT } from '@/lib/lists-browse';

export const revalidate = 60;

export const metadata = {
  title: 'لیست‌ها | WibeCur',
  description: 'مرور و کشف لیست‌های کیوریت شده',
};

function isDbError(e: unknown): boolean {
  const err = e as Error & { code?: string };
  const msg = String(err?.message ?? '');
  return (
    err?.code === 'P1001' ||
    msg.includes("Can't reach database") ||
    msg.includes('Invalid value undefined for datasource') ||
    msg.includes('PrismaClient')
  );
}

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; q?: string; mode?: string }>;
}) {
  const params = await searchParams;
  let lists: Awaited<ReturnType<typeof fetchListsBrowse>>['lists'] = [];
  let totalListCount = 0;
  let categories: {
    id: string;
    name: string;
    slug: string | null;
    icon: string | null;
    color: string | null;
    order: number | null;
    isActive: boolean;
  }[] = [];

  try {
    const [browseResult, categoryRows] = await Promise.all([
      fetchListsBrowse({ offset: 0, limit: LISTS_SSR_LIMIT, sort: 'newest' }),
      dbQuery(() =>
        prisma.categories.findMany({
          where: activeCategoryWhere,
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
            order: true,
            isActive: true,
          },
          orderBy: { order: 'asc' },
        })
      ),
    ]);
    lists = browseResult.lists;
    totalListCount = browseResult.pagination.total;
    categories = categoryRows;
  } catch (e) {
    if (isDbError(e) || process.env.NODE_ENV === 'development') {
      console.warn('Lists page: DB unavailable, showing empty:', (e as Error)?.message);
    } else {
      throw e;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-wibe-card">
      <Header title="لیست‌ها" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <main className="min-w-0 flex-1 pt-2 lg:pt-0">
        <ListsPageClient
          lists={lists}
          totalListCount={totalListCount}
          categories={categories}
          initialCategory={params.category}
          initialSearch={params.q || params.tag}
          initialMode={params.mode}
        />
      </main>
      <BottomNav />
    </div>
  );
}
