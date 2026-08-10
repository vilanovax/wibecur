import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import HomeGridListCard from '@/components/mobile/home/HomeGridListCard';
import type { HomeListData } from '@/types/home-data';

type HomeTrendingCarouselServerProps = {
  lists: HomeListData[];
};

/**
 * RSC shell for mobile trending lane — cards are client (save control)
 * but first paint HTML streams from the server (no client data waterfall).
 */
export default function HomeTrendingCarouselServer({
  lists,
}: HomeTrendingCarouselServerProps) {
  if (lists.length === 0) {
    return (
      <p className="px-4 py-6 text-center wibe-small text-wibe-secondary">
        فعلاً لیست ترندی نیست
      </p>
    );
  }

  return (
    <div
      className={`flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-0.5 scrollbar-hide ${HOME_FEED_GRID_CLASS}`}
    >
      {lists.map((list) => (
        <HomeGridListCard key={list.id} list={list} homeSection="trending" />
      ))}
    </div>
  );
}
