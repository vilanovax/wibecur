'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Flag, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

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

interface ItemReportsPageClientProps {
  reports: ItemReport[];
  currentResolved: string | undefined;
}

const REASON_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  spelling_error: {
    label: 'غلط املایی',
    icon: '✏️',
    color: 'text-blue-600 bg-blue-50',
  },
  incorrect_info: {
    label: 'صحت اطلاعات',
    icon: '📋',
    color: 'text-orange-600 bg-orange-50',
  },
  offensive: {
    label: 'توهین آمیز',
    icon: '🚫',
    color: 'text-red-600 bg-red-50',
  },
  other: {
    label: 'سایر',
    icon: '💬',
    color: 'text-gray-600 bg-gray-50',
  },
};

export default function ItemReportsPageClient({
  reports = [],
  currentResolved,
}: ItemReportsPageClientProps) {
  const router = useRouter();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (reportId: string) => {
    if (!confirm('آیا می‌خواهید این گزارش را حل شده علامت بزنید؟')) return;

    setResolvingId(reportId);
    try {
      const res = await fetch(`/api/admin/items/reports/${reportId}/resolve`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حل کردن گزارش');
      }

      router.refresh();
    } catch (error: any) {
      console.error('Error resolving report:', error);
      alert(error.message || 'خطا در حل کردن گزارش');
    } finally {
      setResolvingId(null);
    }
  };

  const handleFilterChange = (resolved: string | undefined) => {
    const params = new URLSearchParams();
    if (resolved) params.set('resolved', resolved);
    router.push(`/admin/comments/item-reports?${params.toString()}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Package className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">گزارش‌های آیتم‌ها</h1>
            <p className="text-sm text-gray-500 mt-1">
              مدیریت گزارش‌های ارسال شده برای آیتم‌ها
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => handleFilterChange(undefined)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentResolved === undefined
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          همه
        </button>
        <button
          onClick={() => handleFilterChange('false')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            currentResolved === 'false'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Flag className="w-4 h-4" />
          حل نشده
        </button>
        <button
          onClick={() => handleFilterChange('true')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            currentResolved === 'true'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Done
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">گزارشی یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    آیتم
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    دلیل
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    توضیحات
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    تاریخ
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => {
                  const reasonInfo = REASON_LABELS[report.reason] || REASON_LABELS.other;
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/items/${report.itemId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 hover:text-primary">
                              {report.items.title}
                            </p>
                            {report.items.description && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {report.items.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${reasonInfo.color}`}
                        >
                          <span>{reasonInfo.icon}</span>
                          <span>{reasonInfo.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {report.description ? (
                          <p className="text-sm text-gray-700 max-w-xs line-clamp-2">
                            {report.description}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                          locale: faIR,
                        })}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {!report.resolved && (
                          <button
                            onClick={() => handleResolve(report.id)}
                            disabled={resolvingId === report.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {resolvingId === report.id ? 'در حال...' : 'Done'}
                          </button>
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

