'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Zap, ChevronDown, Scale, BarChart3, Power, ExternalLink, Copy } from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';

import { CATEGORY_BOOST_WEIGHT } from '@/lib/admin/category-intelligence';

interface CategoryActionsProps {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  isActive: boolean;
  trendingWeight: number;
  /** کارت غیرفعال — بدون Boost، CTA فعال‌سازی */
  compact?: boolean;
}

export default function CategoryActions({
  categoryId,
  categorySlug,
  categoryName,
  isActive,
  trendingWeight,
  compact = false,
}: CategoryActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const patchCategory = async (body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در انجام عملیات');
      router.refresh();
      return true;
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'خطا',
        type: 'error',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleBoost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isActive) return;
    if (trendingWeight >= CATEGORY_BOOST_WEIGHT) {
      setToast({ message: 'این دسته از قبل تقویت شده است', type: 'warning' });
      return;
    }
    const ok = await patchCategory({ trendingWeight: CATEGORY_BOOST_WEIGHT });
    if (ok) setToast({ message: 'Boost اعمال شد — وزن الگوریتمی ۱.۲×', type: 'success' });
  };

  const handleActivate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`«${categoryName}» فعال شود؟`)) return;
    const ok = await patchCategory({ isActive: true });
    if (ok) setToast({ message: `«${categoryName}» فعال شد`, type: 'success' });
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (
      !window.confirm(
        `کپی «${categoryName}» ساخته می‌شود (بدون لیست‌ها، غیرفعال). ادامه می‌دهید؟`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/duplicate`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در کپی');
      setToast({ message: 'کپی ایجاد شد — در حال باز کردن ویرایش…', type: 'success' });
      router.push(`/admin/categories/${data.id}/edit`);
      router.refresh();
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'خطا',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    const nextActive = !isActive;
    const label = nextActive ? 'فعال' : 'غیرفعال';
    if (!window.confirm(`آیا «${categoryName}» ${label} شود؟`)) return;
    const ok = await patchCategory({ isActive: nextActive });
    if (ok) {
      setToast({
        message: nextActive ? `«${categoryName}» فعال شد` : `«${categoryName}» غیرفعال شد`,
        type: 'success',
      });
    }
  };

  const btnPrimary =
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50';
  const btnSecondary =
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors';

  if (compact) {
    return (
      <div className="space-y-1.5" ref={ref}>
        <div className="flex items-center gap-2 flex-wrap" dir="rtl">
          <button
            type="button"
            disabled={loading}
            onClick={handleActivate}
            className={btnPrimary}
          >
            <Power className="w-4 h-4" />
            فعال‌سازی
          </button>
          <Link
            href={`/admin/categories/${categoryId}/edit`}
            onClick={(e) => e.stopPropagation()}
            className={btnSecondary}
          >
            <Pencil className="w-4 h-4" />
            ویرایش
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={ref}>
      <div className="flex items-center gap-2 flex-wrap" dir="rtl">
        <Link
          href={`/admin/categories/${categoryId}/edit`}
          onClick={(e) => e.stopPropagation()}
          className={btnPrimary}
        >
          <Pencil className="w-4 h-4" />
          ویرایش
        </Link>
        <button
          type="button"
          disabled={loading || !isActive || trendingWeight >= CATEGORY_BOOST_WEIGHT}
          title={!isActive ? 'ابتدا دسته را فعال کنید' : undefined}
          onClick={handleBoost}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-800 dark:text-amber-100 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Zap className="w-4 h-4" />
          {trendingWeight >= CATEGORY_BOOST_WEIGHT ? 'تقویت‌شده' : 'Boost'}
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(!open);
            }}
            className={btnSecondary}
          >
            بیشتر
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full right-0 mt-1 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg py-1 z-50">
              <Link
                href={`/admin/categories/${categoryId}/edit#weight`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                onClick={() => setOpen(false)}
              >
                <Scale className="w-4 h-4" />
                تنظیم وزن
              </Link>
              <Link
                href={`/admin/analytics?category=${categoryId}`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                onClick={() => setOpen(false)}
              >
                <BarChart3 className="w-4 h-4" />
                آنالیتیکس
              </Link>
              <Link
                href={`/categories/${categorySlug}`}
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                onClick={() => setOpen(false)}
              >
                <ExternalLink className="w-4 h-4" />
                مشاهده در اپ
              </Link>
              <button
                type="button"
                disabled={loading}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-50"
                onClick={handleDuplicate}
              >
                <Copy className="w-4 h-4" />
                کپی دسته
              </button>
              <button
                type="button"
                disabled={loading}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                onClick={handleToggleActive}
              >
                <Power className="w-4 h-4" />
                غیرفعال کردن
              </button>
            </div>
          )}
        </div>
      </div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={3500} />
      )}
    </div>
  );
}
