'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import HorizontalScrollFade from '@/components/shared/HorizontalScrollFade';
import { isSameCategorySlug } from '@/lib/category-slug-aliases';
import { trackCategoryChipClick } from '@/lib/analytics';
import type { CategoryMenuChip } from '@/lib/category-menu';

async function fetchActiveCategories(): Promise<CategoryMenuChip[]> {
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
  /** از SSR — بدون fetch اولیه */
  initialCategories?: CategoryMenuChip[];
}

export default function QuickCategoryChips({
  activeSlug = null,
  variant = 'default',
  initialCategories,
}: QuickCategoryChipsProps) {
  const { data: categories = initialCategories ?? [], isLoading } = useQuery({
    queryKey: ['categories', 'active', 'menu'],
    queryFn: fetchActiveCategories,
    initialData: initialCategories,
    initialDataUpdatedAt: initialCategories ? Date.now() : undefined,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: initialCategories ? false : undefined,
    enabled: initialCategories === undefined,
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
          : 'px-4 pb-3 pt-1 lg:border-b lg:border-wibe/60 lg:px-0 lg:pb-4 lg:pt-2'
      }
      aria-label="دسته‌های سریع"
    >
      <HorizontalScrollFade
        dir="rtl"
        surface="surface"
        fadeClassName="lg:hidden"
        innerClassName="flex gap-2 snap-x snap-mandatory -mx-0.5 lg:mx-0 lg:flex-wrap lg:justify-start lg:gap-2 lg:overflow-visible"
      >
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="h-9 w-24 flex-shrink-0 animate-pulse rounded-full bg-wibe-surface"
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
                onClick={() => trackCategoryChipClick(cat.slug, cat.name)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-9 flex-shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3.5 wibe-caption font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] ${
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
      </HorizontalScrollFade>
    </section>
  );
}
