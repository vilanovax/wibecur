'use client';

import ListCardCompact from '@/components/mobile/lists/ListCardCompact';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';

type ListItem = Parameters<typeof ListCardCompact>[0]['list'];

interface ListsSimilarRowProps {
  lists: ListItem[];
  title?: string;
  bookmarkedIds?: Set<string>;
  onBookmarkToggle?: (listId: string, isBookmarked: boolean) => void;
}

export default function ListsSimilarRow({
  lists,
  title = 'پیشنهاد برای تو',
  bookmarkedIds,
  onBookmarkToggle,
}: ListsSimilarRowProps) {
  const isDesktop = useIsDesktop();
  if (lists.length === 0) return null;

  return (
    <section className="mt-3 border-t border-wibe/60 pt-5 lg:mt-4 lg:pt-6" aria-label={title}>
      <h2 className="mb-3.5 flex items-center gap-1.5 wibe-h3">
        <span aria-hidden>✨</span>
        <span>{title}</span>
      </h2>
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 scrollbar-hide lg:grid lg:grid-cols-3 lg:gap-3 lg:overflow-visible lg:snap-none xl:grid-cols-4">
        {lists.map((list) => (
          <div
            key={list.id}
            className="w-[min(11.5rem,46vw)] shrink-0 snap-start lg:w-full lg:max-w-none"
          >
            <ListCardCompact
              list={list}
              variant={isDesktop ? 'compact' : 'grid'}
              isBookmarked={bookmarkedIds?.has(list.id)}
              onBookmarkToggle={onBookmarkToggle}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
