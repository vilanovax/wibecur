import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

/** بنر برای ادمین وقتی حالت اضطراری فعال است ولی bypass دارد */
export default function AdminMaintenancePreviewBanner() {
  return (
    <div
      className="sticky top-0 z-[100] border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 shadow-sm"
      dir="rtl"
      role="status"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <p className="leading-relaxed">
            <strong>حالت اضطراری فعال است.</strong> بازدیدکنندگان صفحه تعمیر می‌بینند؛ شما
            به‌عنوان ادمین سایت عادی را می‌بینید.
          </p>
        </div>
        <Link
          href="/admin/settings?tab=maintenance"
          className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
        >
          تنظیمات حالت اضطراری
        </Link>
      </div>
    </div>
  );
}
