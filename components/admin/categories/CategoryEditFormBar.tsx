'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface CategoryEditFormBarProps {
  loading: boolean;
  canSave: boolean;
  categorySlug: string;
  dirty?: boolean;
}

/** نوار چسبان پایین — ذخیره / انصراف / مشاهده در اپ */
export default function CategoryEditFormBar({
  loading,
  canSave,
  categorySlug,
  dirty = false,
}: CategoryEditFormBarProps) {
  return (
    <div
      className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 bg-[var(--color-surface)]/95 backdrop-blur p-3 rounded-xl border border-[var(--color-border)] shadow-lg"
      dir="rtl"
    >
      <button
        type="submit"
        form="category-edit-form"
        disabled={loading || !canSave}
        className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
      </button>
      <Link
        href="/admin/categories"
        className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
      >
        انصراف
      </Link>
      <Link
        href={`/categories/${categorySlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
      >
        <ExternalLink className="w-4 h-4" />
        مشاهده در اپ
      </Link>
      {dirty && (
        <span className="text-xs text-amber-700 dark:text-amber-300 mr-auto">
          تغییرات ذخیره نشده
        </span>
      )}
    </div>
  );
}
