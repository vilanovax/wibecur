'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from './CategorySectionTitle';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import type { CategoryListCard } from '@/types/category-page';

interface ViralSpotlightSectionProps {
  list: CategoryListCard;
  accentColor?: string;
  inset?: boolean;
}

export default function ViralSpotlightSection({
  list,
  inset = false,
}: ViralSpotlightSectionProps) {
  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <CategorySectionTitle title="وایرال این هفته" iconVariant="viral" />
      <Link href={`/lists/${list.slug}`} className="block active:scale-[0.99] transition-transform">
        <div className="rounded-lg overflow-hidden border border-wibe shadow-card bg-wibe-card">
          <div className="relative aspect-video bg-gray-200">
            {(list.bannerImage ?? list.coverImage) ? (
              <ImageWithFallback
                src={list.bannerImage ?? list.coverImage ?? ''}
                alt={list.title}
                className="w-full h-full object-cover"
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl opacity-40 bg-gray-200">
                📋
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className="absolute top-3 right-3 bg-warning text-white wibe-caption px-2 py-1 rounded-pill font-semibold">
              وایرال
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="wibe-h3 text-white line-clamp-2">{list.title}</h3>
              <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="overlay" className="mt-1" />
            </div>
          </div>
          <div className="p-3">
            <p className="wibe-caption text-wibe-secondary text-center">ببین چرا وایرال شده</p>
          </div>
        </div>
      </Link>
    </section>
  );
}
