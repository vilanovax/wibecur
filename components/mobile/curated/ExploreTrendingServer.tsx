import Image from 'next/image';
import ExploreSectionTitle from './ExploreSectionTitle';
import ExploreTrendingPrefetchLink from './ExploreTrendingPrefetchLink';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import type { CuratedList } from '@/types/curated';
import { Card } from '@/components/ui/card';

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
    <section id="trending" className="px-4 py-4 lg:px-0 lg:py-5" aria-labelledby="trending-title">
      <ExploreSectionTitle
        id="trending-title"
        title="داغ‌ترین لیست‌های امروز"
        subtitle={subtitle}
        icon="🔥"
      />

      <div className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible xl:grid-cols-5">
        {lists.map((list, index) => (
          <div
            key={list.id}
            className="w-full min-w-full shrink-0 snap-start lg:min-w-0 lg:w-auto"
          >
            <ExploreTrendingCard list={list} priority={index < 2} showBadge={index === 0} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ExploreTrendingCard({
  list,
  priority = false,
  showBadge = false,
}: {
  list: CuratedList;
  priority?: boolean;
  showBadge?: boolean;
}) {
  const href = `/lists/${list.slug}`;
  const trustedCover = resolveCoverImage({
    coverImage: list.coverUrl,
    categorySlug: list.category?.slug,
    listSlug: list.slug,
    listTitle: list.title,
  });
  const coverSrc = isRenderableCover(trustedCover) ? trustedCover : null;
  const cover = coverSrc ? resolveNextImageSrc(coverSrc) : null;

  return (
    <ExploreTrendingPrefetchLink
      href={href}
      className="group block transition-transform active:scale-[0.99] lg:hover:scale-[1.01]"
    >
      <Card className="overflow-hidden bg-popover p-0 shadow-sm lg:group-hover:shadow-md">
        <div className="relative aspect-[4/3] bg-wibe-surface lg:aspect-[16/10]">
          {cover ? (
            <Image
              src={cover.src}
              alt={list.title}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 100vw"
              className="object-cover transition-transform duration-500 lg:group-hover:scale-105"
              priority={priority}
              unoptimized={cover.unoptimized}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-wibe-surface text-2xl">
              {list.category?.icon ?? '📋'}
            </div>
          )}
          {showBadge ? (
            <span className="absolute end-2 top-2 z-10 rounded-md bg-black/50 px-1.5 py-0.5 wibe-caption font-medium text-white/95 backdrop-blur-sm">
              داغ
            </span>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent lg:from-black/85" />
          <div className="absolute inset-x-0 bottom-0 p-3 text-start lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-white lg:text-base lg:font-bold lg:leading-snug">
              {list.title}
            </h3>
          </div>
        </div>
      </Card>
    </ExploreTrendingPrefetchLink>
  );
}
