import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CommentSection from '@/components/mobile/comments/CommentSection';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.items.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  if (!item) {
    return {
      title: 'آیتم یافت نشد',
    };
  }

  return {
    title: `${item.title} | WibeCur`,
    description: item.description || `مشاهده ${item.title}`,
  };
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.items.findUnique({
    where: { id },
    include: {
      lists: {
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={item.title} showBack />

      <main className="space-y-6">
        {/* Item Image */}
        {item.imageUrl && (
          <div className="relative h-64 bg-gradient-to-br from-purple-100 to-blue-100">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              unoptimized={true}
            />
          </div>
        )}

        {/* Item Content */}
        <div className="px-4 space-y-4">
          {/* Back to List Link */}
          <Link
            href={`/lists/${item.lists.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 hover:border-primary transition-colors"
          >
            <span className="text-lg">{item.lists.categories.icon}</span>
            <span>بازگشت به: {item.lists.title}</span>
          </Link>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {item.title}
            </h1>
            {item.description && (
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {/* External Link */}
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
            >
              <span>🔗</span>
              <span>اطلاعات بیشتر</span>
            </a>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span>⭐</span>
              <span>{item.rating || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>👍</span>
              <span>{item.voteCount || 0}</span>
            </span>
          </div>
        </div>

        {/* Metadata Section */}
        {item.metadata && typeof item.metadata === 'object' && Object.keys(item.metadata).length > 0 && (
          <div className="px-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">اطلاعات تکمیلی</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(item.metadata as Record<string, any>).map(([key, value]) => {
                  if (!value) return null;
                  
                  const labels: Record<string, string> = {
                    year: 'سال',
                    genre: 'ژانر',
                    director: 'کارگردان',
                    imdbRating: 'امتیاز IMDb',
                    author: 'نویسنده',
                    address: 'آدرس',
                    priceRange: 'بازه قیمت',
                    cuisine: 'نوع غذا',
                  };

                  const displayValue = key === 'priceRange' && typeof value === 'string'
                    ? value.length > 0 ? `${value} - ${value === '$' ? 'ارزان' : value === '$$' ? 'متوسط' : value === '$$$' ? 'گران' : 'لوکس'}`
                    : value
                    : value;

                  return (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs text-gray-500 mb-1">
                        {labels[key] || key}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="px-4">
          <CommentSection itemId={item.id} />
        </div>

        {/* List Info */}
        <div className="px-4 py-6 bg-white mx-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-lg">{item.lists.categories.icon}</span>
            <div>
              <p className="text-sm text-gray-500">از لیست</p>
              <Link
                href={`/lists/${item.lists.slug}`}
                className="font-medium text-gray-900 hover:text-primary transition-colors"
              >
                {item.lists.title}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

