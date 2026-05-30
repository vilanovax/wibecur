'use client';

import Link from 'next/link';
import { Bookmark, ChevronLeft } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';

interface ListsFeaturedBannerProps {
  list: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverImage?: string | null;
    saveCount?: number;
    categories?: { slug?: string | null; icon?: string | null } | null;
  };
}

export default function ListsFeaturedBanner({ list }: ListsFeaturedBannerProps) {
  const categorySlug = list.categories?.slug ?? null;

  return (
    <section className="mb-4" aria-label="منتخب">
      <p className="wibe-caption text-wibe-secondary mb-2 px-0.5">⭐ منتخب</p>
      <Link
        href={`/lists/${list.slug}`}
        className="block relative rounded-lg overflow-hidden h-[120px] border border-wibe shadow-sm active:scale-[0.99] transition-transform"
      >
        <ListCoverImage
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          className="absolute inset-0 w-full h-full object-cover"
          fallbackIcon={list.categories?.icon ?? '📋'}
          fallbackClassName="w-full h-full flex items-center justify-center text-4xl bg-gray-200"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/45 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-3">
          <h2 className="wibe-small font-bold text-white line-clamp-2">{list.title}</h2>
          {list.description && (
            <p className="wibe-caption text-white/85 line-clamp-1 mt-0.5">{list.description}</p>
          )}
          <p className="wibe-caption text-white/75 flex items-center gap-1 mt-1.5">
            <Bookmark className="w-3.5 h-3.5" />
            {(list.saveCount ?? 0).toLocaleString('fa-IR')} ذخیره
            <ChevronLeft className="w-3.5 h-3.5 mr-auto opacity-80" aria-hidden />
          </p>
        </div>
      </Link>
    </section>
  );
}
