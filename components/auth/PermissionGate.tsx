'use client';

import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/auth/permissions';

interface PermissionGateProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  /** hidden = رندر نکن؛ disabled = با tooltip غیرفعال نشان بده */
  mode?: 'hidden' | 'disabled';
}

/**
 * اگر کاربر permission را نداشته باشد:
 * - hidden: children رندر نمی‌شود، fallback نمایش داده می‌شود (یا null)
 * - disabled: children داخل span با opacity و pointer-events-none و title "دسترسی ندارید"
 */
export default function PermissionGate({
  permission,
  fallback = null,
  children,
  mode = 'hidden',
}: PermissionGateProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (can(permission)) {
    return <>{children}</>;
  }

  if (mode === 'hidden') {
    return <>{fallback}</>;
  }

  return (
    <span
      className="inline-block cursor-not-allowed opacity-60 pointer-events-none"
      title="دسترسی ندارید"
    >
      {children}
    </span>
  );
}
