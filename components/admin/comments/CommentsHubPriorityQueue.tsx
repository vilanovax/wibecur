import Link from 'next/link';
import { Clock, Flag, Package, ArrowLeft, ListTodo, ShieldBan } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { HubPriorityItem } from '@/lib/admin/comments-hub-priority';

const typeMeta: Record<
  HubPriorityItem['type'],
  { icon: typeof Clock; label: string; color: string }
> = {
  comment_pending: {
    icon: Clock,
    label: 'کامنت در انتظار',
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  },
  comment_report: {
    icon: Flag,
    label: 'ریپورت کامنت',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
  },
  item_report: {
    icon: Package,
    label: 'ریپورت آیتم',
    color:
      'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  },
  user_penalty: {
    icon: ShieldBan,
    label: 'کاربر پرریسک',
    color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20',
  },
};

export default function CommentsHubPriorityQueue({
  items,
}: {
  items: HubPriorityItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 text-center text-sm text-wibe-secondary">
        صف اولویت خالی است — همه موارد بررسی شده‌اند.
      </div>
    );
  }

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-(--color-text) flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-primary" />
          صف اولویت
        </h2>
        <Link
          href="/admin/comments/all?filter=pending"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          همه صف کار
          <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>
      <ul className="rounded-2xl border border-(--color-border) bg-(--color-surface) divide-y divide-(--color-border-muted) overflow-hidden">
        {items.map((item) => {
          const meta = typeMeta[item.type];
          const Icon = meta.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-3 px-4 py-3 hover:bg-(--color-bg) transition-colors"
              >
                <span
                  className={`shrink-0 p-2 rounded-xl ${meta.color}`}
                  aria-hidden
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-wibe-secondary">
                    {meta.label}
                  </p>
                  <p className="text-sm font-medium text-(--color-text) line-clamp-1 mt-0.5">
                    {item.title}
                  </p>
                  <p className="text-xs text-wibe-secondary line-clamp-1 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                <span className="text-xs text-(--color-text-subtle) whitespace-nowrap shrink-0">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
