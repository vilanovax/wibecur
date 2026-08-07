import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/has-permission';
import SettingsPageClient from './SettingsPageClient';

export const metadata: Metadata = {
  title: 'تنظیمات | پنل ادمین',
  description: 'مدیریت تنظیمات و کلیدهای API',
};

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
