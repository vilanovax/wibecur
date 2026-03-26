'use client';

import Link from 'next/link';

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

/** اسکرول افقی ژانرها */
export default function GenreScrollBar({ categorySlug }: GenreScrollBarProps) {
  return (
    <section className="px-4 py-3">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
        {FILM_GENRES.map((genre) => (
            <Link
              key={genre.slug}
              href={`/lists?category=${categorySlug}&tag=${encodeURIComponent(genre.label)}`}
              className="flex-shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300"
            >
              <span>{genre.icon}</span>
              <span>{genre.label}</span>
            </Link>
        ))}
      </div>
    </section>
  );
}
