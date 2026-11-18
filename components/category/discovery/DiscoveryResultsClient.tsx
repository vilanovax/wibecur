'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import CategoryListCardImproved from '@/components/category/CategoryListCardImproved';
import CategoryItemChipLink from '@/components/category/CategoryItemChipLink';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { fa } from '@/lib/utils';
import type { CategoryListCard } from '@/types/category-page';
import type { DiscoveryPlaceCard, DiscoveryTopicChip } from '@/lib/category-discovery/types';

type Tab = 'lists' | 'places';

interface DiscoveryResultsClientProps {
  categorySlug: string;
  categoryName: string;
  categoryIcon?: string | null;
  categoryIconImage?: string | null;
  topicSlug: string;
  initialTab?: Tab;
  initialData?: {
    topic: DiscoveryTopicChip;
    lists: CategoryListCard[];
    places: DiscoveryPlaceCard[];
    listCount: number;
    placeCount: number;
  } | null;
}

export default function DiscoveryResultsClient({
  categorySlug,
  categoryName,
  categoryIcon,
  categoryIconImage,
  topicSlug,
  initialTab = 'lists',
  initialData = null,
}: DiscoveryResultsClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      // اگر لیست قوی نبود و مکان هست → تب مکان
      if (initialData.listCount === 0 && initialData.placeCount > 0) {
        setTab('places');
      }
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/categories/${encodeURIComponent(categorySlug)}/discovery?topic=${encodeURIComponent(topicSlug)}`
        );
        if (!res.ok) throw new Error('load failed');
        const json = await res.json();
        if (cancelled) return;
        if (!json?.data) {
          setError('این موضوع پیدا نشد.');
          setData(null);
          return;
        }
        setData(json.data);
        if (json.data.listCount === 0 && json.data.placeCount > 0) {
          setTab('places');
        }
      } catch {
        if (!cancelled) setError('بارگذاری نتایج ممکن نشد.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categorySlug, topicSlug, initialData]);

  function clearTopic() {
    router.push(`/categories/${categorySlug}`);
  }

  function switchTab(next: Tab) {
    setTab(next);
    const params = new URLSearchParams();
    params.set('topic', topicSlug);
    params.set('tab', next);
    router.replace(`/categories/${categorySlug}/discover?${params.toString()}`, {
      scroll: false,
    });
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-8">
        <EmptyState
          title={error ?? 'موضوعی پیدا نشد'}
          description="برگرد به صفحهٔ دسته و موضوع دیگری را امتحان کن."
        />
        <div className="mt-4 flex justify-center">
          <Link
            href={`/categories/${categorySlug}`}
            className="inline-flex h-11 items-center text-sm font-medium text-brand"
          >
            بازگشت به {categoryName}
          </Link>
        </div>
      </div>
    );
  }

  const { topic, lists, places, listCount, placeCount } = data;
  const emptyBoth = listCount === 0 && placeCount === 0;

  return (
    <div className="py-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">موضوعات کشف · {categoryName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-11 items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-4 text-sm font-semibold text-foreground">
              {topic.icon ? <span aria-hidden>{topic.icon}</span> : null}
              {topic.label}
              <button
                type="button"
                onClick={clearTopic}
                className="ms-1 inline-flex size-8 items-center justify-center rounded-full hover:bg-muted"
                aria-label="حذف موضوع"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {fa(listCount)} لیست مرتبط — {fa(placeCount)} مکان
          </p>
        </div>
        <Link
          href={`/categories/${categorySlug}`}
          className="inline-flex h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          صفحهٔ دسته
        </Link>
      </div>

      {!emptyBoth && (
        <div
          role="tablist"
          aria-label="نوع نتیجه"
          className="mb-4 flex gap-2 rounded-xl border border-border bg-muted/40 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'lists'}
            onClick={() => switchTab('lists')}
            className={`flex h-11 flex-1 items-center justify-center gap-1 rounded-lg text-sm font-medium transition-colors ${
              tab === 'lists'
                ? 'bg-popover text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            لیست‌ها
            <span className="tabular-nums text-xs opacity-75">({fa(listCount)})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'places'}
            onClick={() => switchTab('places')}
            className={`flex h-11 flex-1 items-center justify-center gap-1 rounded-lg text-sm font-medium transition-colors ${
              tab === 'places'
                ? 'bg-popover text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            مکان‌ها
            <span className="tabular-nums text-xs opacity-75">({fa(placeCount)})</span>
          </button>
        </div>
      )}

      {emptyBoth ? (
        <EmptyState
          title={`چیزی برای «${topic.label}» نبود`}
          description="می‌توانی همین عبارت را در جستجوی دسته امتحان کنی."
        />
      ) : null}

      {listCount === 0 && placeCount > 0 && tab === 'places' ? (
        <p className="mb-3 text-sm text-muted-foreground">
          لیست کیوریت‌شده‌ای با این موضوع نبود؛ مکان‌های مرتبط را ببین.
        </p>
      ) : null}

      {tab === 'lists' && !emptyBoth ? (
        lists.length === 0 ? (
          <EmptyState
            title="لیست قوی‌ای پیدا نشد"
            description="به تب مکان‌ها سر بزن یا موضوع را پاک کن."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {lists.map((list) => (
              <li key={list.id}>
                <CategoryListCardImproved
                  list={list}
                  categoryIcon={categoryIcon}
                  categoryIconImage={categoryIconImage}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'places' && !emptyBoth ? (
        places.length === 0 ? (
          <EmptyState title="مکانی پیدا نشد" description="تب لیست‌ها را ببین." />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {places.map((place) => (
              <CategoryItemChipLink
                key={place.id}
                item={{
                  id: place.id,
                  title: place.title,
                  imageUrl: place.imageUrl,
                  displayImageUrl: place.displayImageUrl,
                  listSlug: place.listSlug,
                  listTitle: place.listTitle,
                }}
                layout="tile"
              />
            ))}
          </div>
        )
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/lists?category=${encodeURIComponent(categorySlug)}&q=${encodeURIComponent(topic.label)}`}
          className="inline-flex h-11 items-center text-sm font-medium text-brand"
        >
          جستجوی «{topic.label}» در لیست‌ها
        </Link>
      </div>
    </div>
  );
}
