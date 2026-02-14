import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import ListsPageClient from './ListsPageClient';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // ISR: به‌روزرسانی هر ۶۰ ثانیه

export const metadata = {
  title: 'لیست‌ها | WibeCur',
  description: 'مرور و کشف لیست‌های کیوریت شده',
};

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; q?: string }>;
}) {
  const params = await searchParams;
  // Fetch lists and categories from database
  // Only show lists created by admins, not users
  const [lists, categories] = await Promise.all([
    prisma.lists.findMany({
      where: {
        isActive: true,
        isPublic: true,
        users: {
          role: {
            not: 'USER', // Only show lists created by admins (ADMIN or EDITOR)
          },
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
            role: true,
          },
        },
        _count: {
          select: {
            items: true,
            list_likes: true,
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
          initialCategory={params.category}
          initialSearch={params.tag || params.q}
        />
      </main>
      <BottomNav />
    </div>
  );
}

