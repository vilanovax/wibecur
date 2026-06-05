'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Bug, ExternalLink, BarChart3, MoreHorizontal, Sparkles } from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';

interface ListEditHeaderActionsProps {
  listId: string;
  listSlug: string;
  isFeatured: boolean;
  categoryId: string | null;
  onFeaturedChange?: (isFeatured: boolean) => void;
}

export default function ListEditHeaderActions({
  listId,
  listSlug,
  isFeatured,
  categoryId,
  onFeaturedChange,
}: ListEditHeaderActionsProps) {
  const router = useRouter();
  const [featureLoading, setFeatureLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const btnClass =
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-50 transition-colors';

  const handleFeatureToggle = async () => {
    setFeatureLoading(true);
    try {
      const res = await fetch(`/api/admin/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا');
      onFeaturedChange?.(!isFeatured);
      setToast({
        message: !isFeatured ? 'لیست Featured شد' : 'از Featured حذف شد',
        type: 'success',
      });
      router.refresh();
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'خطا',
        type: 'error',
      });
    } finally {
      setFeatureLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2" dir="rtl">
        <button
          type="button"
          disabled={featureLoading}
          onClick={handleFeatureToggle}
          className={`${btnClass} ${
            isFeatured ? 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100' : ''
          }`}
        >
          <Star className={`w-4 h-4 ${isFeatured ? 'fill-current' : ''}`} />
          {isFeatured ? 'Featured ✓' : 'Featured'}
        </button>

        <Link
          href={`/lists/${listSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">مشاهده در اپ</span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={`${btnClass} px-2.5`}
            aria-expanded={menuOpen}
            aria-label="عملیات بیشتر"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 min-w-[180px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg py-1">
              <Link
                href={`/admin/lists/${listId}/debug`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                onClick={() => setMenuOpen(false)}
              >
                <Bug className="w-4 h-4 text-[var(--color-text-muted)]" />
                دیباگ ترند
              </Link>
              {categoryId && (
                <Link
                  href={`/admin/analytics?category=${categoryId}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                  onClick={() => setMenuOpen(false)}
                >
                  <BarChart3 className="w-4 h-4 text-[var(--color-text-muted)]" />
                  آنالیتیکس دسته
                </Link>
              )}
              <Link
                href="/admin/custom/featured"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                onClick={() => setMenuOpen(false)}
              >
                <Sparkles className="w-4 h-4 text-[var(--color-text-muted)]" />
                اسلات Featured
              </Link>
            </div>
          )}
        </div>
      </div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={3500} />
      )}
    </>
  );
}
