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

/** ژانرها — موبایل اسکرول افقی | دسکتاپ wrap */
export default function GenreScrollBar({ categorySlug }: GenreScrollBarProps) {
  return (
    <section className={FILM_SECTION_COMPACT}>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory lg:mx-0 lg:px-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:gap-2">
        {FILM_GENRES.map((genre) => (
          <Link
            key={genre.slug}
            href={`/lists?category=${categorySlug}&tag=${encodeURIComponent(genre.label)}`}
            className="flex-shrink-0 snap-start flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200 lg:px-3.5 lg:py-1.5 lg:hover:border-primary/30 lg:hover:bg-primary/5"
          >
            <span>{genre.icon}</span>
            <span>{genre.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
