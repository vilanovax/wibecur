import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/has-permission';

export const metadata: Metadata = {
  title: 'تنظیمات | پنل ادمین',
  description: 'مدیریت تنظیمات و کلیدهای API',
};

const SettingsPageClient = nextDynamic(() => import('./SettingsPageClient'), {
  loading: () => (
    <div
      className="py-16 text-center text-sm text-[var(--color-text-muted)] animate-pulse"
      dir="rtl"
    >
      در حال بارگذاری تنظیمات…
    </div>
  ),
});

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  if (!hasPermission(session.user.role, 'manage_settings', session.user.adminPermissions)) {
    redirect('/admin/access-denied?from=/admin/settings&perm=manage_settings');
  }

  return (
    <Suspense
      fallback={
        <div
          className="py-16 text-center text-sm text-[var(--color-text-muted)] animate-pulse"
          dir="rtl"
        >
          در حال بارگذاری تنظیمات…
        </div>
      }
    >
      <SettingsPageClient />
    </Suspense>
  );
}
