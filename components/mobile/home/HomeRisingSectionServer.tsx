import Link from 'next/link';
import Image from 'next/image';
import { buildDesktopFeedCells } from '@/lib/home-feed-grid';
import { isSeeAllCell } from '@/lib/home-feed-grid';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import HomeListCardServer from '@/components/mobile/home/HomeListCardServer';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import type { RisingListData } from '@/types/home-data';

type HomeRisingSectionServerProps = {
  lists: RisingListData[];
};

export default function HomeRisingSectionServer({ lists }: HomeRisingSectionServerProps) {
  if (lists.length === 0) return null;

  const desktopCells = buildDesktopFeedCells(lists, {
    maxLists: 8,
    seeAll: {
      href: '/lists?mode=popular',
      label: 'مشاهده همه',
      description: 'لیست‌های در حال اوج',
    },
  });

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-start justify-between gap-3 px-4 lg:mb-4 lg:items-center lg:px-0">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 wibe-h3">
            <span aria-hidden>🚀</span>
            در حال اوج گرفتن
          </h2>
          <p className="mt-0.5 wibe-caption text-wibe-secondary">
            رشد سریع ذخیره در ۲۴ ساعت اخیر
          </p>
        </div>
        <Link
          href="/lists?mode=popular"
          className="shrink-0 wibe-caption font-semibold text-primary hover:underline"
        >
          همه
        </Link>
      </div>

      <div className="space-y-2 px-4 lg:hidden">
        {lists.map((list) => {
          const cover = list.coverImage ? resolveNextImageSrc(list.coverImage) : null;
          return (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex flex-row-reverse gap-3 overflow-hidden rounded-lg border border-wibe bg-wibe-card p-3 shadow-sm transition-transform active:scale-[0.99]"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-wibe-surface">
              {cover ? (
                <Image
                  src={cover.src}
                  alt={list.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized={cover.unoptimized}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-wibe-surface text-lg">
                  {list.categories?.icon ?? '📋'}
                </div>
              )}
              {list.isFastRising ? (
                <span className="absolute right-1 top-1 rounded-pill bg-amber-500 px-1.5 py-0.5 wibe-caption font-semibold text-white">
                  ↑
                </span>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">
                {list.title}
              </h3>
              {list.itemCount > 0 ? (
                <p className="mt-1 wibe-caption text-wibe-secondary">
                  {list.itemCount.toLocaleString('fa-IR')} آیتم
                </p>
              ) : null}
            </div>
          </Link>
          );
        })}
      </div>

      <div className={`hidden lg:grid lg:overflow-visible lg:snap-none lg:px-0 ${HOME_FEED_GRID_CLASS}`}>
        {desktopCells.map((cell, index) => {
          if (isSeeAllCell(cell)) {
            return (
              <Link
                key={`see-all-${index}`}
                href={cell.href}
                className="group block lg:h-full lg:w-full lg:shrink"
              >
                <div className="flex aspect-[5/4] h-full max-h-[11.5rem] flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-center transition-colors hover:border-primary/45 hover:bg-primary/10 sm:aspect-[4/3] lg:aspect-auto lg:min-h-[8.5rem] lg:max-h-[11.5rem] lg:rounded-xl lg:px-4 lg:py-3">
                  <span className="wibe-small font-semibold text-primary">
                    {cell.label}
                  </span>
                </div>
              </Link>
            );
          }

          const badge = cell.data.isFastRising ? 'سریع' : null;
          return (
            <HomeListCardServer
              key={cell.data.id}
              list={cell.data}
              badge={badge}
              badgeClassName="bg-amber-500 text-white"
            />
          );
        })}
      </div>
    </section>
  );
}
