'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShieldX } from 'lucide-react';
import { PERMISSION_LABELS, type Permission } from '@/lib/auth/permissions';
import { getRoleLabel } from '@/lib/auth/roles';
import { BREADCRUMB_MAP } from '@/lib/admin/breadcrumb-labels';

function getPageLabel(fromPath: string): string {
  const normalized = fromPath.replace(/\/$/, '');
  if (BREADCRUMB_MAP[normalized]) return BREADCRUMB_MAP[normalized];
  const sorted = Object.keys(BREADCRUMB_MAP).sort((a, b) => b.length - a.length);
  for (const path of sorted) {
    if (normalized === path || normalized.startsWith(path + '/')) {
      return BREADCRUMB_MAP[path];
    }
  }
  return 'این بخش';
}

export default function AccessDeniedClient() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const from = searchParams.get('from') ?? '';
  const perm = searchParams.get('perm') as Permission | null;
  const pageLabel = from ? getPageLabel(from) : null;
  const permLabel = perm && PERMISSION_LABELS[perm] ? PERMISSION_LABELS[perm] : null;
  const roleLabel = getRoleLabel(session?.user?.role);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10 max-w-md">
        <ShieldX className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          دسترسی به این بخش محدود است
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {permLabel && pageLabel ? (
            <>
              برای باز کردن <strong className="text-gray-800 dark:text-gray-200">{pageLabel}</strong> به
              دسترسی <strong className="text-gray-800 dark:text-gray-200">«{permLabel}»</strong> نیاز است.
            </>
          ) : permLabel ? (
            <>
              نقش شما (<strong className="text-gray-800 dark:text-gray-200">{roleLabel}</strong>) دسترسی{' '}
              <strong className="text-gray-800 dark:text-gray-200">«{permLabel}»</strong> را ندارد.
            </>
          ) : (
            <>
              نقش شما (<strong className="text-gray-800 dark:text-gray-200">{roleLabel}</strong>) به این
              صفحه دسترسی ندارد. در صورت نیاز با مدیرکل تماس بگیرید.
            </>
          )}
        </p>
        {from && from !== '/admin/access-denied' && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500 font-mono" dir="ltr">
            {from}
          </p>
        )}
        {session?.user?.role && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            نقش فعلی در سیستم:{' '}
            <span className="font-mono" dir="ltr">
              {session.user.role}
            </span>
            {roleLabel && roleLabel !== session.user.role && (
              <span> ({roleLabel})</span>
            )}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            بازگشت به داشبورد
          </Link>
          {from && from !== '/admin/access-denied' && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              صفحه قبل
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
