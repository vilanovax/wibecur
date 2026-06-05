'use client';

import Link from 'next/link';
import { ExternalLink, Save, ChevronRight, ChevronLeft } from 'lucide-react';
import type { ListEditFormStep } from '@/components/admin/lists/ListEditFormStepper';

interface ListEditFormBarProps {
  loading: boolean;
  canSave: boolean;
  listSlug: string;
  dirty?: boolean;
  step?: ListEditFormStep;
  onPrevStep?: () => void;
  onNextStep?: () => void;
  canNextStep?: boolean;
}

export default function ListEditFormBar({
  loading,
  canSave,
  listSlug,
  dirty = false,
  step = 1,
  onPrevStep,
  onNextStep,
  canNextStep = true,
}: ListEditFormBarProps) {
  return (
    <div
      className="sticky bottom-0 z-20 -mx-5 px-5 py-3 mt-2 bg-[var(--color-bg)]/95 backdrop-blur-md border-t border-[var(--color-border)] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center gap-2">
        {step > 1 && onPrevStep && (
          <button
            type="button"
            onClick={onPrevStep}
            className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
          >
            <ChevronRight className="w-4 h-4" />
            قبلی
          </button>
        )}

        {step < 3 && onNextStep ? (
          <button
            type="button"
            onClick={onNextStep}
            disabled={!canNextStep}
            className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            بعدی
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            form="list-edit-form"
            disabled={loading || !canSave}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        )}

        <button
          type="submit"
          form="list-edit-form"
          disabled={loading || !canSave}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            step < 3
              ? 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
              : 'hidden'
          } disabled:opacity-50`}
        >
          <Save className="w-4 h-4" />
          ذخیره
        </button>

        <Link
          href="/admin/lists"
          className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
        >
          انصراف
        </Link>
        <Link
          href={`/lists/${listSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">پیش‌نمایش اپ</span>
        </Link>
        {dirty && (
          <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg mr-auto">
            تغییرات ذخیره نشده
          </span>
        )}
      </div>
    </div>
  );
}
