'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Bookmark, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
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
    initialDataUpdatedAt: hasInitial ? Date.now() : undefined,
    refetchOnMount: hasInitial ? false : undefined,
  });
  const bookmarks = data?.bookmarks ?? [];
  const hasMore = (data?.pagination?.page ?? 1) < (data?.pagination?.totalPages ?? 1);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const displayedBookmarks = showAll ? bookmarks : bookmarks.slice(0, 12);

  if (isLoading && bookmarks.length === 0 && !hasInitial) {
    return (
      <div className="px-4 lg:px-0">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden bg-popover p-0">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError && bookmarks.length === 0) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          title="ذخیره‌ها بارگذاری نشد"
          description={error instanceof Error ? error.message : 'خطا در بارگذاری ذخیره‌ها'}
          action={
            <Button type="button" variant="brand" size="lg" onClick={() => refetch()}>
              <RefreshCw />
              تلاش مجدد
            </Button>
          }
        />
      </div>
    );
  }

  if (bookmarks.length === 0 && !isLoading) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          icon={Bookmark}
          title="هنوز لیستی ذخیره نکردی"
          description="از اکسپلور یا لیست‌ها یک وایب ذخیره کن تا اینجا جمع شود."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/explore"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-base font-semibold text-brand-foreground"
              >
                رفتن به اکسپلور
              </Link>
              <Link
                href="/lists"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-popover px-6 text-base font-semibold text-foreground"
              >
                کاتالوگ لیست‌ها
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const totalLabel = (initialBookmarksTotal || bookmarks.length).toLocaleString('fa-IR');

  return (
    <div className="space-y-4 px-4 pb-4 lg:px-0">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="wibe-h3 text-foreground">ذخیره‌های تو</h2>
        <span className="wibe-caption tabular-nums text-muted-foreground">
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
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Card className="flex gap-2.5 bg-popover p-2.5 transition-transform active:scale-95">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                <ListCoverImage
                  coverImage={list.coverImage}
                  title={list.title}
                  slug={list.slug}
                  categorySlug={list.categories?.slug}
                  className="h-full w-full object-cover"
                  fallbackIcon={list.categories?.icon}
                  fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-xl"
                />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
                {list.categories?.name ? (
                  <p className="mt-0.5 line-clamp-1 wibe-caption text-muted-foreground">
                    {list.categories.icon ? `${list.categories.icon} ` : ''}
                    {list.categories.name}
                  </p>
                ) : null}
                <ListCardStats saves={saves} itemCount={items} variant="compact" className="mt-1" />
              </div>
              </Card>
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
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Card className="overflow-hidden bg-popover p-0">
              <div className="relative aspect-[16/10] max-h-40 bg-muted">
                <ListCoverImage
                  coverImage={list.coverImage}
                  title={list.title}
                  slug={list.slug}
                  categorySlug={list.categories?.slug}
                  className="h-full w-full object-cover"
                  fallbackIcon={list.categories?.icon}
                  fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-2xl"
                />
              </div>
              <div className="p-2.5">
                <h3 className="mb-1 line-clamp-2 wibe-small font-semibold text-foreground">
                  {list.title}
                </h3>
                <ListCardStats saves={saves} itemCount={items} variant="compact" />
              </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {!showAll && bookmarks.length > 12 && (
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setShowAll(true)}>
          مشاهده بیشتر ({(bookmarks.length - 12).toLocaleString('fa-IR')} مورد دیگر)
        </Button>
      )}

      {showAll && hasMore && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
        >
          {isLoading ? 'در حال بارگذاری…' : 'بارگذاری بیشتر'}
        </Button>
      )}

    </div>
  );
}
