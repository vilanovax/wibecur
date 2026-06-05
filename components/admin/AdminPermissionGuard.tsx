'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { getPageRequiredPermission } from '@/lib/auth/page-permissions';

/**
 * در layout ادمین: اگر کاربر به صفحهٔ فعلی permission نداشته باشد به /admin/access-denied هدایت می‌شود.
 */
export default function AdminPermissionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { can, isLoading } = usePermissions();
  const required = pathname ? getPageRequiredPermission(pathname) : null;

  useEffect(() => {
    if (isLoading || !required || pathname === '/admin/access-denied') return;
    if (!can(required)) {
      const qs = new URLSearchParams({
        from: pathname ?? '',
        perm: required,
      });
      router.replace(`/admin/access-denied?${qs.toString()}`);
    }
  }, [required, can, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (required && !can(required)) {
    return null;
  }

  return <>{children}</>;
}
