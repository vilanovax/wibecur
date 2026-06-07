'use client';

import Link from 'next/link';
import { FILM_SECTION_COMPACT } from './film-layout';

const FILM_GENRES = [
  { slug: 'drama', label: 'درام', icon: '🎭' },
  { slug: 'comedy', label: 'کمدی', icon: '😂' },
  { slug: 'action', label: 'اکشن', icon: '💥' },
  { slug: 'horror', label: 'ترسناک', icon: '😱' },
  { slug: 'mind', label: 'ذهنی', icon: '🧠' },
  { slug: 'classic', label: 'کلاسیک', icon: '🎬' },
  { slug: 'irani', label: 'ایرانی', icon: '🇮🇷' },
  { slug: 'foreign', label: 'خارجی', icon: '🌍' },
] as const;

interface GenreScrollBarProps {
  categorySlug: string;
}

/** ژانرها — موبایل اسکرول افقی RTL | دسکتاپ wrap */
export default function GenreScrollBar({ categorySlug }: GenreScrollBarProps) {
  return (
    <section className={FILM_SECTION_COMPACT}>
      <div
        dir="rtl"
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory lg:flex-wrap lg:justify-start lg:overflow-visible lg:gap-2"
      >
        {FILM_GENRES.map((genre) => (
          <Link
            key={genre.slug}
            href={`/lists?category=${categorySlug}&tag=${encodeURIComponent(genre.label)}`}
            className="flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3.5 py-2 text-sm font-medium text-gray-800 transition-all hover:bg-gray-200 lg:hover:border-primary/30 lg:hover:bg-primary/5"
          >
            <span>{genre.icon}</span>
            <span>{genre.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
