'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string | null;
  listCount: number;
}

async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch('/api/home/categories');
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) return [];
  return json.data;
}

const CATEGORY_TINTS: Record<string, string> = {
  movie: 'bg-violet-50/90 border-violet-100',
  film: 'bg-violet-50/90 border-violet-100',
  book: 'bg-amber-50/90 border-amber-100',
  books: 'bg-amber-50/90 border-amber-100',
  cafe: 'bg-stone-50/90 border-stone-200',
  restaurant: 'bg-stone-50/90 border-stone-200',
  podcast: 'bg-pink-50/90 border-pink-100',
  default: 'bg-gray-50/90 border-gray-100',
};

function getCategoryTint(slug: string): string {
  return CATEGORY_TINTS[slug] ?? CATEGORY_TINTS.default;
}

const FALLBACK_CATEGORIES = [
  { id: 'movie', slug: 'movie', name: 'فیلم', icon: '🎬', color: '#8B5CF6', listCount: 0 },
  { id: 'book', slug: 'book', name: 'کتاب', icon: '📚', color: '#EA580C', listCount: 0 },
  { id: 'cafe', slug: 'cafe', name: 'کافه', icon: '☕', color: '#D97706', listCount: 0 },
  { id: 'restaurant', slug: 'cafe', name: 'رستوران', icon: '🍽', color: '#B45309', listCount: 0 },
];

export default function CategoryGridHome() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['home', 'categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });

  const base = categories.length > 0 ? categories.slice(0, 4) : [];
  const baseSlugs = new Set(base.map((c) => c.slug));
  const pad = FALLBACK_CATEGORIES.filter((f) => !baseSlugs.has(f.slug));
  const items = base.length >= 4 ? base : [...base, ...pad].slice(0, 4);

  if (isLoading && items.length === 0) {
    return (
      <section className="mb-6 px-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl h-24 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="px-4 pt-5 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-px bg-gray-200" />
          <Link href="/lists" className="text-gray-500 text-xs font-medium shrink-0">
            همه دسته‌ها
          </Link>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <h2 className="text-[18px] font-semibold leading-[1.4] text-gray-900 mt-3">دسته‌بندی‌ها</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        {items.slice(0, 4).map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className={`rounded-[18px] overflow-hidden p-4 flex flex-col justify-between min-h-[88px] border shadow-vibe-card hover:shadow-vibe-card active:scale-[0.98] transition-all ${getCategoryTint(cat.slug)}`}
          >
            <span className="text-xl opacity-90">{cat.icon}</span>
            <div>
              <p className="font-semibold text-[15px] leading-[1.4] text-gray-900">{cat.name}</p>
              {cat.listCount > 0 && (
                <p className="text-[12px] font-medium text-gray-500/75 mt-1">
                  {cat.listCount.toLocaleString('fa-IR')} لیست
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
