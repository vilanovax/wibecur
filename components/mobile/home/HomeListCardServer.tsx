import Link from 'next/link';
import Image from 'next/image';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import type { HomeListData } from '@/types/home-data';

type HomeListCardServerProps = {
  list: Pick<HomeListData, 'id' | 'title' | 'slug' | 'coverImage' | 'categories'>;
  badge?: string | null;
  badgeClassName?: string;
};

export default function HomeListCardServer({
  list,
  badge,
  badgeClassName = 'bg-primary/90 text-white',
}: HomeListCardServerProps) {
  const cover = list.coverImage ? resolveNextImageSrc(list.coverImage) : null;

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block w-[10rem] shrink-0 snap-start lg:w-full lg:shrink"
    >
      <div className="overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-card transition-all active:scale-[0.99] lg:rounded-xl lg:hover:border-primary/20 lg:hover:shadow-md">
        <div className="relative aspect-[5/4] w-full bg-gray-100 sm:aspect-[4/3] lg:aspect-[16/10] lg:max-h-[11.5rem]">
          {badge ? (
            <span
              className={`absolute right-2 top-2 z-10 rounded-pill px-2 py-0.5 wibe-caption font-semibold shadow-sm ${badgeClassName}`}
            >
              {badge}
            </span>
          ) : null}
          {cover ? (
            <Image
              src={cover.src}
              alt={list.title}
              fill
              sizes="(max-width: 1023px) 160px, 25vw"
              className="object-cover transition-transform duration-500 lg:group-hover:scale-105"
              unoptimized={cover.unoptimized}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-3xl">
              {list.categories?.icon ?? '📋'}
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5 lg:via-black/25"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-right lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-white drop-shadow-sm lg:text-[0.8125rem] lg:leading-snug">
              {list.title}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}
