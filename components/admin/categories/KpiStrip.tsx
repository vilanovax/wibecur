'use client';

import { HelpCircle } from 'lucide-react';
import { MONETIZABLE_KPI_TOOLTIP } from '@/lib/admin/category-intelligence-shared';

interface KpiCardProps {
  title: string;
  value: string | number;
  hint?: string;
}

function KpiCard({ title, value, hint }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 min-w-0 shadow-sm">
      <div className="flex items-center gap-1 min-w-0">
        <p className="text-xs font-medium text-[var(--color-text-muted)] truncate">{title}</p>
        {hint && (
          <span className="relative group shrink-0">
            <button
              type="button"
              className="p-0.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              aria-label={`راهنما: ${title}`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs leading-relaxed px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible z-20 shadow-lg text-center"
            >
              {hint}
            </span>
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-[var(--color-text)] tabular-nums truncate mt-0.5">
        {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
      </p>
    </div>
  );
}

interface KpiStripProps {
  totalCategories: number;
  activeCategories: number;
  monetizableCount: number;
  avgEngagementRate: string;
  insightLine?: string;
}

export default function KpiStrip({
  totalCategories,
  activeCategories,
  monetizableCount,
  avgEngagementRate,
  insightLine,
}: KpiStripProps) {
  return (
    <div className="space-y-2 min-w-0" dir="rtl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="کل دسته‌ها" value={totalCategories} />
        <KpiCard title="فعال" value={activeCategories} />
        <KpiCard title="قابل درآمد" value={monetizableCount} hint={MONETIZABLE_KPI_TOOLTIP} />
        <KpiCard title="میانگین تعامل" value={avgEngagementRate} />
      </div>
      {insightLine && (
        <p className="text-sm text-[var(--color-text-muted)] px-1 leading-relaxed break-words min-w-0">{insightLine}</p>
      )}
    </div>
  );
}
