'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from '../CategorySectionTitle';
import { getCoverDisplayFlags } from '@/lib/admin/category-form-constants';
import type { CategoryListCard } from '@/types/category-page';
import { FILM_SECTION } from './film-layout';

interface FeaturedCinematicListProps {
  list: CategoryListCard;
  coverDisplayMode?: string | null;
}

export default function FeaturedCinematicList({
  list,
  coverDisplayMode,
}: FeaturedCinematicListProps) {
  const tagline = list.description || 'لیست ویژه این هفته';
  const shortTagline = tagline.length > 80 ? `${tagline.slice(0, 77)}...` : tagline;
  const { showScrim, showTitleOnCover } = getCoverDisplayFlags(coverDisplayMode);

  return (
    <section className={FILM_SECTION}>
      <CategorySectionTitle title="لیست ویژه هفته" iconVariant="film" />

      <Link
        href={`/lists/${list.slug}`}
        className="group block active:scale-[0.99] transition-transform lg:hover:-translate-y-0.5"
      >
        <div className="relative overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-card lg:rounded-2xl lg:transition-shadow lg:group-hover:shadow-lg">
          <div className="relative aspect-16/9 min-h-40 overflow-hidden bg-gray-900 lg:min-h-55">
            {(list.bannerImage ?? list.coverImage) ? (
              <ImageWithFallback
                src={list.bannerImage ?? list.coverImage ?? ''}
                alt={list.title}
                className="absolute inset-0 h-full w-full object-cover object-center lg:transition-transform lg:duration-500 lg:group-hover:scale-[1.02]"
                placeholderSize="cover"
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-800 text-6xl opacity-40">
                🎬
              </div>
            )}
            {showScrim ? (
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent lg:from-black/90 lg:via-black/40" />
            ) : (
              <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />
            )}
            <div className="absolute inset-0 flex flex-col justify-end p-4 lg:flex-row lg:items-end lg:justify-between lg:p-6">
              <div className="min-w-0 flex-1">
                {showTitleOnCover ? (
                  <>
                    <h3 className="line-clamp-1 wibe-h3 text-white lg:text-2xl">{list.title}</h3>
                    <p className="mt-1 line-clamp-2 wibe-small text-white/90 lg:mt-2 lg:max-w-2xl lg:text-base">
                      {shortTagline}
                    </p>
                    <div className="mt-2 flex items-center gap-3 lg:mt-3">
                      <span className="wibe-caption text-white/80 lg:text-sm">
                        {list.creator?.name || 'کیوریتور'}
                      </span>
                      <ListCardStats
                        saves={list.saveCount}
                        itemCount={list.itemCount}
                        variant="overlay"
                      />
                    </div>
                  </>
                ) : (
                  <span className="sr-only">{list.title}</span>
                )}
              </div>
              <span className="mt-3 inline-flex w-fit items-center justify-center rounded-lg bg-primary px-4 py-2 wibe-small font-semibold text-white lg:mt-0 lg:shrink-0 lg:px-5 lg:py-2.5 lg:transition-colors lg:group-hover:bg-primary-dark">
                مشاهده لیست
              </span>
            </div>
          </div>
          {!showTitleOnCover ? (
            <div className="space-y-1 border-t border-wibe p-4 text-start">
              <h3 className="line-clamp-2 wibe-h3 text-foreground">{list.title}</h3>
              <p className="line-clamp-2 wibe-small text-muted-foreground">{shortTagline}</p>
            </div>
          ) : null}
        </div>
      </Link>
    </section>
  );
}
