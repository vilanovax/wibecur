import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = await prisma.lists.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

  if (!list) {
    return {
      title: 'لیست یافت نشد',
    };
  }

  return {
    title: `${list.title} | WibeCur`,
    description: list.description || `مشاهده لیست ${list.title}`,
  };
}

export default async function ListDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  
  const list = await prisma.lists.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
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
      items: {
        orderBy: { order: 'asc' },
      },
      users: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          items: true,
          list_likes: true,
        },
      },
    },
  });

  if (!list || !list.isActive || !list.isPublic) {
    notFound();
  }

  // Increment view count (in background)
  prisma.lists.update({
    where: { id: list.id },
    data: { viewCount: { increment: 1 } },
  }).catch(console.error);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={list.title} showBack />
      
      <main className="space-y-6">
        {/* Cover Image */}
        {list.coverImage && (
          <div className="relative h-64 bg-gradient-to-br from-purple-100 to-blue-100">
            <Image
              src={list.coverImage}
              alt={list.title}
              fill
              className="object-cover"
              unoptimized={true}
            />
            {list.isFeatured && (
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                ⭐ ویژه
              </div>
            )}
            {list.badge && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold">
                {list.badge === 'TRENDING' && '🔥 ترند'}
                {list.badge === 'NEW' && '🆕 جدید'}
                {list.badge === 'FEATURED' && '⭐ برگزیده'}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="px-4 space-y-4">
          {/* Category */}
          <Link
            href={`/categories/${list.categories.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 hover:border-primary transition-colors"
          >
            <span className="text-lg">{list.categories.icon}</span>
            <span>{list.categories.name}</span>
          </Link>

          {/* Title & Description */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {list.title}
            </h1>
            {list.description && (
              <p className="text-gray-600 leading-relaxed">
                {list.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span>📋</span>
              <span>{list.itemCount ?? list._count.items ?? 0} آیتم</span>
            </span>
            <span className="flex items-center gap-1">
              <span>❤️</span>
              <span>{list.likeCount ?? list._count.list_likes ?? 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>⭐</span>
              <span>{list.saveCount ?? 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>👁</span>
              <span>{list.viewCount ?? 0}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30">
              ❤️ لایک
            </button>
            <BookmarkButton
              listId={list.id}
              initialBookmarkCount={list.saveCount ?? 0}
              variant="button"
              size="md"
            />
            <button className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium hover:border-primary transition-colors">
              📤
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="px-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            آیتم‌های لیست ({list.items.length})
          </h2>
          
          {list.items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-600">هنوز آیتمی اضافه نشده است</p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.items.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex gap-4">
                    {/* Number */}
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>

                    {/* Image */}
                    {item.imageUrl && (
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.externalUrl && (
                        <div className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                          <span>🔗</span>
                          <span>اطلاعات بیشتر</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Created By */}
        <div className="px-4 py-6 bg-white mx-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {list.users.name?.charAt(0) || '👤'}
            </div>
            <div>
              <p className="text-sm text-gray-500">ایجاد شده توسط</p>
              <p className="font-medium text-gray-900">
                {list.users.name || 'کاربر'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

