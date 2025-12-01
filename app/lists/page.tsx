import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import ListsPageClient from './ListsPageClient';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'لیست‌ها | WibeCur',
  description: 'مرور و کشف لیست‌های کیوریت شده',
};

export default async function ListsPage() {
  // Fetch lists and categories from database
  const [lists, categories] = await Promise.all([
    prisma.lists.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      include: {
        categories: true,
        _count: {
          select: {
            items: true,
            list_likes: true,
            bookmarks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.categories.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="لیست‌ها" />
      <main className="py-6">
        <ListsPageClient 
          lists={JSON.parse(JSON.stringify(lists))} 
          categories={JSON.parse(JSON.stringify(categories))} 
        />
      </main>
      <BottomNav />
    </div>
  );
}

