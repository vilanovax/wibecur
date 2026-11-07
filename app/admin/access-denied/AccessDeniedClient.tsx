'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { ShieldX } from 'lucide-react';
import { PERMISSION_LABELS, type Permission } from '@/lib/auth/permissions';
import { getRoleLabel } from '@/lib/auth/roles';
import { BREADCRUMB_MAP } from '@/lib/admin/breadcrumb-labels';
import { firstAccessibleAdminHref } from '@/lib/admin/admin-menu';
import { buildAdminLoginUrl } from '@/lib/admin/login-redirect';
import { usePermissions } from '@/hooks/usePermissions';

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
  const router = useRouter();
  const { data: session, status } = useSession();
  const { can, isLoading } = usePermissions();
  const from = searchParams.get('from') ?? '';
  const perm = searchParams.get('perm') as Permission | null;
  const pageLabel = from ? getPageLabel(from) : null;
  const permLabel = perm && PERMISSION_LABELS[perm] ? PERMISSION_LABELS[perm] : null;
  const roleLabel = getRoleLabel(session?.user?.role);
  const loginUrl = buildAdminLoginUrl(from || '/admin/dashboard');
  const fallbackHref = firstAccessibleAdminHref(can) ?? loginUrl;
  const canOpenDashboard = can('view_dashboard');
  const primaryHref = canOpenDashboard ? '/admin/dashboard' : fallbackHref;
  const primaryLabel = canOpenDashboard
    ? 'بازگشت به داشبورد'
    : fallbackHref.startsWith('/login')
      ? 'ورود مجدد'
      : 'رفتن به بخش مجاز';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(loginUrl);
    }
  }, [status, router, loginUrl]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm text-wibe-secondary">نشست شما تمام شده؛ در حال انتقال به ورود…</p>
        <Link href={loginUrl} className="text-sm text-indigo-600 underline">
          اگر منتقل نشدید، اینجا را بزنید
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl">
      <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
        <ShieldX className="mx-auto h-12 w-12 text-amber-500" strokeWidth={1.5} />
        <h1 className="mt-4 text-lg font-semibold text-(--color-text) dark:text-white">
          دسترسی به این بخش محدود است
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-wibe-secondary dark:text-(--color-text-subtle)">
          {permLabel && pageLabel ? (
            <>
              برای باز کردن <strong className="text-(--color-text) dark:text-gray-200">{pageLabel}</strong> به
              دسترسی <strong className="text-(--color-text) dark:text-gray-200">«{permLabel}»</strong> نیاز است.
            </>
          ) : permLabel ? (
            <>
              نقش شما (<strong className="text-(--color-text) dark:text-gray-200">{roleLabel}</strong>) دسترسی{' '}
              <strong className="text-(--color-text) dark:text-gray-200">«{permLabel}»</strong> را ندارد.
            </>
          ) : (
            <>
              نقش شما (<strong className="text-(--color-text) dark:text-gray-200">{roleLabel}</strong>) به این
              صفحه دسترسی ندارد. در صورت نیاز با مدیرکل تماس بگیرید.
            </>
          )}
        </p>
        {from && from !== '/admin/access-denied' && (
          <p className="mt-2 font-mono text-xs text-wibe-secondary dark:text-wibe-secondary" dir="ltr">
            {from}
          </p>
        )}
        {session?.user?.role && (
          <p className="mt-2 text-xs text-wibe-secondary dark:text-(--color-text-subtle)">
            نقش فعلی در سیستم:{' '}
            <span className="font-mono" dir="ltr">
              {session.user.role}
            </span>
            {roleLabel && roleLabel !== session.user.role && <span> ({roleLabel})</span>}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href={primaryHref}
            className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {primaryLabel}
          </Link>
          <Link
            href={loginUrl}
            className="inline-flex min-h-11 items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-(--color-text) hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={(event) => {
              event.preventDefault();
              void signOut({ callbackUrl: loginUrl });
            }}
          >
            خروج و ورود مجدد
          </Link>
          {from && from !== '/admin/access-denied' && from !== primaryHref && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex min-h-11 items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-(--color-text) hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              صفحه قبل
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
