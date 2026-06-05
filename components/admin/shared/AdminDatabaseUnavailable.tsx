'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';

interface AdminDatabaseUnavailableProps {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export default function AdminDatabaseUnavailable({
  title = 'دیتابیس در دسترس نیست',
  message,
  backHref = '/admin/lists',
  backLabel = 'بازگشت به لیست‌ها',
}: AdminDatabaseUnavailableProps) {
  const router = useRouter();

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50/80 p-6 max-w-lg"
      dir="rtl"
      role="alert"
    >
      <div className="flex gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-amber-900">{title}</h2>
          {message && (
            <p className="text-xs text-amber-800/90 mt-1 font-mono break-all" dir="ltr">
              {message}
            </p>
          )}
          <ul className="text-sm text-amber-900/90 mt-3 space-y-1.5 list-disc list-inside">
            <li>اتصال اینترنت یا VPN را بررسی کنید</li>
            <li>سرور PostgreSQL (`pgsql.feedban.ir:5174`) باید روشن باشد</li>
            <li>IP شما در whitelist دیتابیس Liara باشد</li>
            <li>مقدار `DATABASE_URL` در `.env` را چک کنید</li>
          </ul>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 text-white text-sm font-medium hover:bg-amber-800"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش مجدد
            </button>
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-amber-300 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              <ChevronRight className="w-4 h-4" />
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
