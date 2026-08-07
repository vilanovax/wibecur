'use client';

import Link from 'next/link';
import { ExternalLink, Film, Sparkles, X } from 'lucide-react';
import PersonPagePreview from '@/components/admin/people/PersonPagePreview';
import type { PersonPageData } from '@/lib/people';
import { PERSON_ROLE_META, personPublicPath } from '@/lib/people';

export default function PersonPreviewModal({
  data,
  onClose,
}: {
  data: PersonPageData;
  onClose: () => void;
}) {
  const publicPath = personPublicPath(data.role, data.slug);
  const roleLabel = PERSON_ROLE_META[data.role].label;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="person-preview-title"
      >
        {/* هدر */}
        <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-violet-600 dark:text-violet-400">
                پیش‌نمایش صفحه عمومی
              </p>
              <h2
                id="person-preview-title"
                className="truncate text-lg font-bold text-[var(--color-text)]"
              >
                {data.displayName}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                  <Film className="h-3 w-3" />
                  {data.items.length.toLocaleString('fa-IR')} آیتم
                </span>
                {!data.bioIsStub && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    bio اختصاصی
                  </span>
                )}
                {data.profileStatus === 'draft' && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    پیش‌نویس — در سایت نمایش داده نمی‌شود
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={publicPath}
                target="_blank"
                className="hidden items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 sm:inline-flex"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                باز کردن در سایت
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                aria-label="بستن"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <Link
            href={publicPath}
            target="_blank"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200 sm:hidden"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            باز کردن در سایت
          </Link>
        </header>

        {/* بدنه — شبیه‌ساز صفحه سایت */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl border-x border-[var(--color-border)]/50 bg-[#f4f5f7] dark:bg-gray-950">
            <PersonPagePreview data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
