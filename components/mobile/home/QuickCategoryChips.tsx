'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import HorizontalScrollFade from '@/components/shared/HorizontalScrollFade';
import { isSameCategorySlug } from '@/lib/category-slug-aliases';
import { trackCategoryChipClick } from '@/lib/analytics';
import type { CategoryMenuChip } from '@/lib/category-menu';
import { Skeleton } from '@/components/ui/skeleton';

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
  /** secondary = demoted browse strip (below primary home lane) */
  density?: 'default' | 'secondary';
  /** از SSR — بدون fetch اولیه */
  initialCategories?: CategoryMenuChip[];
}

export default function QuickCategoryChips({
  activeSlug = null,
  variant = 'default',
  density = 'default',
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
  const isSecondary = density === 'secondary';

  return (
    <section
      className={
        isSecondary
          ? 'mt-1 border-t border-border pb-2 pt-3 lg:mt-0 lg:border-t-0 lg:pb-1 lg:pt-2'
          : isNav
            ? 'py-2 lg:py-2.5'
            : 'py-2 pb-3 lg:border-b lg:border-border lg:py-3 lg:pb-4'
      }
      aria-label="دسته‌های سریع"
    >
      <div className="overflow-hidden px-4 lg:overflow-visible lg:px-0">
      <HorizontalScrollFade
        dir="rtl"
        surface="background"
        fadeEnd={false}
        fadeClassName="lg:hidden"
        innerClassName="flex snap-x snap-mandatory gap-1 pe-4 lg:flex-wrap lg:justify-start lg:gap-2 lg:overflow-visible lg:pe-0"
      >
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11 w-20 shrink-0 rounded-xl" />
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
                className={`flex h-11 min-w-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-3 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  isActive
                    ? 'border-brand bg-brand'
                    : 'border-border bg-popover hover:bg-muted'
                }`}
              >
                <span className={isActive ? 'text-brand-foreground' : 'text-foreground'}>
                  {cat.icon ? `${cat.icon} ` : ''}
                  {cat.name}
                </span>
              </Link>
            );
          })
        )}
      </HorizontalScrollFade>
      </div>
    </section>
  );
}
