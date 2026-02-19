'use client';

import type { TrendingHealth } from '@/lib/admin/analytics-metrics';
import { Zap, AlertTriangle } from 'lucide-react';

interface AlgorithmHealthBlockProps {
  data: TrendingHealth;
}

const CONCENTRATION_RISK_THRESHOLD = 60;

function buildInsight(data: TrendingHealth): string {
  if (data.trendDistributionIndex >= CONCENTRATION_RISK_THRESHOLD)
    return 'تمرکز ترند بالا است. احتمال بایاس الگوریتم؛ تنوع در کشف محتوا توصیه می‌شود.';
  if (data.percentRapidlyDeclining > 30)
    return 'سهم قابل توجهی از لیست‌ها در حال افت سریع هستند؛ تنوع ترند پایین است.';
  if (data.percentEnteringHotZone < 5 && data.avgTrendingScoreTop50 > 0)
    return 'امتیاز ترند متمرکز روی تعداد کمی لیست است.';
  if (data.avgSaveVelocity < 1)
    return 'سرعت ذخیره میانگین پایین است؛ کشف محتوا ضعیف است.';
  return 'سلامت الگوریتم ترند در حد قابل قبول است.';
}

export default function AlgorithmHealthBlock({ data }: AlgorithmHealthBlockProps) {
  const highConcentration = data.trendDistributionIndex >= CONCENTRATION_RISK_THRESHOLD;

  return (
    <section
      className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden border-l-4 border-l-rose-500"
      style={{ direction: 'rtl' }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">سلامت الگوریتم ترند</h2>
          </div>
          {highConcentration && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
              High Concentration Risk
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <p className="text-sm text-slate-500 mb-1">⚡ Trend Distribution Index</p>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">
              {data.trendDistributionIndex}٪
            </p>
            <p className="text-xs text-slate-500 mt-1">
              سهم ذخیره‌های ۷ روز توسط ۱۰ لیست برتر
            </p>
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-0.5">میانگین Save Velocity</p>
              <p className="text-lg font-semibold text-slate-800 tabular-nums">
                {data.avgSaveVelocity.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-0.5">افت سریع ٪</p>
              <p className="text-lg font-semibold text-slate-800 tabular-nums">
                {data.percentRapidlyDeclining}٪
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-0.5">ورود به ناحیه داغ ٪</p>
              <p className="text-lg font-semibold text-slate-800 tabular-nums">
                {data.percentEnteringHotZone}٪
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 mt-3">{buildInsight(data)}</p>
      </div>
    </section>
  );
}
