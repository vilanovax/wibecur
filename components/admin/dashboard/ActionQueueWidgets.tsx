'use client';

import Link from 'next/link';
import { Flag, MessageSquare, Lightbulb, ChevronLeft } from 'lucide-react';
import type { ActionQueueItem } from '@/lib/admin/types';

const icons = {
  reports: Flag,
  comments: MessageSquare,
  suggestions: Lightbulb,
} as const;

const severityRing = {
  high: 'ring-rose-300/80',
  medium: 'ring-amber-300/80',
  low: 'ring-slate-200/80',
};

export default function ActionQueueWidgets({ items }: { items: ActionQueueItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3" dir="rtl">
      {items.map((item) => {
        const Icon =
          item.id.includes('comment') || item.id.includes('pending')
            ? icons.comments
            : item.id.includes('suggest')
              ? icons.suggestions
              : icons.reports;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-all hover:shadow-md hover:border-[var(--primary)]/40 ring-1 ${severityRing[item.severity]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="p-2 rounded-xl bg-[var(--color-bg)]">
                <Icon className="w-5 h-5 text-[var(--color-text)]" />
              </span>
              <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)] rotate-180 shrink-0" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--color-text)]">
              {item.count.toLocaleString('fa-IR')}
            </p>
            <p className="text-sm font-medium text-[var(--color-text)] mt-1">{item.label}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">نیازمند اقدام</p>
          </Link>
        );
      })}
    </section>
  );
}
