'use client';

import ListCardCompact from '@/components/mobile/lists/ListCardCompact';

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
  if (lists.length === 0) return null;

  return (
    <section className="mt-2 border-t border-wibe pt-4" aria-label={title}>
      <h2 className="mb-2.5 wibe-h3 flex items-center gap-1.5 px-0.5">
        <span aria-hidden>✨</span>
        <span>{title}</span>
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide snap-x snap-mandatory">
        {lists.map((list) => (
          <div key={list.id} className="w-[min(220px,72vw)] shrink-0 snap-start">
            <ListCardCompact
              list={list}
              variant="mini"
              isBookmarked={bookmarkedIds?.has(list.id)}
              onBookmarkToggle={onBookmarkToggle}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
