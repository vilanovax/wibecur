'use client';

interface KpiCardProps {
  title: string;
  value: string | number;
}

function KpiCard({ title, value }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/50 px-4 py-3 min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums truncate mt-0.5">
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
}

export default function KpiStrip({
  totalCategories,
  activeCategories,
  monetizableCount,
  avgEngagementRate,
}: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" dir="rtl">
      <KpiCard title="کل دسته‌ها" value={totalCategories} />
      <KpiCard title="فعال" value={activeCategories} />
      <KpiCard title="قابل درآمد" value={monetizableCount} />
      <KpiCard title="میانگین تعامل" value={avgEngagementRate} />
    </div>
  );
}
