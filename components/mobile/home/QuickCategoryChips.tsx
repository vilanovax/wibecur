'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { isSameCategorySlug } from '@/lib/category-slug-aliases';

type CategoryChip = { id: string; slug: string; name: string; icon: string | null };

async function fetchActiveCategories(): Promise<CategoryChip[]> {
  const res = await fetch('/api/categories');
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  return json.data ?? [];
}

function isActiveCategorySlug(chipSlug: string, activeSlug?: string | null): boolean {
  if (!activeSlug) return false;
  return isSameCategorySlug(chipSlug, activeSlug);
}

interface QuickCategoryChipsProps {
  activeSlug?: string | null;
  variant?: 'default' | 'nav';
}

export default function QuickCategoryChips({
  activeSlug = null,
  variant = 'default',
}: QuickCategoryChipsProps) {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'active', 'menu'],
    queryFn: fetchActiveCategories,
    staleTime: 10 * 60 * 1000,
  });

  if (!isLoading && categories.length === 0) {
    return null;
  }

  const isNav = variant === 'nav';

  return (
    <section
      className={
        isNav
          ? 'px-4 py-2 lg:px-0 lg:py-2.5'
          : 'px-4 py-2 pb-3 lg:border-b lg:border-wibe/60 lg:px-0 lg:py-3 lg:pb-4'
      }
      aria-label="دسته‌های سریع"
    >
      <div
        dir="rtl"
        className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1 lg:mx-0 lg:flex-wrap lg:justify-start lg:gap-2 lg:overflow-visible"
      >
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="h-9 w-20 flex-shrink-0 rounded-lg bg-wibe-muted animate-pulse"
              />
            ))}
          </>
        ) : (
          categories.map((cat) => {
            const isActive = isActiveCategorySlug(cat.slug, activeSlug);
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-9 flex-shrink-0 snap-start items-center whitespace-nowrap rounded-lg border px-3.5 wibe-small font-medium shadow-sm transition-all active:scale-[0.98] lg:h-8 lg:px-3 lg:wibe-caption ${
                  isActive
                    ? 'border-primary bg-primary text-white shadow-sm hover:bg-primary-dark'
                    : 'border-wibe bg-wibe-card text-foreground hover:border-primary/30 lg:bg-wibe-surface'
                }`}
              >
                {cat.icon ? `${cat.icon} ` : ''}
                {cat.name}
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
