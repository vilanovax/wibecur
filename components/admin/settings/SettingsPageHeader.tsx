'use client';

import { Settings } from 'lucide-react';

export default function SettingsPageHeader() {
  return (
    <div className="mb-2" dir="rtl">
      <div className="flex items-center gap-2 text-[var(--color-text)]">
        <Settings className="w-7 h-7 text-[var(--primary)]" />
        <h1 className="text-2xl font-bold">تنظیمات</h1>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">
        کلیدهای API، کامنت، لیست‌های کاربران و حساب ادمین
      </p>
    </div>
  );
}
