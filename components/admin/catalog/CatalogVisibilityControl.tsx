'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type CatalogVisibilityControlProps = {
  catalogId: string;
  isDisabled: boolean;
  placementCount?: number;
  variant?: 'banner' | 'inline' | 'compact';
  className?: string;
  onChanged?: (disabled: boolean) => void;
  onError?: (message: string) => void;
};

export default function CatalogVisibilityControl({
  catalogId,
  isDisabled,
  placementCount = 0,
  variant = 'banner',
  className = '',
  onChanged,
  onError,
}: CatalogVisibilityControlProps) {
  const [disabled, setDisabled] = useState(isDisabled);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisabled(isDisabled);
  }, [isDisabled, catalogId]);

  const toggle = async () => {
    setLoading(true);
    const action = disabled ? 'show' : 'hide';

    try {
      const res = await fetch('/api/admin/catalog-items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogIds: [catalogId], action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در تغییر وضعیت آیتم');
      }

      const next = !disabled;
      setDisabled(next);
      onChanged?.(next);
    } catch (error: unknown) {
      onError?.(error instanceof Error ? error.message : 'خطا در تغییر وضعیت آیتم');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void toggle();
        }}
        disabled={loading}
        title={disabled ? 'فعال کردن آیتم' : 'غیرفعال کردن آیتم'}
        className={`inline-flex items-center justify-center rounded-lg border p-1.5 transition-colors disabled:opacity-60 ${
          disabled
            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-gray-200 bg-white text-[var(--color-text-muted)] hover:bg-gray-50 hover:text-[var(--color-text)]'
        } ${className}`}
      >
        {disabled ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void toggle();
        }}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-60 ${
          disabled
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
        } ${className}`}
      >
        {disabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {loading ? 'در حال ذخیره…' : disabled ? 'فعال کردن آیتم' : 'غیرفعال کردن آیتم'}
      </button>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
        disabled ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        {disabled ? (
          <EyeOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        ) : (
          <Eye className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        )}
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {disabled ? 'آیتم غیرفعال است' : 'آیتم فعال است'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {disabled
              ? 'این آیتم در سایت عمومی نمایش داده نمی‌شود.'
              : placementCount > 0
                ? `در ${placementCount.toLocaleString('fa-IR')} لیست قابل مشاهده است.`
                : 'هنوز در لیستی نیست؛ با غیرفعال‌سازی از نمایش عمومی جلوگیری می‌شود.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={loading}
        className={`inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          disabled
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-amber-600 text-white hover:bg-amber-700'
        }`}
      >
        {loading ? 'در حال ذخیره…' : disabled ? 'فعال کردن آیتم' : 'غیرفعال کردن آیتم'}
      </button>
    </div>
  );
}
