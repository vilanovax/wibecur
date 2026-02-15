'use client';

import { Shield, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { ModerationAlert } from '@/lib/admin/types';

interface ModerationQueueProps {
  alerts: ModerationAlert[];
}

const severityBadge: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

export default function ModerationQueue({ alerts }: ModerationQueueProps) {
  const hasCritical = alerts.some((a) => a.count > 0 && a.severity === 'high');

  return (
    <div className="rounded-[16px] p-4 sm:p-5 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--color-danger)]" />
          هشدارها و صف مودریشن
        </h3>
      </div>
      <ul className="space-y-2 flex-1">
        {alerts.map((alert) => (
          <li key={alert.id}>
            <Link
              href={alert.href}
              className="flex items-center justify-between gap-2 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-bg)] transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-[var(--color-text)] truncate">
                  {alert.label}
                </span>
                {alert.severity && alert.count > 0 && (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${severityBadge[alert.severity] ?? severityBadge.low}`}
                  >
                    {alert.count}
                  </span>
                )}
              </div>
              <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                {alert.count.toLocaleString('fa-IR')}
              </span>
              <ChevronLeft className="w-4 h-4 text-[var(--color-text-subtle)] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/admin/comments/item-reports"
        className={`mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
          hasCritical
            ? 'bg-[var(--color-danger)] text-white hover:opacity-90'
            : 'bg-[var(--primary)] text-white hover:opacity-90'
        }`}
      >
        <Shield className="w-4 h-4" />
        باز کردن مودریشن
      </Link>
    </div>
  );
}
