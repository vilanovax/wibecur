'use client';

import Link from 'next/link';
import ListCardCompact from '@/components/mobile/lists/ListCardCompact';

type ListItem = Parameters<typeof ListCardCompact>[0]['list'];

interface ListsCategorySectionProps {
  title: string;
  icon?: string | null;
  categoryId: string;
  categorySlug?: string;
  lists: ListItem[];
  viewMode: 'grid' | 'compact';
  previewCount?: number;
  bookmarkedIds?: Set<string>;
  onBookmarkToggle?: (listId: string, isBookmarked: boolean) => void;
}

const SCROLL_MT = 'scroll-mt-[112px]';

export default function ListsCategorySection({
  title,
  icon,
  categoryId,
  categorySlug,
  lists,
  viewMode,
  previewCount = 4,
  bookmarkedIds,
  onBookmarkToggle,
}: ListsCategorySectionProps) {
  if (lists.length === 0) return null;

  const preview = lists.slice(0, previewCount);
  const hasMore = lists.length > previewCount;
  const filterHref = categorySlug
    ? `/lists?category=${categorySlug}`
    : `/lists?category=${categoryId}`;

  return (
    <section
      id={`lists-category-${categoryId}`}
      className={`mb-4 lg:mb-5 ${SCROLL_MT}`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-1.5 wibe-h3">
          {icon ? <span aria-hidden>{icon}</span> : null}
          <span className="truncate">{title}</span>
        </h2>
        {hasMore && (
          <Link href={filterHref} className="shrink-0 wibe-caption font-medium text-primary">
            همه ({lists.length.toLocaleString('fa-IR')})
          </Link>
        )}
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {preview.map((list) => (
            <ListCardCompact
              key={list.id}
              list={list}
              variant="grid"
              showCreator={false}
              isBookmarked={bookmarkedIds?.has(list.id)}
              onBookmarkToggle={onBookmarkToggle}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-3">
          {preview.map((list) => (
            <ListCardCompact
              key={list.id}
              list={list}
              variant="compact"
              showCreator={false}
              isBookmarked={bookmarkedIds?.has(list.id)}
              onBookmarkToggle={onBookmarkToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}
