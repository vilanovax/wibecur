'use client';

import { Package, Flame, TrendingUp, DollarSign } from 'lucide-react';
import type { CategoryPulseSummary as CategoryPulseSummaryType } from '@/lib/admin/categories-types';

const cards: {
  key: keyof CategoryPulseSummaryType;
  label: string;
  icon: typeof Package;
  sub?: (d: CategoryPulseSummaryType) => string;
}[] = [
  {
    key: 'totalCategories',
    label: 'کل دسته‌بندی‌ها',
    icon: Package,
  },
  {
    key: 'fastestGrowingName',
    label: 'سریع‌ترین رشد',
    icon: Flame,
    sub: (d) => `${d.fastestGrowingName} (+${d.fastestGrowingPercent}٪)`,
  },
  {
    key: 'avgSaveGrowthPercent',
    label: 'میانگین رشد ذخیره (۷ روز)',
    icon: TrendingUp,
    sub: (d) => `${d.avgSaveGrowthPercent >= 0 ? '+' : ''}${d.avgSaveGrowthPercent}٪`,
  },
  {
    key: 'monetizableCount',
    label: 'دسته‌های قابل‌درآمد',
    icon: DollarSign,
  },
];

interface CategoryPulseOverviewProps {
  data: CategoryPulseSummaryType;
}

export default function CategoryPulseOverview({ data }: CategoryPulseOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, sub }) => (
        <div
          key={key}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-[var(--color-bg)]">
              <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />
            </span>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
              {label}
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-[var(--color-text)] truncate">
            {key === 'fastestGrowingName'
              ? (data[key] as string) || '—'
              : key === 'avgSaveGrowthPercent'
                ? `${(data[key] as number) >= 0 ? '+' : ''}${(data[key] as number).toLocaleString('fa-IR')}٪`
                : (data[key] as number).toLocaleString('fa-IR')}
          </p>
          {sub && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
              {sub(data)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
