import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import ListsPageClient from './ListsPageClient';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { withResolvedListCovers } from '@/lib/resolve-list-cover';

export const revalidate = 60; // ISR: به‌روزرسانی هر ۶۰ ثانیه

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

const listsQuery = () =>
  dbQuery(() =>
    prisma.lists.findMany({
      where: {
        isActive: true,
        isPublic: true,
        users: {
          role: { not: 'USER' },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        categoryId: true,
        badge: true,
        isPublic: true,
        isFeatured: true,
        isActive: true,
        viewCount: true,
        likeCount: true,
        saveCount: true,
        itemCount: true,
        createdAt: true,
        updatedAt: true,
        categories: true,
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            role: true,
          },
        },
        _count: {
          select: { items: true, list_likes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  );

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; q?: string; mode?: string }>;
}) {
  const params = await searchParams;
  let lists: Awaited<ReturnType<typeof listsQuery>> = [];
  let categories: Awaited<ReturnType<typeof prisma.categories.findMany>> = [];

  try {
    [lists, categories] = await Promise.all([
      listsQuery(),
      dbQuery(() =>
        prisma.categories.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        })
      ),
    ]);
  } catch (e) {
    if (isDbError(e) || process.env.NODE_ENV === 'development') {
      console.warn('Lists page: DB unavailable, showing empty:', (e as Error)?.message);
    } else {
      throw e;
    }
  }

  return (
    <div className="min-h-screen bg-wibe-surface pb-20">
      <Header title="لیست‌ها" showSearch />
      <main className="pt-3">
        <ListsPageClient 
          lists={JSON.parse(JSON.stringify(withResolvedListCovers(lists)))} 
          categories={JSON.parse(JSON.stringify(categories))} 
          initialCategory={params.category}
          initialSearch={params.q || params.tag}
          initialMode={params.mode}
        />
      </main>
      <BottomNav />
    </div>
  );
}

