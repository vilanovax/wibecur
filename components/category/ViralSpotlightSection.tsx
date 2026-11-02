'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from './CategorySectionTitle';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import { getCoverDisplayFlags } from '@/lib/admin/category-form-constants';
import type { CategoryListCard } from '@/types/category-page';

interface ViralSpotlightSectionProps {
  list: CategoryListCard;
  accentColor?: string;
  inset?: boolean;
  coverDisplayMode?: string | null;
}

export default function ViralSpotlightSection({
  list,
  inset = false,
  coverDisplayMode,
}: ViralSpotlightSectionProps) {
  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;
  const { showScrim, showTitleOnCover, showTitleBelow } = getCoverDisplayFlags(coverDisplayMode);

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
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-5xl opacity-40">
                📋
              </div>
            )}
            {showScrim ? (
              <div className="absolute inset-0 bg-linear-to-t from-foreground/80 via-transparent to-transparent" />
            ) : (
              <div className="absolute inset-0 bg-linear-to-t from-foreground/40 via-transparent to-transparent" />
            )}
            <span className="absolute inset-e-3 top-3 z-10 rounded-full bg-warning px-2 py-1 text-xs font-semibold text-foreground">
              وایرال
            </span>
            {showTitleOnCover ? (
              <div className="absolute inset-x-0 bottom-0 p-4 text-start">
                <h3 className="wibe-h3 text-background line-clamp-2">{list.title}</h3>
                <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="overlay" className="mt-1" />
              </div>
            ) : (
              <span className="sr-only">{list.title}</span>
            )}
          </div>
          {showTitleBelow || !showTitleOnCover ? (
            <div className="space-y-1 p-3 text-start">
              {!showTitleOnCover ? (
                <h3 className="line-clamp-2 wibe-h3 text-foreground">{list.title}</h3>
              ) : null}
              <p className="text-center text-sm text-muted-foreground">ببین چرا وایرال شده</p>
            </div>
          ) : (
            <div className="p-3">
              <p className="text-center text-sm text-muted-foreground">ببین چرا وایرال شده</p>
            </div>
          )}
        </div>
      </Link>
    </section>
  );
}
