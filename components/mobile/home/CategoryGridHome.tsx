'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import HomeSectionTitle from './HomeSectionTitle';

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

const FALLBACK_CATEGORIES = [
  { id: 'movie', slug: 'movie', name: 'فیلم', icon: '🎬', color: '#6366F1', listCount: 0 },
  { id: 'book', slug: 'book', name: 'کتاب', icon: '📚', color: '#6366F1', listCount: 0 },
  { id: 'cafe', slug: 'cafe', name: 'کافه', icon: '☕', color: '#6366F1', listCount: 0 },
  { id: 'travel', slug: 'travel', name: 'سفر', icon: '🌍', color: '#6366F1', listCount: 0 },
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
            <div key={i} className="rounded-lg h-24 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 border-t border-wibe pb-4 pt-4">
      <HomeSectionTitle title="دسته‌بندی‌ها" actionHref="/categories" actionLabel="همه" />
      <div className="mt-1 grid grid-cols-2 gap-3 px-4">
        {items.slice(0, 4).map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="rounded-lg overflow-hidden p-4 flex flex-col justify-between min-h-[88px] border border-wibe bg-wibe-card shadow-sm active:scale-[0.98] transition-transform"
          >
            <span className="text-xl">{cat.icon}</span>
            <div>
              <p className="wibe-small font-semibold text-foreground">{cat.name}</p>
              {cat.listCount > 0 && (
                <p className="wibe-caption text-wibe-secondary mt-1">
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
