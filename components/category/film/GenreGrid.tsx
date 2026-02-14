'use client';

import Link from 'next/link';

const FILM_GENRES = [
  { slug: 'action', label: 'اکشن', icon: '🎬', gradient: 'from-red-600 to-orange-600' },
  { slug: 'drama', label: 'درام', icon: '💔', gradient: 'from-blue-700 to-indigo-700' },
  { slug: 'comedy', label: 'کمدی', icon: '😂', gradient: 'from-yellow-500 to-amber-500' },
  { slug: 'horror', label: 'ترسناک', icon: '👻', gradient: 'from-purple-900 to-gray-900' },
  { slug: 'scifi', label: 'علمی‌تخیلی', icon: '🚀', gradient: 'from-cyan-600 to-blue-700' },
  { slug: 'romance', label: 'عاشقانه', icon: '❤️', gradient: 'from-pink-500 to-rose-600' },
  { slug: 'animation', label: 'انیمیشن', icon: '🌈', gradient: 'from-green-500 to-emerald-600' },
  { slug: 'documentary', label: 'مستند', icon: '📽️', gradient: 'from-slate-600 to-slate-800' },
] as const;

interface GenreGridProps {
  categorySlug: string;
}

/** گرید ژانرها — هر ژانر به صفحه لیست‌ها با فیلتر مربوط لینک می‌دهد */
export default function GenreGrid({ categorySlug }: GenreGridProps) {
  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        🎬 ژانرها
      </h2>
      <p className="text-sm text-gray-600 mb-5">
        کاوش در ژانرهای مختلف فیلم و سریال
      </p>

      <div className="grid grid-cols-4 gap-3">
        {FILM_GENRES.map((genre) => (
          <Link
            key={genre.slug}
            href={`/lists?category=${categorySlug}&tag=${encodeURIComponent(genre.label)}`}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-900 border border-gray-800 active:scale-[0.96] transition-transform min-h-[90px]"
          >
            <span
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${genre.gradient} text-2xl mb-2 shadow-lg`}
            >
              {genre.icon}
            </span>
            <span className="text-xs font-semibold text-gray-100 text-center leading-tight line-clamp-2">
              {genre.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
