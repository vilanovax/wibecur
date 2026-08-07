'use client';

import type { UserGrowthHealth } from '@/lib/admin/analytics-metrics';
import { Users } from 'lucide-react';

interface GrowthBlockProps {
  data: UserGrowthHealth;
}

const ACTIVE_USERS_THRESHOLD = 10;

function buildInsight(data: UserGrowthHealth): string {
  if (data.activeUsers7d < ACTIVE_USERS_THRESHOLD && data.activeUsers7d >= 0)
    return 'پایه کاربری کوچک است. تمرکز روی جذب کاربر توصیه می‌شود.';
  if (data.status === 'declining')
    return 'رشد کاربر منفی است؛ جذب و نگهداری کاربر را در اولویت قرار دهید.';
  if (data.status === 'growing')
    return 'رشد کاربر مثبت است؛ پایه کاربری در حال تقویت است.';
  return 'رشد کاربران پایدار است.';
}

export default function GrowthBlock({ data }: GrowthBlockProps) {
  const delta =
    data.growthRateWoW >= 0
      ? `+${data.growthRateWoW}٪ نسبت به هفته قبل`
      : `${data.growthRateWoW}٪ نسبت به هفته قبل`;

  return (
    <section
      className="rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden border-l-4 border-l-indigo-600"
      style={{ direction: 'rtl' }}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-slate-500 dark:text-[var(--color-text-subtle)]" />
          <h2 className="font-semibold text-slate-800 dark:text-gray-100">موتور رشد</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <p className="text-sm text-slate-500 dark:text-[var(--color-text-subtle)] mb-1">👤 کاربران فعال (۷ روز)</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
              {data.activeUsers7d.toLocaleString('fa-IR')}
            </p>
            <p className="text-sm text-slate-500 dark:text-[var(--color-text-subtle)] mt-1">{delta}</p>
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
              <p className="text-xs text-slate-500 dark:text-[var(--color-text-subtle)] mb-0.5">کاربران جدید (۷ روز)</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-gray-100 tabular-nums">
                {data.newUsers7d.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
              <p className="text-xs text-slate-500 dark:text-[var(--color-text-subtle)] mb-0.5">نرخ رشد هفته به هفته</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-gray-100 tabular-nums">
                {data.growthRateWoW >= 0 ? '+' : ''}{data.growthRateWoW}٪
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
              <p className="text-xs text-slate-500 dark:text-[var(--color-text-subtle)] mb-0.5">بازگشت‌پذیری</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-gray-100 tabular-nums">
                {data.returningUsersPercent}٪
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-[var(--color-text-subtle)] mt-3">{buildInsight(data)}</p>
      </div>
    </section>
  );
}
