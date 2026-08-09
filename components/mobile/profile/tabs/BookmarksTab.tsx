'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Bookmark, RefreshCw } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import type { ProfileBookmarkSSR } from '@/lib/profile-ssr-types';

type ListWithMeta = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  itemCount?: number;
  likeCount?: number;
  viewCount?: number;
  saveCount?: number;
  updatedAt: string;
  categories: { id: string; name: string; slug: string; icon: string; color?: string } | null;
  users: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    curatorLevel?: string | null;
  } | null;
  _count?: { items: number; list_likes: number; bookmarks: number };
};

interface BookmarkItem {
  id: string;
  list: ListWithMeta;
  createdAt: string;
}

interface BookmarksTabProps {
  userId: string;
  initialBookmarks?: ProfileBookmarkSSR[];
  initialBookmarksTotal?: number;
}

interface BookmarksResponse {
  bookmarks: BookmarkItem[];
  pagination?: { page: number; totalPages: number };
}

async function fetchBookmarks(): Promise<BookmarksResponse> {
  const res = await fetch('/api/user/bookmarks?page=1&limit=50');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در دریافت ذخیره‌ها');
  }
  return {
    bookmarks: data.data.bookmarks ?? [],
    pagination: data.data.pagination,
  };
}

export default function BookmarksTab({
  userId,
  initialBookmarks,
  initialBookmarksTotal = 0,
}: BookmarksTabProps) {
  const hasInitial = Boolean(initialBookmarks?.length);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user', userId, 'bookmarks'],
    queryFn: fetchBookmarks,
    staleTime: 30_000,
    initialData: hasInitial
      ? {
          bookmarks: initialBookmarks as BookmarkItem[],
          pagination: {
            page: 1,
            totalPages: Math.ceil(initialBookmarksTotal / 50) || 1,
          },
        }
      : undefined,
  });
  const bookmarks = data?.bookmarks ?? [];
  const hasMore = (data?.pagination?.page ?? 1) < (data?.pagination?.totalPages ?? 1);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const displayedBookmarks = showAll ? bookmarks : bookmarks.slice(0, 12);

  if (isLoading && bookmarks.length === 0 && !hasInitial) {
    return (
      <div className="px-4 lg:px-0">
        <div className="grid grid-cols-2 gap-2 sm:-mx-4 sm:px-0 lg:mx-0 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-[20px] overflow-hidden bg-wibe-surface animate-pulse">
              <div className="aspect-[16/9] bg-wibe-surface" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-wibe-surface rounded w-3/4" />
                <div className="h-3 bg-wibe-surface rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError && bookmarks.length === 0) {
    return (
      <div className="px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
          <p className="wibe-small text-red-600">
            {error instanceof Error ? error.message : 'خطا در بارگذاری ذخیره‌ها'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white wibe-small font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0 && !isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="rounded-xl border border-wibe bg-wibe-card px-4 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Bookmark className="h-7 w-7 text-primary" strokeWidth={1.75} />
          </div>
          <h3 className="mb-1 wibe-h3 text-foreground">هنوز لیستی ذخیره نکردی</h3>
          <p className="mx-auto mb-6 max-w-xs wibe-small text-wibe-secondary">
            از اکسپلور یا لیست‌ها یک وایب ذخیره کن تا اینجا جمع شود
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 wibe-small font-semibold text-white"
            >
              رفتن به اکسپلور
            </Link>
            <Link
              href="/lists"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-wibe bg-wibe-card px-5 py-2.5 wibe-small font-semibold text-foreground"
            >
              کاتالوگ لیست‌ها
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalLabel = (initialBookmarksTotal || bookmarks.length).toLocaleString('fa-IR');

  return (
    <div className="space-y-4 px-4 pb-4 lg:px-0">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="wibe-h3 text-foreground">ذخیره‌های تو</h2>
        <span className="wibe-caption tabular-nums text-wibe-secondary">
          {totalLabel} لیست
        </span>
      </div>

      {/* موبایل: ردیف‌های فشرده مثل «لیست‌های من» */}
      <div className="space-y-2.5 lg:hidden">
        {displayedBookmarks.map((bookmark) => {
          const list = bookmark.list;
          const items = list.itemCount ?? list._count?.items ?? 0;
          const saves = list.saveCount ?? list._count?.bookmarks ?? 0;

          return (
            <Link
              key={bookmark.id}
              href={`/lists/${list.slug}`}
              className="flex flex-row-reverse gap-2.5 rounded-xl border border-wibe bg-wibe-card p-2.5 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99]"
            >
              <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-wibe-surface">
                <ListCoverImage
                  coverImage={list.coverImage}
                  title={list.title}
                  slug={list.slug}
                  categorySlug={list.categories?.slug}
                  className="h-full w-full object-cover"
                  fallbackIcon={list.categories?.icon}
                  fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl"
                />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
                {list.categories?.name ? (
                  <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">
                    {list.categories.icon ? `${list.categories.icon} ` : ''}
                    {list.categories.name}
                  </p>
                ) : null}
                <ListCardStats saves={saves} itemCount={items} variant="compact" className="mt-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* دسکتاپ: گرید کاور */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
        {displayedBookmarks.map((bookmark) => {
          const list = bookmark.list;
          const items = list.itemCount ?? list._count?.items ?? 0;
          const saves = list.saveCount ?? list._count?.bookmarks ?? 0;

          return (
            <Link
              key={bookmark.id}
              href={`/lists/${list.slug}`}
              className="relative block overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm transition-colors hover:border-primary/20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="relative aspect-[16/10] max-h-[9.5rem] bg-wibe-surface">
                <ListCoverImage
                  coverImage={list.coverImage}
                  title={list.title}
                  slug={list.slug}
                  categorySlug={list.categories?.slug}
                  className="h-full w-full object-cover"
                  fallbackIcon={list.categories?.icon}
                  fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-2xl"
                />
              </div>
              <div className="p-2.5">
                <h3 className="mb-1 line-clamp-2 wibe-small font-semibold text-foreground">
                  {list.title}
                </h3>
                <ListCardStats saves={saves} itemCount={items} variant="compact" />
              </div>
            </Link>
          );
        })}
      </div>

      {!showAll && bookmarks.length > 12 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl border border-wibe py-3 text-sm font-medium text-wibe-secondary transition-colors hover:bg-wibe-surface lg:max-w-xs lg:mx-auto"
        >
          مشاهده بیشتر ({bookmarks.length - 12} مورد دیگر)
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
          className="w-full py-3 rounded-xl border border-wibe text-wibe-secondary hover:bg-wibe-surface font-medium text-sm disabled:opacity-50"
        >
          {isLoading ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
        </button>
      )}

    </div>
  );
}
