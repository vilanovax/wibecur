'use client';

import Link from 'next/link';
import { Lightbulb, ChevronLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
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
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/60">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              پیشنهاد لیست
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              {count.toLocaleString('fa-IR')} مورد در انتظار بررسی
            </p>
          </div>
        </div>
        <Link
          href="/admin/suggestions"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          مشاهده همه
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>
      {previews.length === 0 ? (
        <p className="px-6 py-8 text-sm text-center text-[var(--color-text-muted)]">
          پیشنهاد باز وجود ندارد.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border-muted)]">
          {previews.map((s) => (
            <li key={s.id}>
              <Link
                href="/admin/suggestions"
                className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 hover:bg-[var(--color-bg)] transition-colors"
              >
                <span className="font-medium text-sm text-[var(--color-text)] truncate">
                  {s.title}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                  {formatDistanceToNow(
                    typeof s.createdAt === 'string'
                      ? new Date(s.createdAt)
                      : s.createdAt,
                    { addSuffix: true, locale: faIR }
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
