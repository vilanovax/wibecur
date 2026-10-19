'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, BarChart3, ExternalLink, Copy } from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';
import { CATEGORY_BOOST_WEIGHT } from '@/lib/admin/category-intelligence-shared';

interface CategoryEditHeaderActionsProps {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  isActive: boolean;
  trendingWeight: number;
  onDuplicate: () => void;
  duplicateLoading?: boolean;
  onBoostApplied?: () => void;
}

export default function CategoryEditHeaderActions({
  categoryId,
  categorySlug,
  categoryName,
  isActive,
  trendingWeight,
  onDuplicate,
  duplicateLoading = false,
  onBoostApplied,
}: CategoryEditHeaderActionsProps) {
  const router = useRouter();
  const [boostLoading, setBoostLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const btnClass =
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-50 transition-colors';

  const handleBoost = async () => {
    if (!isActive) {
      setToast({ message: 'ابتدا دسته را فعال کنید', type: 'warning' });
      return;
    }
    if (trendingWeight >= CATEGORY_BOOST_WEIGHT) {
      setToast({ message: 'این دسته از قبل تقویت شده است', type: 'warning' });
      return;
    }
    setBoostLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendingWeight: CATEGORY_BOOST_WEIGHT }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در Boost');
      setToast({ message: 'Boost اعمال شد — وزن ۱.۲×', type: 'success' });
      onBoostApplied?.();
      router.refresh();
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'خطا',
        type: 'error',
      });
    } finally {
      setBoostLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2" dir="rtl">
        <Link
          href={`/categories/${categorySlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
        >
          <ExternalLink className="w-4 h-4" />
          مشاهده در اپ
        </Link>
        <button
          type="button"
          disabled={boostLoading || !isActive || trendingWeight >= CATEGORY_BOOST_WEIGHT}
          title={!isActive ? 'ابتدا دسته را فعال کنید' : undefined}
          onClick={handleBoost}
          className={`${btnClass} text-amber-800 dark:text-amber-100 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50`}
        >
          <Zap className="w-4 h-4" />
          {trendingWeight >= CATEGORY_BOOST_WEIGHT ? 'تقویت‌شده' : 'Boost'}
        </button>
        <Link href={`/admin/analytics?category=${categoryId}`} className={btnClass}>
          <BarChart3 className="w-4 h-4" />
          آنالیتیکس
        </Link>
        <button
          type="button"
          disabled={duplicateLoading}
          onClick={onDuplicate}
          className={btnClass}
        >
          <Copy className="w-4 h-4" />
          کپی دسته
        </button>
      </div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={3500} />
      )}
    </>
  );
}
