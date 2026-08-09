'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import Toast, { type ToastType } from '@/components/shared/Toast';
import CommentsSubNav, { type CommentsNavStats } from '@/components/admin/comments/CommentsSubNav';
import ItemReportsKpiStrip from '@/components/admin/comments/ItemReportsKpiStrip';

interface ItemReport {
  id: string;
  itemId: string;
  userId: string;
  reason: string;
  description: string | null;
  resolved: boolean;
  createdAt: string;
  items: {
    id: string;
    title: string;
    description: string | null;
  };
  users: {
    id: string;
    name: string | null;
    email: string;
  };
}

const REASON_LABELS: Record<string, { label: string; className: string }> = {
  spelling_error: {
    label: 'غلط املایی',
    className: 'bg-blue-500/12 text-blue-800 border border-blue-200/60',
  },
  incorrect_info: {
    label: 'صحت اطلاعات',
    className: 'bg-orange-500/12 text-orange-800 border border-orange-200/60',
  },
  offensive: {
    label: 'توهین آمیز',
    className: 'bg-red-500/12 text-red-800 border border-red-200/60',
  },
  other: {
    label: 'سایر',
    className: 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
  },
};

interface ItemReportsPageClientProps {
  reports: ItemReport[];
  counts: { open: number; resolved: number; total: number };
  activeFilter: 'all' | 'open' | 'resolved';
  navStats: CommentsNavStats;
}

export default function ItemReportsPageClient({
  reports = [],
  counts,
  activeFilter,
  navStats,
}: ItemReportsPageClientProps) {
  const router = useRouter();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleFilterChange = (resolved: string | undefined) => {
    const params = new URLSearchParams();
    if (resolved) params.set('resolved', resolved);
    const qs = params.toString();
    router.push(qs ? `/admin/comments/item-reports?${qs}` : '/admin/comments/item-reports');
  };

  const handleResolve = async (reportId: string) => {
    setResolvingId(reportId);
    try {
      const res = await fetch(`/api/admin/items/reports/${reportId}/resolve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حل کردن گزارش');
      }
      setToast({ message: 'گزارش حل‌شده علامت خورد', type: 'success' });
      router.refresh();
    } catch (error: unknown) {
      setToast({
        message: error instanceof Error ? error.message : 'خطا در حل کردن گزارش',
        type: 'error',
      });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div dir="rtl">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-rose-500/10">
            <Package className="w-6 h-6 text-rose-600" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              ریپورت آیتم‌ها
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              مدیریت گزارش‌های ارسال‌شده برای آیتم‌ها
            </p>
          </div>
        </div>
      </div>

      <CommentsSubNav stats={navStats} />

      <ItemReportsKpiStrip
        open={counts.open}
        resolved={counts.resolved}
        total={counts.total}
        active={activeFilter}
        onFilter={handleFilterChange}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-[var(--color-text-muted)]">گزارشی یافت نشد</p>
            {activeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => handleFilterChange(undefined)}
                className="mt-3 text-sm font-medium text-[var(--primary)] hover:underline"
              >
                نمایش همه
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm text-right">
              <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">
                    آیتم
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">
                    دلیل
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">
                    گزارش‌دهنده
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">
                    تاریخ
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)]">
                {reports.map((report) => {
                  const reasonInfo = REASON_LABELS[report.reason] || REASON_LABELS.other;
                  return (
                    <tr
                      key={report.id}
                      className={`hover:bg-[var(--color-bg)] ${
                        !report.resolved ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/items/${report.itemId}/edit`}
                          className="font-medium text-[var(--color-text)] hover:text-[var(--primary)] line-clamp-1"
                        >
                          {report.items.title}
                        </Link>
                        {report.description && (
                          <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                            {report.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${reasonInfo.className}`}
                        >
                          {reasonInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">
                        {report.users.name ?? report.users.email}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">
                        {formatRelativeTime(report.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {!report.resolved ? (
                          <button
                            type="button"
                            onClick={() => handleResolve(report.id)}
                            disabled={resolvingId === report.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {resolvingId === report.id ? '…' : 'حل‌شده'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            حل شده
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
