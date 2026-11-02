'use client';

import Link from 'next/link';
import { Bookmark, ChevronLeft } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCoverTitleOverlay from '@/components/shared/ListCoverTitleOverlay';
import { getCoverDisplayFlags } from '@/lib/admin/category-form-constants';

interface ListsFeaturedBannerProps {
  list: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverImage?: string | null;
    horizontalImage?: string | null;
    bannerImage?: string | null;
    saveCount?: number;
    categories?: {
      slug?: string | null;
      icon?: string | null;
      coverDisplayMode?: string | null;
    } | null;
  };
}

export default function ListsFeaturedBanner({ list }: ListsFeaturedBannerProps) {
  const categorySlug = list.categories?.slug ?? null;
  const coverMode = list.categories?.coverDisplayMode;
  const { showTitleOnCover, showTitleBelow } = getCoverDisplayFlags(coverMode);

  return (
    <section className="mb-4" aria-label="منتخب">
      <p className="wibe-caption text-wibe-secondary mb-2 px-0.5">⭐ منتخب</p>
      <Link
        href={`/lists/${list.slug}`}
        className="block overflow-hidden rounded-lg border border-wibe shadow-sm transition-transform active:scale-[0.99]"
      >
        <div className="relative h-30 overflow-hidden">
          <ListCoverImage
            coverImage={list.coverImage}
            horizontalImage={list.horizontalImage}
            bannerImage={list.bannerImage}
            title={list.title}
            slug={list.slug}
            categorySlug={categorySlug}
            variant="banner"
            className="absolute inset-0 h-full w-full object-cover"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-4xl"
            priority
          />
          <ListCoverTitleOverlay
            coverDisplayMode={coverMode}
            title={list.title}
            scrimDirection="l"
            titleClassName="wibe-small font-bold text-white line-clamp-2"
            onCoverExtra={
              <>
                {list.description ? (
                  <p className="mt-0.5 line-clamp-1 wibe-caption text-white/85">
                    {list.description}
                  </p>
                ) : null}
                <p className="mt-1.5 flex items-center gap-1 wibe-caption text-white/75">
                  <Bookmark className="h-3.5 w-3.5" />
                  {(list.saveCount ?? 0).toLocaleString('fa-IR')} ذخیره
                  <ChevronLeft className="ms-auto h-3.5 w-3.5 opacity-80" aria-hidden />
                </p>
              </>
            }
          />
          {!showTitleOnCover ? <span className="sr-only">{list.title}</span> : null}
        </div>
        {showTitleBelow ? (
          <div className="border-t border-wibe px-3 py-2 text-start">
            <h2 className="line-clamp-2 wibe-small font-bold text-foreground">{list.title}</h2>
          </div>
        ) : null}
      </Link>
    </section>
  );
}
