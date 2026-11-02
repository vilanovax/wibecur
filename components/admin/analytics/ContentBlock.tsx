'use client';

import Link from 'next/link';
import type { ContentEngineHealth } from '@/lib/admin/analytics-metrics';
import { List, AlertTriangle } from 'lucide-react';
import { fa, faNumber } from '@/lib/utils';

interface ContentBlockProps {
  data: ContentEngineHealth;
}

const ZERO_SAVES_WARNING_THRESHOLD = 40;

function buildInsight(data: ContentEngineHealth): string {
  if (data.newLists === 0) {
    return 'تولید لیست جدیدی در این بازه نداشته‌اید. منتخب هوم می‌تواند به کشف محتوا کمک کند.';
  }
  if (data.percentListsZeroSaves > 50) {
    return 'سهم بالای لیست‌های بدون ذخیره نشان‌دهنده ضعف در کشف محتواست.';
  }
  if (data.listsPerActiveUser < 0.3) {
    return 'تولید لیست نسبت به کاربر فعال پایین است.';
  }
  if (data.avgSavesPerList < 1) {
    return 'میانگین ذخیره به ازای لیست پایین است؛ کشف محتوا را تقویت کنید.';
  }
  return 'موتور محتوا سالم است؛ تولید لیست و تعامل در حد متعادل.';
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
          warn ? 'text-amber-800' : 'text-(--color-text)'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function ContentBlock({ data }: ContentBlockProps) {
  const showWarning = data.percentListsZeroSaves > ZERO_SAVES_WARNING_THRESHOLD;

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-text)">
          <List className="size-4" strokeWidth={1.5} />
          موتور محتوا
          {showWarning && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-sm font-medium text-amber-800">
              <AlertTriangle className="size-3.5" strokeWidth={1.5} />
              لیست بدون ذخیره زیاد
            </span>
          )}
        </h2>
        <Link
          href="/admin/lists"
          className="inline-flex min-h-11 items-center rounded-xl border border-(--color-border) px-3 text-sm text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)"
        >
          لیست‌ها
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-(--color-border) bg-(--color-border) sm:grid-cols-4">
        <Metric
          label={`لیست جدید (${faNumber(data.windowDays)} روز)`}
          value={faNumber(data.newLists)}
        />
        <Metric
          label="ذخیره در بازه"
          value={faNumber(data.totalSaves)}
        />
        <Metric
          label="میانگین ذخیره / لیست"
          value={fa(data.avgSavesPerList.toFixed(2).replace('.', '٫'))}
        />
        <Metric
          label="لیست بدون ذخیره"
          value={`${fa(data.percentListsZeroSaves.toFixed(1).replace('.', '٫'))}٪`}
          warn={showWarning}
        />
      </div>

      <p className="text-sm leading-relaxed text-wibe-secondary">
        {buildInsight(data)}
      </p>
    </section>
  );
}
