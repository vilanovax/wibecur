'use client';

import Link from 'next/link';
import { DEFAULT_FILM_GENRES } from '@/lib/film-genres';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import type { FilmGenreChip } from '@/types/category-page';

interface GenreScrollBarProps {
  categorySlug: string;
  genres?: FilmGenreChip[];
  inset?: boolean;
}

/** ژانرها — از تگ‌های DB + fallback */
export default function GenreScrollBar({ categorySlug, genres, inset = false }: GenreScrollBarProps) {
  const chips: FilmGenreChip[] =
    genres && genres.length > 0
      ? genres
      : DEFAULT_FILM_GENRES.map((g) => ({ ...g, listCount: 0 }));

  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="wibe-caption font-semibold text-wibe-secondary">ژانرها</p>
        <Link
          href={`/lists?category=${categorySlug}`}
          className="wibe-caption font-semibold text-primary transition-colors hover:text-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          همه لیست‌ها
        </Link>
      </div>
      <div
        dir="rtl"
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory lg:flex-wrap lg:justify-start lg:overflow-visible lg:gap-2"
      >
        {chips.map((genre) => (
          <Link
            key={`${genre.slug}-${genre.label}`}
            href={`/lists?category=${categorySlug}&tag=${encodeURIComponent(genre.label)}`}
            className="flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-wibe bg-wibe-card px-3.5 py-2 wibe-small font-medium text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span aria-hidden>{genre.icon}</span>
            <span>{genre.label}</span>
            {genre.listCount > 0 && (
              <span className="rounded-full bg-wibe-surface px-1.5 py-0.5 wibe-caption font-bold tabular-nums text-wibe-secondary">
                {genre.listCount.toLocaleString('fa-IR')}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
