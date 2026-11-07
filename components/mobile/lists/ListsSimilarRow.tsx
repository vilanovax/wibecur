'use client';

import ListCardCompact from '@/components/mobile/lists/ListCardCompact';

type ListItem = Parameters<typeof ListCardCompact>[0]['list'];

interface ListsSimilarRowProps {
  lists: ListItem[];
  title?: string;
}

export default function ListsSimilarRow({
  lists,
  title = 'پیشنهاد برای تو',
}: ListsSimilarRowProps) {
  if (lists.length === 0) return null;

  return (
    <section className="mt-2 border-t border-border pt-4 lg:pt-5" aria-label={title}>
      <h2 className="mb-2.5 flex items-center gap-1.5 wibe-h3">
        <span aria-hidden>✨</span>
        <span>{title}</span>
      </h2>
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 scrollbar-hide lg:grid lg:grid-cols-3 lg:gap-3 lg:overflow-visible lg:snap-none xl:grid-cols-4">
        {lists.map((list) => (
          <div key={list.id} className="w-[min(220px,72vw)] shrink-0 snap-start lg:w-full lg:max-w-none">
            <ListCardCompact
              list={list}
              variant="compact"
              fetchPriority="low"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
