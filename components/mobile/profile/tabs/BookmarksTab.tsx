'use client';

import { useState, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCategoryIconTile from '@/components/shared/ListCategoryIconTile';
import Toast from '@/components/shared/Toast';
import { homeBookmarksQueryKey } from '@/hooks/useHomeBookmarks';
import type { ProfileBookmarkSSR } from '@/lib/profile-ssr-types';

type ListWithMeta = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  updatedAt: string;
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    iconImage?: string | null;
    color?: string;
  } | null;
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
  pagination?: { page: number; totalPages: number; total?: number };
}

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia('(min-width: 1024px)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** گرید دسکتاپ فقط وقتی واقعاً دیده می‌شود؛ وگرنه next/image بزرگ‌ترین کاندید را می‌کشد */
function useDesktopBookmarks() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => false
  );
}

async function fetchBookmarks(): Promise<BookmarksResponse> {
  const res = await fetch('/api/user/bookmarks?page=1&limit=20');
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const desktop = useDesktopBookmarks();
  const hasInitial = Boolean(initialBookmarks?.length);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user', userId, 'bookmarks'],
    queryFn: fetchBookmarks,
    staleTime: 30_000,
    initialData: hasInitial
      ? {
          bookmarks: initialBookmarks as BookmarkItem[],
          pagination: {
            page: 1,
            totalPages: Math.ceil(initialBookmarksTotal / 20) || 1,
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

  const handleRemoveBookmark = async (listId: string) => {
    if (removingId) return;
    setRemovingId(listId);
    try {
      const res = await fetch(`/api/lists/${listId}/bookmark`, { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'حذف ذخیره انجام نشد');
      }
      // API تoggle است؛ اگر هنوز ذخیره بود یک‌بار دیگر بزن
      if (json.data?.isBookmarked) {
        const again = await fetch(`/api/lists/${listId}/bookmark`, { method: 'POST' });
        const againJson = await again.json().catch(() => null);
        if (!again.ok || !againJson?.success || againJson.data?.isBookmarked) {
          throw new Error('حذف ذخیره انجام نشد');
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user', userId, 'bookmarks'] }),
        queryClient.invalidateQueries({ queryKey: homeBookmarksQueryKey(userId) }),
      ]);
      setToast('از ذخیره‌ها حذف شد');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'حذف ذخیره انجام نشد');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading && bookmarks.length === 0 && !hasInitial) {
    return (
      <div className="space-y-2.5 px-4 lg:px-0">
        {desktop ? (
          <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
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
        ) : (
          [1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="flex min-h-20 gap-2.5 bg-popover p-2.5">
              <Skeleton className="size-16 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))
        )}
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

  const totalLabel = (data?.pagination?.total ?? (initialBookmarksTotal || bookmarks.length)).toLocaleString('fa-IR');

  return (
    <div className="space-y-4 px-4 pb-4 lg:px-0">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="wibe-h3 text-foreground">ذخیره‌های تو</h2>
        <span className="wibe-caption tabular-nums text-muted-foreground">
          {totalLabel} لیست
        </span>
      </div>

      {!desktop ? (
      <div className="space-y-2.5">
        {displayedBookmarks.map((bookmark) => {
          const list = bookmark.list;

          return (
            <Card
              key={bookmark.id}
              className="flex gap-2.5 bg-popover p-2.5 transition-transform active:scale-95"
            >
              <Link
                href={`/lists/${list.slug}`}
                prefetch={false}
                onPointerDown={() => router.prefetch(`/lists/${list.slug}`)}
                className="flex min-w-0 flex-1 gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <ListCategoryIconTile
                  icon={list.categories?.icon}
                  iconImage={list.categories?.iconImage}
                  size="md"
                />
                <div className="min-w-0 flex-1 self-center text-start">
                  <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">
                    {list.title}
                  </h3>
                  {list.categories?.name ? (
                    <p className="mt-0.5 line-clamp-1 wibe-caption text-muted-foreground">
                      {list.categories.name}
                    </p>
                  ) : null}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => void handleRemoveBookmark(list.id)}
                disabled={removingId === list.id}
                className="flex size-11 shrink-0 items-center justify-center self-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label={`حذف «${list.title}» از ذخیره‌ها`}
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </Card>
          );
        })}
      </div>
      ) : null}

      {desktop ? (
      <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
        {displayedBookmarks.map((bookmark) => {
          const list = bookmark.list;

          return (
            <Card key={bookmark.id} className="relative overflow-hidden bg-popover p-0">
              <button
                type="button"
                onClick={() => void handleRemoveBookmark(list.id)}
                disabled={removingId === list.id}
                className="absolute inset-e-2 top-2 z-10 flex size-11 items-center justify-center rounded-full border border-border bg-popover/95 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label={`حذف «${list.title}» از ذخیره‌ها`}
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
              <Link
                href={`/lists/${list.slug}`}
                prefetch={false}
                onPointerDown={() => router.prefetch(`/lists/${list.slug}`)}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <div className="relative aspect-video max-h-40 bg-muted">
                  <ListCoverImage
                    coverImage={list.coverImage}
                    title={list.title}
                    slug={list.slug}
                    categorySlug={list.categories?.slug}
                    sizes="(min-width: 1280px) 25vw, 33vw"
                    fetchPriority="low"
                    className="h-full w-full object-cover"
                    fallbackIcon={list.categories?.icon}
                    fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-2xl"
                  />
                </div>
                <div className="p-2.5">
                  <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">
                    {list.title}
                  </h3>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>
      ) : null}

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

      {toast ? (
        <Toast message={toast} type="success" duration={2800} onClose={() => setToast(null)} />
      ) : null}
    </div>
  );
}
