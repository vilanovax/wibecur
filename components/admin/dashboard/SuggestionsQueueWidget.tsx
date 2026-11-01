'use client';

import Link from 'next/link';
import { Lightbulb, ChevronLeft } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { SuggestionPreview } from '@/lib/admin/types';

export default function SuggestionsQueueWidget({
  count,
  previews,
}: {
  count: number;
  previews: SuggestionPreview[];
}) {
  return (
    <section
      className="rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-card) overflow-hidden"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-(--color-border) bg-(--color-bg)/60">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <div>
            <h2 className="text-base font-semibold text-(--color-text)">
              پیشنهاد لیست
            </h2>
            <p className="text-xs text-wibe-secondary">
              {count.toLocaleString('fa-IR')} مورد در انتظار بررسی
            </p>
          </div>
        </div>
        <Link
          href="/admin/suggestions"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          مشاهده همه
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>
      {previews.length === 0 ? (
        <p className="px-6 py-8 text-sm text-center text-wibe-secondary">
          پیشنهاد باز وجود ندارد.
        </p>
      ) : (
        <ul className="divide-y divide-(--color-border-muted)">
          {previews.map((s) => (
            <li key={s.id}>
              <Link
                href="/admin/suggestions"
                className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 hover:bg-(--color-bg) transition-colors"
              >
                <span className="font-medium text-sm text-(--color-text) truncate">
                  {s.title}
                </span>
                <span className="text-xs text-wibe-secondary shrink-0">
                  {formatRelativeTime(s.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
