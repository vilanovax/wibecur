'use client';

import Link from 'next/link';
import type { UserGrowthHealth } from '@/lib/admin/analytics-metrics';
import { Users } from 'lucide-react';
import { fa, faNumber } from '@/lib/utils';

interface GrowthBlockProps {
  data: UserGrowthHealth;
}

const ACTIVE_USERS_THRESHOLD = 10;

function buildInsight(data: UserGrowthHealth): string {
  if (data.activeUsers < ACTIVE_USERS_THRESHOLD && data.activeUsers >= 0) {
    return 'پایه کاربری کوچک است. تمرکز روی جذب کاربر و منتخب هوم توصیه می‌شود.';
  }
  if (data.status === 'declining') {
    return 'رشد کاربر منفی است؛ جذب و نگهداری کاربر را در اولویت قرار دهید.';
  }
  if (data.status === 'growing') {
    return 'رشد کاربر مثبت است؛ پایه کاربری در حال تقویت است.';
  }
  return 'رشد کاربران پایدار است.';
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 bg-(--color-surface) px-4 py-3">
      <p className="text-sm text-wibe-secondary">{label}</p>
      <p className="mt-1 text-lg font-bold leading-snug text-(--color-text)">
        {value}
      </p>
    </div>
  );
}

export default function GrowthBlock({ data }: GrowthBlockProps) {
  const rateLabel =
    data.growthRate >= 0
      ? `+${fa(data.growthRate.toFixed(1).replace('.', '٫'))}٪`
      : `${fa(data.growthRate.toFixed(1).replace('.', '٫'))}٪`;

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-text)">
          <Users className="size-4" strokeWidth={1.5} />
          موتور رشد
        </h2>
        <Link
          href="/admin/users"
          className="inline-flex min-h-11 items-center rounded-xl border border-(--color-border) px-3 text-sm text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)"
        >
          کاربران
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-(--color-border) bg-(--color-border) sm:grid-cols-4">
        <Metric
          label={`کاربران فعال (${faNumber(data.windowDays)} روز)`}
          value={faNumber(data.activeUsers)}
        />
        <Metric label="کاربران جدید" value={faNumber(data.newUsers)} />
        <Metric label="نرخ رشد دوره" value={rateLabel} />
        <Metric
          label="بازگشت‌پذیری"
          value={`${fa(data.returningUsersPercent.toFixed(1).replace('.', '٫'))}٪`}
        />
      </div>

      <p className="text-sm leading-relaxed text-wibe-secondary">
        {buildInsight(data)}
      </p>
    </section>
  );
}
