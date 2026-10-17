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
      <Link href={`/lists/${list.slug}`} className="block active:scale-95 transition-transform">
        <div className="overflow-hidden rounded-surface border border-border bg-popover shadow-surface">
          <div className="relative aspect-video bg-muted">
            {(list.bannerImage ?? list.coverImage) ? (
              <ImageWithFallback
                src={list.bannerImage ?? list.coverImage ?? ''}
                alt={list.title}
                className="w-full h-full object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-5xl opacity-40">
                📋
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className="absolute end-3 top-3 rounded-full bg-warning px-2 py-1 text-xs font-semibold text-foreground">
              وایرال
            </span>
            <div className="absolute inset-x-0 bottom-0 p-4 text-start">
              <h3 className="wibe-h3 text-white line-clamp-2">{list.title}</h3>
              <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="overlay" className="mt-1" />
            </div>
          </div>
          <div className="p-3">
            <p className="text-center text-sm text-muted-foreground">ببین چرا وایرال شده</p>
          </div>
        </div>
      </Link>
    </section>
  );
}
