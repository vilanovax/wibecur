'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface PersonalizedFilmSectionProps {
  categorySlug: string;
  suggestedLists?: CategoryListCard[];
  accentColor?: string;
}

/** سکشن شخصی‌سازی‌شده — وقتی کاربر تعامل داشته */
async function fetchSuggestedForUser(
  categorySlug: string
): Promise<CategoryListCard[]> {
  try {
    const res = await fetch(`/api/user/activity?category=${categorySlug}&suggest=1`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.lists ?? json.data ?? [];
  } catch {
    return [];
  }
}

export default function PersonalizedFilmSection({
  categorySlug,
  suggestedLists = [],
  accentColor = '#A855F7',
}: PersonalizedFilmSectionProps) {
  const { data: userLists = [] } = useQuery({
    queryKey: ['personalized-film', categorySlug],
    queryFn: () => fetchSuggestedForUser(categorySlug),
    staleTime: 2 * 60 * 1000,
  });

  const lists = userLists.length > 0 ? userLists : suggestedLists;
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        🎯 برای تو انتخاب شده
      </h2>
      <p className="text-sm text-gray-600 mt-0.5 mb-5">
        بر اساس ژانرها و فیلم‌های ذخیره‌شده‌ات
      </p>

      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x -mx-4 px-4">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[140px] snap-start"
          >
            <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 active:scale-[0.97] transition-transform">
              <div className="relative aspect-[3/4] bg-gray-800">
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover"
                    placeholderSize="square"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-4xl opacity-50"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    🎬
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
              <div className="p-2">
                <h3 className="font-semibold text-gray-100 text-xs line-clamp-2">
                  {list.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
