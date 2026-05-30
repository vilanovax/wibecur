'use client';

import CuratedGridCard from './CuratedGridCard';
import SponsoredSlotCard from './SponsoredSlotCard';
import type { CuratedList } from '@/types/curated';

interface CuratedGridProps {
  lists: CuratedList[];
  showSponsoredAfter?: number;
}

export default function CuratedGrid({ lists, showSponsoredAfter = 8 }: CuratedGridProps) {
  const items: (CuratedList | 'sponsored')[] = [];
  lists.forEach((list, i) => {
    items.push(list);
    if (showSponsoredAfter < 99 && (i + 1) % showSponsoredAfter === 0 && i + 1 < lists.length) {
      items.push('sponsored');
    }
  });

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, idx) =>
        item === 'sponsored' ? (
          <SponsoredSlotCard key={`sponsored-${idx}`} />
        ) : (
          <CuratedGridCard key={item.id} list={item} />
        )
      )}
    </div>
  );
}
