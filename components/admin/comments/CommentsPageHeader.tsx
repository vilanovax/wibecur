'use client';

import { MessageSquare } from 'lucide-react';

export default function CommentsPageHeader() {
  return (
    <div className="mb-2 flex items-center gap-2" dir="rtl">
      <MessageSquare className="w-5 h-5 text-[var(--primary)] shrink-0" aria-hidden />
      <h1 className="text-lg font-bold text-[var(--color-text)] tracking-tight">
        مدیریت کامنت‌ها
      </h1>
    </div>
  );
}
