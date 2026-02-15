'use client';

import CuratedGridCard from './CuratedGridCard';
import SponsoredSlotCard from './SponsoredSlotCard';
import type { CuratedList } from '@/types/curated';

interface CuratedGridProps {
  lists: CuratedList[];
  showSponsoredAfter?: number;
}

export default function CuratedGrid({
  lists,
  showSponsoredAfter = 8,
}: CuratedGridProps) {
  const items: (CuratedList | 'sponsored')[] = [];
  lists.forEach((list, i) => {
    items.push(list);
    if ((i + 1) % showSponsoredAfter === 0 && i + 1 < lists.length) {
      items.push('sponsored');
    }
  });

  return (
    <section className="px-4 pb-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, idx) =>
          item === 'sponsored' ? (
            <SponsoredSlotCard key={`sponsored-${idx}`} />
          ) : (
            <CuratedGridCard key={item.id} list={item} />
          )
        )}
      </div>
    </section>
  );
}
