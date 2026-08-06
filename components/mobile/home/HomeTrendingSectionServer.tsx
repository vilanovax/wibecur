import Link from 'next/link';
import Image from 'next/image';
import { buildDesktopFeedCells } from '@/lib/home-feed-grid';
import { isSeeAllCell } from '@/lib/home-feed-grid';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import HomeListCardServer from '@/components/mobile/home/HomeListCardServer';
import type { HomeListData } from '@/types/home-data';

type HomeTrendingSectionServerProps = {
  lists: HomeListData[];
};

export default function HomeTrendingSectionServer({ lists }: HomeTrendingSectionServerProps) {
  if (lists.length === 0) return null;

  const desktopCells = buildDesktopFeedCells(lists, {
    maxLists: 8,
    seeAll: {
      href: '/lists?mode=trending',
      label: 'مشاهده همه',
      description: 'لیست‌های ترند',
    },
  });

  return (
    <section className="mb-6 overflow-x-hidden lg:mb-0">
      <div className="mb-3 flex items-start justify-between gap-3 px-4 lg:mb-4 lg:items-center lg:px-0">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 wibe-h3">
            <span aria-hidden>🔥</span>
            ترند این هفته
          </h2>
          <p className="mt-0.5 wibe-caption text-wibe-secondary">بر اساس ذخیره و تعامل</p>
        </div>
        <Link
          href="/lists?mode=trending"
          className="shrink-0 wibe-caption font-semibold text-primary hover:underline"
        >
          همه
        </Link>
      </div>

      <div
        className={`flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-0.5 scrollbar-hide lg:hidden ${HOME_FEED_GRID_CLASS}`}
      >
        {lists.map((list) => (
          <HomeListCardServer key={list.id} list={list} />
        ))}
      </div>

      <div className={`hidden lg:grid lg:px-0 ${HOME_FEED_GRID_CLASS}`}>
        {desktopCells.map((cell, index) => {
          if (isSeeAllCell(cell)) {
            return (
              <Link
                key={`see-all-${index}`}
                href={cell.href}
                className="group block lg:h-full lg:w-full lg:shrink"
              >
                <div className="flex aspect-[5/4] h-full max-h-[11.5rem] flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-center transition-colors hover:border-primary/45 hover:bg-primary/10 sm:aspect-[4/3] lg:aspect-auto lg:min-h-[8.5rem] lg:max-h-[11.5rem] lg:rounded-xl lg:px-4 lg:py-3">
                  <span className="wibe-small font-semibold text-primary lg:text-[0.8125rem]">
                    {cell.label}
                  </span>
                  {cell.description ? (
                    <span className="mt-0.5 wibe-caption text-wibe-secondary lg:hidden">
                      {cell.description}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          }

          return <HomeListCardServer key={cell.data.id} list={cell.data} />;
        })}
      </div>
    </section>
  );
}
