'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { getPageRequiredPermission } from '@/lib/auth/page-permissions';
import { buildAdminLoginUrl } from '@/lib/admin/login-redirect';

/**
 * در layout ادمین: اگر کاربر به صفحهٔ فعلی permission نداشته باشد به /admin/access-denied هدایت می‌شود.
 * نشست منقضی‌شده → لاگین (نه access-denied).
 */
export default function AdminPermissionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const { can, isLoading } = usePermissions();
  const required = pathname ? getPageRequiredPermission(pathname) : null;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(buildAdminLoginUrl(pathname));
      return;
    }
    if (status !== 'authenticated' || isLoading || !required || pathname === '/admin/access-denied') {
      return;
    }
    if (!can(required)) {
      const qs = new URLSearchParams({
        from: pathname ?? '',
        perm: required,
      });
      router.replace(`/admin/access-denied?${qs.toString()}`);
    }
  }, [required, can, isLoading, router, pathname, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (required && !can(required)) {
    return null;
  }

  return <>{children}</>;
}
