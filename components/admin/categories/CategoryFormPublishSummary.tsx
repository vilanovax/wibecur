'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { CategoryLayoutType } from '@/types/category-page';
import { getCategoryLayoutLabel } from '@/lib/admin/category-form-constants';
import type { WeightValue } from '@/components/admin/categories/CategoryWeightCard';

export type CategoryPublishSummaryData = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  accentColor: string;
  description: string;
  heroImage: string;
  layoutType: CategoryLayoutType | '';
  order: number;
  isActive: boolean;
  trendingWeight: WeightValue;
};

interface CategoryFormPublishSummaryProps {
  values: CategoryPublishSummaryData;
  orderAuto?: boolean;
  suggestedOrder?: number | null;
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-text-muted)] shrink-0">{label}</span>
      <span className="text-sm text-[var(--color-text)] text-left min-w-0">{children}</span>
    </div>
  );
}

export default function CategoryFormPublishSummary({
  values,
  orderAuto = false,
  suggestedOrder,
}: CategoryFormPublishSummaryProps) {
  const accent = values.accentColor || values.color;
  const layoutLabel = values.layoutType
    ? getCategoryLayoutLabel(values.layoutType)
    : 'پیش‌فرض (بر اساس slug)';

  const warnings: string[] = [];
  if (values.isActive && !values.heroImage) {
    warnings.push('دسته فعال است ولی تصویر هیرو ندارد — بنر پیش‌فرض نمایش داده می‌شود.');
  }
  if (values.isActive && !values.layoutType) {
    warnings.push('چیدمان صفحه مشخص نشده — layout پیش‌فرض slug اعمال می‌شود.');
  }
  if (!values.description?.trim()) {
    warnings.push('توضیحات خالی است — برای SEO و کارت دسته توصیه می‌شود.');
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-sm font-semibold text-[var(--color-text)]">خلاصه قبل از {values.isActive ? 'انتشار' : 'ذخیره'}</p>
        </div>
        <div className="px-4 py-1">
          <SummaryRow label="نام">
            <span className="inline-flex items-center gap-1.5">
              <span>{values.icon}</span>
              <span className="font-medium">{values.name}</span>
            </span>
          </SummaryRow>
          <SummaryRow label="Slug">
            <span className="font-mono text-xs" dir="ltr">
              /categories/{values.slug}
            </span>
          </SummaryRow>
          <SummaryRow label="رنگ">
            <span className="inline-flex items-center gap-2" dir="ltr">
              <span
                className="w-4 h-4 rounded border border-[var(--color-border)]"
                style={{ backgroundColor: values.color }}
              />
              {values.color}
              {values.accentColor && values.accentColor !== values.color && (
                <>
                  <span className="text-[var(--color-text-muted)]">· accent</span>
                  <span
                    className="w-4 h-4 rounded border border-[var(--color-border)]"
                    style={{ backgroundColor: accent }}
                  />
                  {values.accentColor}
                </>
              )}
            </span>
          </SummaryRow>
          <SummaryRow label="چیدمان">{layoutLabel}</SummaryRow>
          <SummaryRow label="هیرو">
            {values.heroImage ? (
              <span className="text-emerald-600">آپلود شده</span>
            ) : (
              <span className="text-amber-600">ندارد — پیش‌فرض</span>
            )}
          </SummaryRow>
          <SummaryRow label="ترتیب">
            <span>
              {values.order.toLocaleString('fa-IR')}
              {orderAuto && suggestedOrder != null && (
                <span className="text-[var(--color-text-muted)] text-xs mr-1">(خودکار)</span>
              )}
            </span>
          </SummaryRow>
          <SummaryRow label="وزن الگوریتم">
            {values.trendingWeight.toLocaleString('fa-IR')}×
          </SummaryRow>
          <SummaryRow label="وضعیت">
            {values.isActive ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                فعال — نمایش در اپ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                پیش‌نویس — فقط در پنل ادمین
              </span>
            )}
          </SummaryRow>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-900/20 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            نکات قبل از {values.isActive ? 'انتشار' : 'ذخیره'}
          </p>
          <ul className="text-xs text-amber-800/90 dark:text-amber-200/90 space-y-1 list-disc list-inside">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {values.description?.trim() && (
        <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
          <span className="font-medium text-[var(--color-text)]">توضیحات: </span>
          {values.description}
        </p>
      )}
    </div>
  );
}
