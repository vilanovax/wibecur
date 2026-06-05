import { requireAdmin } from '@/lib/auth';
import BackupPageClient from '@/components/admin/backup/BackupPageClient';
import { Database } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BackupPage() {
  await requireAdmin();
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-md shadow-violet-600/25">
            <Database className="h-5 w-5" />
          </div>
          <div className="min-w-0 text-right">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              پشتیبان‌گیری
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
              خروجی ZIP، پیش‌نمایش محتوا و بازیابی انتخابی (دسته، لیست، آیتم و سایر جداول) ·{' '}
              <span className="text-gray-400 dark:text-gray-500">ادغام با داده موجود</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            امن · بدون API key
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
            ZIP + JSON
          </span>
        </div>
      </header>
      <BackupPageClient />
    </div>
  );
}
