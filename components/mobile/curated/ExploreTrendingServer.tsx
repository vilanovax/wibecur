import Image from 'next/image';
import ExploreSectionTitle from './ExploreSectionTitle';
import ExploreTrendingPrefetchLink from './ExploreTrendingPrefetchLink';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import type { CuratedList } from '@/types/curated';

type ExploreTrendingServerProps = {
  lists: CuratedList[];
  subtitle?: string;
};

function isRenderableCover(src: string | null | undefined): src is string {
  return Boolean(src && (src.startsWith('/') || src.startsWith('http')));
}

export default function ExploreTrendingServer({
  lists,
  subtitle = 'بر اساس ذخیره',
}: ExploreTrendingServerProps) {
  if (lists.length === 0) return null;

  return (
    <section id="trending" className="px-2.5 py-4 lg:px-0 lg:py-5" aria-labelledby="trending-title">
      <ExploreSectionTitle
        id="trending-title"
        title="داغ‌ترین لیست‌های امروز"
        subtitle={subtitle}
        icon="🔥"
      />

      <div className="scrollbar-hide -mx-2.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2.5 pb-1 lg:mx-0 lg:px-0">
        {lists.map((list, index) => (
          <div
            key={list.id}
            className="w-[78%] max-w-[280px] shrink-0 snap-start sm:w-[46%] md:w-[38%] lg:w-[calc(25%-0.5625rem)] lg:max-w-none xl:w-[calc(20%-0.6rem)]"
          >
            <ExploreTrendingCard list={list} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ExploreTrendingCard({
  list,
  priority = false,
}: {
  list: CuratedList;
  priority?: boolean;
}) {
  const href = `/lists/${list.slug}`;
  const coverSrc = isRenderableCover(list.coverUrl) ? list.coverUrl : null;
  const cover = coverSrc ? resolveNextImageSrc(coverSrc) : null;

  return (
    <ExploreTrendingPrefetchLink
      href={href}
      className="group block transition-transform active:scale-[0.99] lg:hover:scale-[1.01]"
    >
      <div className="overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm lg:rounded-xl lg:group-hover:shadow-md">
        <div className="relative aspect-[4/3] bg-gray-200 lg:aspect-[16/10]">
          {cover ? (
            <Image
              src={cover.src}
              alt={list.title}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 78vw"
              className="object-cover transition-transform duration-500 lg:group-hover:scale-105"
              priority={priority}
              unoptimized={cover.unoptimized}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-2xl">
              {list.category?.icon ?? '📋'}
            </div>
          )}
          <span className="absolute right-2 top-2 z-10 rounded-full bg-warning px-2 py-0.5 wibe-caption font-semibold text-white lg:text-xs">
            ترند
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent lg:from-black/85" />
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-right lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-white lg:text-base lg:font-bold lg:leading-snug">
              {list.title}
            </h3>
          </div>
        </div>
      </div>
    </ExploreTrendingPrefetchLink>
  );
}
