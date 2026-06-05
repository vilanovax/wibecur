'use client';

import Link from 'next/link';
import { Clock, Flag, Package, ArrowLeft, ListTodo } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import type { HubPriorityItem } from '@/lib/admin/comments-hub-priority';

const typeMeta: Record<
  HubPriorityItem['type'],
  { icon: typeof Clock; label: string; color: string }
> = {
  comment_pending: {
    icon: Clock,
    label: 'کامنت در انتظار',
    color: 'text-amber-600 bg-amber-50',
  },
  comment_report: {
    icon: Flag,
    label: 'ریپورت کامنت',
    color: 'text-rose-600 bg-rose-50',
  },
  item_report: {
    icon: Package,
    label: 'ریپورت آیتم',
    color: 'text-orange-600 bg-orange-50',
  },
};

export default function CommentsHubPriorityQueue({
  items,
}: {
  items: HubPriorityItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-text-muted)]">
        صف اولویت خالی است — همه موارد بررسی شده‌اند.
      </div>
    );
  }

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-[var(--primary)]" />
          صف اولویت
        </h2>
        <Link
          href="/admin/comments/all?filter=pending"
          className="text-xs font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
        >
          همه صف کار
          <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>
      <ul className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border-muted)] overflow-hidden">
        {items.map((item) => {
          const meta = typeMeta[item.type];
          const Icon = meta.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-bg)] transition-colors"
              >
                <span
                  className={`shrink-0 p-2 rounded-xl ${meta.color}`}
                  aria-hidden
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">
                    {meta.label}
                  </p>
                  <p className="text-sm font-medium text-[var(--color-text)] line-clamp-1 mt-0.5">
                    {item.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                <span className="text-[10px] text-[var(--color-text-subtle)] whitespace-nowrap shrink-0">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                    locale: faIR,
                  })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
