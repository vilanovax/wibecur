'use client';

import { ShieldAlert } from 'lucide-react';

export default function BadWordsPageHeader() {
  return (
    <div className="mb-4" dir="rtl">
      <div className="flex items-center gap-2 text-[var(--color-text)]">
        <ShieldAlert className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        <h1 className="text-2xl font-bold">کلمات ممنوع</h1>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">
        کامنت‌های حاوی این کلمات به‌صورت خودکار فیلتر می‌شوند
      </p>
    </div>
  );
}
