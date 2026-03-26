'use client';

import Link from 'next/link';

type GenreChip = { slug: string; label: string; icon: string };

const FILM_GENRES: GenreChip[] = [
  { slug: 'drama', label: 'درام', icon: '🎭' },
  { slug: 'comedy', label: 'کمدی', icon: '😂' },
  { slug: 'action', label: 'اکشن', icon: '💥' },
  { slug: 'horror', label: 'ترسناک', icon: '😱' },
  { slug: 'mind', label: 'ذهنی', icon: '🧠' },
  { slug: 'classic', label: 'کلاسیک', icon: '🎬' },
  { slug: 'irani', label: 'ایرانی', icon: '🇮🇷' },
  { slug: 'foreign', label: 'خارجی', icon: '🌍' },
];

const BOOK_GENRES: GenreChip[] = [
  { slug: 'novel', label: 'رمان', icon: '📖' },
  { slug: 'poetry', label: 'شعر', icon: '🪶' },
  { slug: 'history', label: 'تاریخی', icon: '📜' },
  { slug: 'philosophy', label: 'فلسفی', icon: '🤔' },
  { slug: 'psychology', label: 'روانشناسی', icon: '🧠' },
  { slug: 'science', label: 'علمی', icon: '🔬' },
  { slug: 'selfhelp', label: 'خودیاری', icon: '💡' },
  { slug: 'irani', label: 'ایرانی', icon: '🇮🇷' },
];

const CATEGORY_GENRES: Record<string, GenreChip[]> = {
  movie: FILM_GENRES,
  movies: FILM_GENRES,
  film: FILM_GENRES,
  'film-serial': FILM_GENRES,
  book: BOOK_GENRES,
  books: BOOK_GENRES,
};

interface GenreScrollBarProps {
  categorySlug: string;
}

/** اسکرول افقی ژانرها — فیلم، کتاب و ... */
export default function GenreScrollBar({ categorySlug }: GenreScrollBarProps) {
  const genres = CATEGORY_GENRES[categorySlug];
  if (!genres || genres.length === 0) return null;

  return (
    <section className="px-4 py-3">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
        {genres.map((genre) => (
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
