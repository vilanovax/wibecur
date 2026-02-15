'use client';

import { Activity } from 'lucide-react';

/**
 * ویجت وضعیت استخراج / Jobs – وقتی دیتای استخراج (مثلاً اینستاگرام) دارید،
 * اینجا آخرین sync، تعداد آیتم‌های جدید، خطاها و صف پردازش را نمایش دهید.
 */
interface IngestionHealthWidgetProps {
  lastSync?: string | null;
  newItemsCount?: number;
  errorCount?: number;
  queueLength?: number;
}

export default function IngestionHealthWidget({
  lastSync,
  newItemsCount = 0,
  errorCount = 0,
  queueLength = 0,
}: IngestionHealthWidgetProps) {
  const hasData = lastSync != null || newItemsCount > 0 || errorCount > 0 || queueLength > 0;

  return (
    <div className="rounded-[16px] p-4 sm:p-5 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--color-info)]" />
          وضعیت استخراج / Jobs
        </h3>
      </div>
      {hasData ? (
        <ul className="space-y-2 text-sm">
          {lastSync != null && (
            <li className="text-[var(--color-text-muted)]">
              آخرین sync: <span className="text-[var(--color-text)]">{lastSync}</span>
            </li>
          )}
          <li className="text-[var(--color-text-muted)]">
            آیتم‌های جدید: <span className="text-[var(--color-text)]">{newItemsCount.toLocaleString('fa-IR')}</span>
          </li>
          <li className="text-[var(--color-text-muted)]">
            خطاها / ریترای: <span className={errorCount > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}>{errorCount.toLocaleString('fa-IR')}</span>
          </li>
          <li className="text-[var(--color-text-muted)]">
            صف پردازش: <span className="text-[var(--color-text)]">{queueLength.toLocaleString('fa-IR')}</span>
          </li>
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)] py-2">
          دیتای استخراج متصل نشده. وقتی API/Jobs آماده شد، این ویجت را به منبع واقعی وصل کنید.
        </p>
      )}
    </div>
  );
}
