'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import ListCardCompact from '@/components/mobile/lists/ListCardCompact';
import {
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
  isDesktop?: boolean;
  previewCount?: number;
  bookmarkedIds?: Set<string>;
  onBookmarkToggle?: (listId: string, isBookmarked: boolean) => void;
  onShowAllCategory?: (categoryId: string, categorySlug?: string) => void;
}

const SCROLL_MT = 'scroll-mt-[154px]';

export default function ListsCategorySection({
  title,
  icon,
  categoryId,
  categorySlug,
  lists,
  viewMode,
  isDesktop = false,
  previewCount = 6,
  bookmarkedIds,
  onBookmarkToggle,
  onShowAllCategory,
}: ListsCategorySectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (lists.length === 0) return null;

  const hasMore = lists.length > previewCount;
  const visible = expanded || !hasMore ? lists : lists.slice(0, previewCount);
  const filterHref = categorySlug
    ? `/lists?category=${categorySlug}`
    : `/lists?category=${categoryId}`;

  const cardVariant = resolveListCardVariant(viewMode, isDesktop);
  const gridClass = listsResultsGridClass(viewMode, isDesktop);

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
            {lists.length.toLocaleString('fa-IR')}
          </span>
        </h2>
        {hasMore && !expanded && (
          onShowAllCategory ? (
            <button
              type="button"
              onClick={() => onShowAllCategory(categoryId, categorySlug)}
              className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 wibe-caption font-semibold text-primary transition-colors hover:bg-primary/10 active:scale-[0.98]"
            >
              همه
            </button>
          ) : (
            <Link
              href={filterHref}
              className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 wibe-caption font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              همه
            </Link>
          )
        )}
      </div>

      <div className={gridClass}>
        {visible.map((list) => (
          <ListCardCompact
            key={list.id}
            list={list}
            variant={cardVariant}
            showCreator={false}
            isBookmarked={bookmarkedIds?.has(list.id)}
            onBookmarkToggle={onBookmarkToggle}
          />
        ))}
      </div>

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
              نمایش {(lists.length - previewCount).toLocaleString('fa-IR')} لیست دیگر
            </button>
          )}
        </div>
      )}
    </section>
  );
}
