'use client';

import type { ContentEngineHealth } from '@/lib/admin/analytics-metrics';
import { List, AlertTriangle } from 'lucide-react';

interface ContentBlockProps {
  data: ContentEngineHealth;
}

const ZERO_SAVES_WARNING_THRESHOLD = 40;

function buildInsight(data: ContentEngineHealth): string {
  if (data.newLists7d === 0)
    return 'تولید لیست جدیدی در ۷ روز اخیر نداشته‌اید. Featured Rotation می‌تواند به کشف محتوا کمک کند.';
  if (data.percentListsZeroSaves > 50)
    return 'سهم بالای لیست‌های بدون ذخیره نشان‌دهنده ضعف در کشف محتواست.';
  if (data.listsPerActiveUser < 0.3)
    return 'تولید لیست پایین است. Featured Rotation می‌تواند فعال شود.';
  if (data.avgSavesPerList7d < 1)
    return 'میانگین ذخیره به ازای لیست پایین است؛ کشف محتوا را تقویت کنید.';
  return 'موتور محتوا سالم است؛ تولید لیست و تعامل در حد متعادل.';
}

export default function ContentBlock({ data }: ContentBlockProps) {
  const showWarning = data.percentListsZeroSaves > ZERO_SAVES_WARNING_THRESHOLD;

  return (
    <section
      className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden border-l-4 border-l-emerald-500"
      style={{ direction: 'rtl' }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">موتور محتوا</h2>
          </div>
          {showWarning && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
              هشدار: سهم بالای لیست بدون ذخیره
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <p className="text-sm text-slate-500 mb-1">📦 لیست‌های جدید (۷ روز)</p>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">
              {data.newLists7d.toLocaleString('fa-IR')}
            </p>
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-0.5">میانگین لیست به ازای کاربر فعال</p>
              <p className="text-lg font-semibold text-slate-800 tabular-nums">
                {data.listsPerActiveUser.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-0.5">میانگین ذخیره به ازای لیست</p>
              <p className="text-lg font-semibold text-slate-800 tabular-nums">
                {data.avgSavesPerList7d.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-0.5">٪ لیست‌های بدون ذخیره</p>
              <p className="text-lg font-semibold text-slate-800 tabular-nums">
                {data.percentListsZeroSaves}٪
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 mt-3">{buildInsight(data)}</p>
      </div>
    </section>
  );
}
