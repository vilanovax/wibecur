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
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">ژانرها</p>
        <Link
          href={`/lists?category=${categorySlug}`}
          className="inline-flex h-11 items-center text-xs font-medium"
        >
          <span className="text-brand">همه لیست‌ها</span>
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
            className="flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border border-border bg-popover px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>{genre.icon}</span>
            <span>{genre.label}</span>
            {genre.listCount > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground tabular-nums">
                {genre.listCount.toLocaleString('fa-IR')}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
