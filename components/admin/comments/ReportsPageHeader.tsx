'use client';

import { Flag } from 'lucide-react';

export default function ReportsPageHeader() {
  return (
    <div className="mb-4" dir="rtl">
      <div className="flex items-center gap-2 text-(--color-text)">
        <Flag className="w-7 h-7 text-rose-500" />
        <h1 className="text-2xl font-bold">ریپورت کامنت‌ها</h1>
      </div>
      <p className="text-sm text-wibe-secondary mt-1">
        رسیدگی به گزارش‌های کاربران روی کامنت‌ها
      </p>
    </div>
  );
}
