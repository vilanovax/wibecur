'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from '../CategorySectionTitle';
import type { CategoryListCard } from '@/types/category-page';

interface FeaturedCinematicListProps {
  list: CategoryListCard;
}

export default function FeaturedCinematicList({ list }: FeaturedCinematicListProps) {
  const tagline = list.description || 'لیست ویژه این هفته';
  const shortTagline = tagline.length > 60 ? `${tagline.slice(0, 57)}...` : tagline;

  return (
    <section className="px-4 py-6">
      <CategorySectionTitle title="لیست ویژه هفته" icon="🎞" />

      <Link href={`/lists/${list.slug}`} className="block active:scale-[0.99] transition-transform">
        <div className="relative rounded-lg overflow-hidden bg-wibe-card border border-wibe shadow-card">
          <div className="relative aspect-[21/9] min-h-[160px] bg-gray-800">
            {list.coverImage ? (
              <ImageWithFallback
                src={list.coverImage}
                alt={list.title}
                className="w-full h-full object-cover"
                placeholderSize="cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl opacity-40 bg-gray-800">
                🎬
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <h3 className="wibe-h3 text-white line-clamp-1">{list.title}</h3>
              <p className="wibe-small text-white/90 mt-1 line-clamp-2">{shortTagline}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="wibe-caption text-white/80">{list.creator?.name || 'کیوریتور'}</span>
                <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="overlay" />
              </div>
              <span className="mt-3 inline-flex items-center justify-center py-2 px-4 rounded-md wibe-small font-semibold text-white bg-primary w-fit">
                مشاهده لیست
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
