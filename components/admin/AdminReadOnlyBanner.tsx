'use client';

import { useSession } from 'next-auth/react';
import { isAdminRole } from '@/lib/auth/roles';
import ReadOnlyBanner from '@/components/admin/design-system/ReadOnlyBanner';

/**
 * وقتی نقش کاربر Analyst است (فقط مشاهده)، بنر بالای محتوا نمایش داده می‌شود.
 */
export default function AdminReadOnlyBanner() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (!role || !isAdminRole(role) || role !== 'ANALYST') return null;

  return <ReadOnlyBanner />;
}
