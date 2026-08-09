'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import ListCardCompact from '@/components/mobile/lists/ListCardCompact';
import {
  LISTS_SECTION_PREVIEW_DESKTOP,
  LISTS_SECTION_PREVIEW_MOBILE,
  listsResultsGridClass,
  resolveListCardVariant,
  type ListsViewMode,
} from '@/lib/lists-page-layout';

type ListItem = Parameters<typeof ListCardCompact>[0]['list'];

interface ListsCategorySectionProps {
  title: string;
  icon?: string | null;
  categoryId: string;
  categorySlug?: string;
  lists: ListItem[];
  viewMode: ListsViewMode;
  /** @deprecated نادیده گرفته می‌شود — layout با CSS واکنش‌گراست */
  isDesktop?: boolean;
  previewCount?: number;
  bookmarkedIds?: Set<string>;
  onBookmarkToggle?: (listId: string, isBookmarked: boolean) => void;
  onShowAllCategory?: (categoryId: string, categorySlug?: string) => void;
}

const SCROLL_MT = 'scroll-mt-[136px]';

export default function ListsCategorySection({
  title,
  icon,
  categoryId,
  categorySlug,
  lists,
  viewMode,
  previewCount = LISTS_SECTION_PREVIEW_DESKTOP,
  bookmarkedIds,
  onBookmarkToggle,
  onShowAllCategory,
}: ListsCategorySectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (lists.length === 0) return null;

  const desktopPreview = Math.max(previewCount, LISTS_SECTION_PREVIEW_MOBILE);
  const hasMore = lists.length > LISTS_SECTION_PREVIEW_MOBILE;
  const visible =
    expanded || lists.length <= desktopPreview
      ? lists
      : lists.slice(0, desktopPreview);

  const filterHref = categorySlug
    ? `/lists?category=${categorySlug}`
    : `/lists?category=${categoryId}`;

  const cardVariant = resolveListCardVariant(viewMode);
  const gridClass = listsResultsGridClass(viewMode);
  const moreMobile = Math.max(0, lists.length - LISTS_SECTION_PREVIEW_MOBILE);
  const moreDesktop = Math.max(0, lists.length - desktopPreview);

  /** ۳ کارت در گرید ۲ستونه → چیدمان ۱ بلند + ۲ کوتاه (بدون خانهٔ خالی) */
  const useTrioLayout =
    viewMode === 'grid' && !expanded && visible.length === 3;

  return (
    <section
      id={`lists-category-${categoryId}`}
      className={`mb-4 w-full min-w-0 lg:mb-6 ${SCROLL_MT}`}
    >
      <div className="mb-3 flex items-center gap-2 lg:mb-4">
        <h2 className="flex min-w-0 flex-1 items-center gap-1.5 wibe-h3">
          {icon ? <span aria-hidden>{icon}</span> : null}
          <span className="truncate">{title}</span>
          <span className="shrink-0 wibe-caption font-normal text-wibe-secondary tabular-nums">
            {lists.length.toLocaleString('fa-IR')} لیست
          </span>
        </h2>
        {hasMore && !expanded && (
          onShowAllCategory ? (
            <button
              type="button"
              onClick={() => onShowAllCategory(categoryId, categorySlug)}
              className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 wibe-caption font-semibold text-primary transition-colors hover:bg-primary/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              مشاهده دسته
            </button>
          ) : (
            <Link
              href={filterHref}
              className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 wibe-caption font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              مشاهده دسته
            </Link>
          )
        )}
      </div>

      {useTrioLayout ? (
        <div className="grid grid-cols-2 grid-rows-2 gap-2 lg:gap-3">
          <div className="row-span-2 min-h-0">
            <ListCardCompact
              list={visible[0]!}
              variant={cardVariant}
              showCreator={false}
              isBookmarked={bookmarkedIds?.has(visible[0]!.id)}
              onBookmarkToggle={onBookmarkToggle}
              fillHeight
            />
          </div>
          {visible.slice(1).map((list) => (
            <div key={list.id} className="min-h-0">
              <ListCardCompact
                list={list}
                variant={cardVariant}
                showCreator={false}
                isBookmarked={bookmarkedIds?.has(list.id)}
                onBookmarkToggle={onBookmarkToggle}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={gridClass}>
          {visible.map((list, index) => (
            <div
              key={list.id}
              className={
                !expanded && index >= LISTS_SECTION_PREVIEW_MOBILE ? 'max-lg:hidden' : undefined
              }
            >
              <ListCardCompact
                list={list}
                variant={cardVariant}
                showCreator={false}
                isBookmarked={bookmarkedIds?.has(list.id)}
                onBookmarkToggle={onBookmarkToggle}
              />
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-3 flex justify-center">
          {expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-1 rounded-full border border-wibe bg-wibe-card px-4 py-2 wibe-caption font-medium text-wibe-secondary transition-colors hover:border-primary/30 hover:text-primary"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
              نمایش کمتر
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 wibe-caption font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <ChevronDown className="h-4 w-4" />
              نمایش{' '}
              <span className="lg:hidden">{moreMobile.toLocaleString('fa-IR')}</span>
              <span className="hidden lg:inline">{moreDesktop.toLocaleString('fa-IR')}</span>
              {' '}لیست دیگر
            </button>
          )}
        </div>
      )}
    </section>
  );
}
