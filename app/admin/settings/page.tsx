import { Suspense } from 'react';
import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import SettingsPageClient from './SettingsPageClient';

export const metadata: Metadata = {
  title: 'تنظیمات | پنل ادمین',
  description: 'مدیریت تنظیمات و کلیدهای API',
};

export default async function AdminSettingsPage() {
  await requireAdmin();

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
