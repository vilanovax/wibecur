'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

export interface CategoryImpactData {
  weeklySaveShare: number;
  growingLists: number;
  avgTrendingScore: number;
  engagementGrowth: number;
  trendDirection: 'up' | 'down' | 'stable';
}

interface CategoryImpactCardProps {
  categoryId: string;
  className?: string;
}

export default function CategoryImpactCard({
  categoryId,
  className = '',
}: CategoryImpactCardProps) {
  const [data, setData] = useState<CategoryImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/categories/${categoryId}/impact`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'خطا در بارگذاری');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (loading) {
    return (
      <section
        className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 ${className}`}
        style={{ direction: 'rtl' }}
      >
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <BarChart3 className="w-5 h-5" />
          <h2 className="font-semibold text-[var(--color-text)]">
            Category Impact Snapshot
          </h2>
        </div>
        <div className="mt-4 h-24 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
          در حال بارگذاری...
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section
        className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 ${className}`}
        style={{ direction: 'rtl' }}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[var(--color-text-muted)]" />
          <h2 className="font-semibold text-[var(--color-text)]">
            Category Impact Snapshot
          </h2>
        </div>
        <p className="mt-2 text-sm text-red-600">{error || 'داده‌ای یافت نشد'}</p>
      </section>
    );
  }

  const trendConfig = {
    up: {
      icon: TrendingUp,
      label: 'در حال تقویت',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    down: {
      icon: TrendingDown,
      label: 'در حال کاهش',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
    },
    stable: {
      icon: Minus,
      label: 'پایدار',
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    },
  };

  const trend = trendConfig[data.trendDirection];
  const TrendIcon = trend.icon;

  const insightLine =
    data.engagementGrowth > 0
      ? 'این دسته در حال کسب شتاب است.'
      : data.engagementGrowth < 0
        ? 'تعامل این دسته نسبت به هفته قبل کاهش داشته است.'
        : 'تعامل این دسته نسبت به هفته قبل پایدار است.';

  return (
    <section
      className={`rounded-xl border border-[var(--color-border)] overflow-hidden ${className}`}
      style={{
        direction: 'rtl',
        backgroundColor: 'rgba(139, 92, 246, 0.06)',
      }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[var(--color-text-muted)]" />
          <h2 className="font-semibold text-[var(--color-text)]">
            Category Impact Snapshot
          </h2>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Impact This Week
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              سهم از کل ذخیره‌ها
            </p>
            <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
              {data.weeklySaveShare}٪
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              لیست‌های در حال رشد
            </p>
            <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
              {data.growingLists.toLocaleString('fa-IR')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              میانگین امتیاز ترند
            </p>
            <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
              {data.avgTrendingScore.toLocaleString('fa-IR')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              رشد تعامل
            </p>
            <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
              {data.engagementGrowth >= 0 ? '+' : ''}
              {data.engagementGrowth}٪
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${trend.badgeClass}`}
          >
            <TrendIcon className="w-3.5 h-3.5" />
            {trend.label}
          </span>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          {insightLine}
        </p>
      </div>
    </section>
  );
}
