'use client';

import { MessageSquare } from 'lucide-react';

export default function CommentsPageHeader() {
  return (
    <div className="mb-4" dir="rtl">
      <div className="flex items-center gap-2 text-[var(--color-text)]">
        <MessageSquare className="w-7 h-7 text-[var(--primary)]" />
        <h1 className="text-2xl font-bold">مدیریت کامنت‌ها</h1>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">
        بررسی، تایید و رسیدگی به کامنت‌های کاربران
      </p>
    </div>
  );
}
