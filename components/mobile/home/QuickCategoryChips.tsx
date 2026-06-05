'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

type CategoryChip = { id: string; slug: string; name: string; icon: string | null };

async function fetchActiveCategories(): Promise<CategoryChip[]> {
  const res = await fetch('/api/categories');
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  return json.data ?? [];
}

export default function QuickCategoryChips() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'active', 'menu'],
    queryFn: fetchActiveCategories,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <section
      className="px-4 py-2 pb-3 lg:border-b lg:border-wibe/60 lg:px-0 lg:py-3 lg:pb-4"
      aria-label="دسته‌های سریع"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1 lg:mx-0 lg:flex-wrap lg:justify-start lg:gap-2 lg:overflow-visible">
        {isLoading && categories.length === 0 ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="h-9 w-20 flex-shrink-0 rounded-lg bg-wibe-muted animate-pulse"
              />
            ))}
          </>
        ) : (
          categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="flex h-9 flex-shrink-0 snap-start items-center whitespace-nowrap rounded-lg border border-wibe bg-wibe-card px-3.5 wibe-small font-medium text-foreground shadow-sm transition-all hover:border-primary/30 active:scale-[0.98] lg:h-8 lg:bg-wibe-surface lg:px-3 lg:py-0 lg:wibe-caption"
            >
              {cat.icon ? `${cat.icon} ` : ''}
              {cat.name}
            </Link>
          ))
        )}
        <Link
          href="/categories"
          className="flex h-9 flex-shrink-0 snap-start items-center whitespace-nowrap rounded-lg border border-wibe bg-wibe-card px-3.5 wibe-small font-medium text-foreground shadow-sm transition-all hover:border-primary/30 active:scale-[0.98] lg:h-8 lg:bg-wibe-surface lg:px-3 lg:py-0 lg:wibe-caption"
        >
          📂 همه دسته‌ها
        </Link>
      </div>
    </section>
  );
}
