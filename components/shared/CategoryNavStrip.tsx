'use client';

import QuickCategoryChips from '@/components/mobile/home/QuickCategoryChips';
import type { CategoryMenuChip } from '@/lib/category-menu';

interface CategoryNavStripProps {
  /** slug دسته فعال — برای هایلایت */
  activeSlug?: string | null;
  /** دسته‌ها از SSR — جلوگیری از fetch تکراری */
  initialCategories?: CategoryMenuChip[];
  /** داخل sticky دیگر — بدون sticky و border جدا */
  embedded?: boolean;
  className?: string;
}

/**
 * نوار ناوبری دسته‌ها — همان چیپ‌های صفحهٔ خانه
 * روی صفحات داخلی (لیست‌ها، دسته) برای جابه‌جایی بدون بازگشت به خانه
 */
export default function CategoryNavStrip({
  activeSlug,
  initialCategories,
  embedded = false,
  className = '',
}: CategoryNavStripProps) {
  const inner = (
    <QuickCategoryChips
      activeSlug={activeSlug}
      variant="nav"
      initialCategories={initialCategories}
    />
  );

  if (embedded) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <div
      className={`sticky top-14 z-[25] border-b border-wibe/50 bg-wibe-surface/95 backdrop-blur-sm supports-[backdrop-filter]:bg-wibe-surface/90 ${className}`}
    >
      {inner}
    </div>
  );
}
