import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
        <ShieldX className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          دسترسی مجاز نیست
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          شما به این بخش دسترسی ندارید.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
