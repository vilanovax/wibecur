'use client';

import { Eye } from 'lucide-react';

/**
 * بنر بالای صفحه وقتی کاربر فقط دسترسی مشاهده دارد (مثلاً Analyst).
 * حفاظت واقعی سمت سرور است؛ این فقط اطلاع‌رسانی است.
 */
export default function ReadOnlyBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 dark:border-amber-500/40 dark:bg-amber-500/10 px-4 py-3 flex items-center gap-3">
      <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        حالت فقط مشاهده فعال است — امکان ویرایش یا حذف وجود ندارد.
      </p>
    </div>
  );
}
