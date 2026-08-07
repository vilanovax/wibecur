'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from '../CategorySectionTitle';
import type { CategoryListCard } from '@/types/category-page';
import { FILM_SECTION } from './film-layout';

interface FeaturedCinematicListProps {
  list: CategoryListCard;
}

export default function FeaturedCinematicList({ list }: FeaturedCinematicListProps) {
  const tagline = list.description || 'لیست ویژه این هفته';
  const shortTagline = tagline.length > 80 ? `${tagline.slice(0, 77)}...` : tagline;

  return (
    <section className={FILM_SECTION}>
      <CategorySectionTitle title="لیست ویژه هفته" iconVariant="film" />

      <Link
        href={`/lists/${list.slug}`}
        className="group block active:scale-[0.99] transition-transform lg:hover:-translate-y-0.5"
      >
        <div className="relative rounded-xl overflow-hidden bg-wibe-card border border-wibe shadow-card lg:rounded-2xl lg:group-hover:shadow-lg lg:transition-shadow">
          <div className="relative aspect-[16/9] min-h-[160px] overflow-hidden bg-gray-900 lg:min-h-[220px]">
            {(list.bannerImage ?? list.coverImage) ? (
              <ImageWithFallback
                src={list.bannerImage ?? list.coverImage ?? ''}
                alt={list.title}
                className="absolute inset-0 h-full w-full object-cover object-center lg:group-hover:scale-[1.02] lg:transition-transform lg:duration-500"
                placeholderSize="cover"
        sizes="100vw"
      />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl opacity-40 bg-gray-800">
                🎬
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent lg:from-black/90 lg:via-black/40" />
            <div className="absolute inset-0 flex flex-col justify-end p-4 lg:flex-row lg:items-end lg:justify-between lg:p-6">
              <div className="min-w-0 flex-1">
                <h3 className="wibe-h3 text-white line-clamp-1 lg:text-2xl">{list.title}</h3>
                <p className="wibe-small text-white/90 mt-1 line-clamp-2 lg:mt-2 lg:max-w-2xl lg:text-base">
                  {shortTagline}
                </p>
                <div className="flex items-center gap-3 mt-2 lg:mt-3">
                  <span className="wibe-caption text-white/80 lg:text-sm">
                    {list.creator?.name || 'کیوریتور'}
                  </span>
                  <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="overlay" />
                </div>
              </div>
              <span className="mt-3 inline-flex items-center justify-center py-2 px-4 rounded-lg wibe-small font-semibold text-white bg-primary w-fit lg:mt-0 lg:shrink-0 lg:px-5 lg:py-2.5 lg:group-hover:bg-primary-dark lg:transition-colors">
                مشاهده لیست
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
