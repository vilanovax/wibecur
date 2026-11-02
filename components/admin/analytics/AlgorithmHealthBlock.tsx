'use client';

import Link from 'next/link';
import type { TrendingHealth } from '@/lib/admin/analytics-metrics';
import { Zap, AlertTriangle } from 'lucide-react';
import { fa, faNumber } from '@/lib/utils';

interface AlgorithmHealthBlockProps {
  data: TrendingHealth;
}

const CONCENTRATION_RISK_THRESHOLD = 60;

function buildInsight(data: TrendingHealth): string {
  if (data.trendDistributionIndex >= CONCENTRATION_RISK_THRESHOLD) {
    return 'تمرکز ترند بالاست. احتمال بایاس الگوریتم؛ تنوع در کشف محتوا توصیه می‌شود.';
  }
  if (data.percentRapidlyDeclining > 30) {
    return 'سهم قابل‌توجهی از لیست‌ها در حال افت سریع هستند؛ تنوع ترند پایین است.';
  }
  if (data.percentEnteringHotZone < 5 && data.avgTrendingScoreTop50 > 0) {
    return 'امتیاز ترند متمرکز روی تعداد کمی لیست است.';
  }
  if (data.avgSaveVelocity < 1) {
    return 'سرعت ذخیره میانگین پایین است؛ کشف محتوا ضعیف است.';
  }
  return 'سلامت الگوریتم ترند در حد قابل‌قبول است.';
}

function Metric({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="min-w-0 bg-(--color-surface) px-4 py-3">
      <p className="text-sm text-wibe-secondary">{label}</p>
      <p
        className={`mt-1 text-lg font-bold leading-snug ${
          warn ? 'text-red-700' : 'text-(--color-text)'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function AlgorithmHealthBlock({ data }: AlgorithmHealthBlockProps) {
  const highConcentration =
    data.trendDistributionIndex >= CONCENTRATION_RISK_THRESHOLD;

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex flex-wrap items-center gap-2 text-sm font-semibold text-(--color-text)">
          <Zap className="size-4" strokeWidth={1.5} />
          سلامت الگوریتم ترند
          {highConcentration && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-sm font-medium text-red-800">
              <AlertTriangle className="size-3.5" strokeWidth={1.5} />
              تمرکز بالا
            </span>
          )}
        </h2>
        <Link
          href="/admin/custom/featured"
          className="inline-flex min-h-11 items-center rounded-xl border border-(--color-border) px-3 text-sm text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)"
        >
          منتخب هوم
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-(--color-border) bg-(--color-border) sm:grid-cols-4">
        <Metric
          label="تمرکز ۱۰ لیست برتر"
          value={`${fa(data.trendDistributionIndex.toFixed(1).replace('.', '٫'))}٪`}
          warn={highConcentration}
        />
        <Metric
          label="میانگین سرعت ذخیره"
          value={fa(data.avgSaveVelocity.toFixed(2).replace('.', '٫'))}
        />
        <Metric
          label="افت سریع"
          value={`${fa(data.percentRapidlyDeclining.toFixed(1).replace('.', '٫'))}٪`}
        />
        <Metric
          label="ورود به ناحیه داغ"
          value={`${fa(data.percentEnteringHotZone.toFixed(1).replace('.', '٫'))}٪`}
        />
      </div>

      <p className="text-sm leading-relaxed text-wibe-secondary">
        {buildInsight(data)}
        {highConcentration
          ? ` امتیاز میانگین ۵۰ لیست برتر: ${faNumber(data.avgTrendingScoreTop50)}.`
          : ''}
      </p>
    </section>
  );
}
