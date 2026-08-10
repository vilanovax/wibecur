import { Suspense } from 'react';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import ListsPageClient from './ListsPageClient';
import ListsPageContentSkeleton from '@/components/mobile/lists/ListsPageContentSkeleton';
import { getListsPageBootstrap } from '@/lib/lists-page-server';

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

async function ListsContent({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    mode?: string;
  }>;
}) {
  const params = await searchParams;

  try {
    const data = await getListsPageBootstrap(params);
    return (
      <ListsPageClient
        lists={data.lists}
        totalListCount={data.totalListCount}
        categories={data.categories}
        initialCategory={data.initialCategory}
        initialSearch={data.initialSearch}
        initialMode={data.initialMode}
        initialSort={data.initialSort}
        initialCategoryId={data.initialCategoryId}
        initialTrendingIds={data.initialTrendingIds}
      />
    );
  } catch (e) {
    if (isDbError(e) || process.env.NODE_ENV === 'development') {
      console.warn('Lists page: DB unavailable, showing empty:', (e as Error)?.message);
      return (
        <ListsPageClient
          lists={[]}
          totalListCount={0}
          categories={[]}
          initialMode="trending"
          initialSort="rising"
          initialCategoryId={null}
          initialTrendingIds={[]}
        />
      );
    }
    throw e;
  }
}

export default function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    mode?: string;
  }>;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-wibe-card">
      <Header title="لیست‌ها" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <main className="min-w-0 flex-1 pt-2 lg:pt-0">
        <Suspense fallback={<ListsPageContentSkeleton />}>
          <ListsContent searchParams={searchParams} />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
