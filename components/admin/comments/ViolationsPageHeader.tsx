'use client';

import { Ban } from 'lucide-react';

export default function ViolationsPageHeader() {
  return (
    <div className="mb-4" dir="rtl">
      <div className="flex items-center gap-2 text-[var(--color-text)]">
        <Ban className="w-7 h-7 text-rose-600 dark:text-rose-400" />
        <h1 className="text-2xl font-bold">کاربران خاطی</h1>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">
        امتیاز منفی و تاریخچه تخلف کامنت برای هر کاربر
      </p>
    </div>
  );
}
