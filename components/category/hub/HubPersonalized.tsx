'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface HubPersonalizedProps {
  categorySlug: string;
  suggestedLists?: CategoryListCard[];
  accentColor?: string;
}

function toCategoryListCard(l: {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  saveCount?: number;
  likeCount?: number;
  itemCount?: number;
  badge?: string | null;
  tags?: string[] | null;
  categories?: { slug: string } | null;
  users?: { id: string; name: string | null; username: string | null; image: string | null; curatorLevel?: string } | null;
}): CategoryListCard {
  return {
    id: l.id,
    title: l.title,
    slug: l.slug,
    description: l.description ?? null,
    coverImage: l.coverImage ?? null,
    saveCount: l.saveCount ?? 0,
    likeCount: l.likeCount ?? 0,
    itemCount: l.itemCount ?? 0,
    badge: l.badge ?? null,
    creator: l.users
      ? { id: l.users.id, name: l.users.name, username: l.users.username, image: l.users.image, curatorLevel: l.users.curatorLevel ?? 'EXPLORER' }
      : { id: '', name: null, username: null, image: null, curatorLevel: 'EXPLORER' },
    tags: (l.tags ?? []).length > 0 ? l.tags ?? [] : undefined,
  };
}

async function fetchPersonalized(
  categorySlug: string
): Promise<CategoryListCard[]> {
  try {
    const res = await fetch('/api/user/bookmarks?limit=50');
    if (!res.ok) return [];
    const json = await res.json();
    const bookmarks = json?.data?.bookmarks ?? json?.bookmarks ?? [];
    const lists = bookmarks
      .map((b: { list?: { categories?: { slug: string }; id?: string; title?: string } }) => b.list)
      .filter(
        (l: unknown) =>
          l &&
          (l as { categories?: { slug: string } }).categories?.slug === categorySlug
      )
      .slice(0, 6)
      .map((l: unknown) => toCategoryListCard(l as Parameters<typeof toCategoryListCard>[0]));
    return lists;
  } catch {
    return [];
  }
}

/** پیشنهاد برای تو — بر اساس ذخیره‌های کاربر */
export default function HubPersonalized({
  categorySlug,
  suggestedLists = [],
  accentColor = '#EA580C',
}: HubPersonalizedProps) {
  const { data: userLists = [] } = useQuery({
    queryKey: ['hub-personalized', categorySlug],
    queryFn: () => fetchPersonalized(categorySlug),
    staleTime: 2 * 60 * 1000,
  });

  const lists = userLists.length > 0 ? userLists : suggestedLists;
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        🎯 پیشنهاد برای تو
      </h2>
      <p className="text-[11px] text-gray-500 mb-2">
        بر اساس ذخیره‌هایت
      </p>

      <div className="flex gap-3 mt-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-28 rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm active:scale-[0.97] transition-transform"
          >
            <div className="relative aspect-[3/4] bg-gray-100">
              {list.coverImage ? (
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  placeholderSize="square"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl opacity-40"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  📋
                </div>
              )}
            </div>
            <div className="p-2">
              <h3 className="font-semibold text-gray-900 text-xs line-clamp-2">
                {list.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
