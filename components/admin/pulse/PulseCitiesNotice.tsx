'use client';

import { MapPin, Info } from 'lucide-react';

/** نمایش تا زمانی که داده جغرافیایی در محصول فعال نشود */
export default function PulseCitiesNotice() {
  return (
    <section className="rounded-xl border border-dashed border-admin-border dark:border-gray-600 bg-admin-muted/30 dark:bg-gray-800/30 px-2.5 py-2">
      <div className="flex gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/20">
          <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-admin-text-primary flex items-center gap-2">
            پالس شهرها
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-admin-muted dark:bg-gray-700 text-admin-text-tertiary">
              به‌زودی
            </span>
          </h2>
          <p className="text-xs text-admin-text-tertiary mt-1 leading-relaxed">
            پس از فعال‌سازی موقعیت‌یابی کاربران (شهر/منطقه در پروفایل یا رویدادها)، این بخش پراکندگی
            فعالیت را بر اساس شهر نشان می‌دهد.
          </p>
          <p className="text-xs text-admin-text-tertiary mt-2 flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            فعلاً دادهٔ شهری در دیتابیس ثبت نمی‌شود.
          </p>
        </div>
      </div>
    </section>
  );
}
