import Link from 'next/link';
import Image from 'next/image';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import type { HomeListData } from '@/types/home-data';
import { Card } from '@/components/ui/card';

type HomeListCardServerProps = {
  list: Pick<HomeListData, 'id' | 'title' | 'slug' | 'coverImage' | 'categories'>;
  badge?: string | null;
  badgeClassName?: string;
  priority?: boolean;
};

export default function HomeListCardServer({
  list,
  badge,
  badgeClassName = 'bg-brand text-brand-foreground',
  priority = false,
}: HomeListCardServerProps) {
  const cover = list.coverImage ? resolveNextImageSrc(list.coverImage) : null;

  return (
    <Link
      href={`/lists/${list.slug}`}
      prefetch={false}
      className="group block w-40 shrink-0 snap-start lg:w-full lg:shrink"
    >
      <Card className="overflow-hidden bg-popover p-0 shadow-sm transition-[colors,transform] active:scale-95 lg:hover:border-brand/20 lg:hover:shadow-md">
        <div className="relative aspect-5/4 w-full bg-muted sm:aspect-4/3 lg:aspect-16/10 lg:max-h-44">
          {badge ? (
            <span
              className={`absolute inset-e-2 top-2 z-10 rounded-full px-2 py-0.5 text-sm font-semibold shadow-sm ${badgeClassName}`}
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
              priority={priority}
              fetchPriority={priority ? 'high' : 'low'}
              className="object-cover transition-transform duration-500 lg:group-hover:scale-105"
              unoptimized={cover.unoptimized}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-3xl">
              {list.categories?.icon ?? '📋'}
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/90 via-foreground/35 to-foreground/5 lg:via-foreground/25"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-start lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-background drop-shadow-sm lg:leading-snug">
              {list.title}
            </h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}
