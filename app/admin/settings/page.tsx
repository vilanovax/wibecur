import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import SettingsPageClient from './SettingsPageClient';

export const metadata: Metadata = {
  title: 'تنظیمات | پنل ادمین',
  description: 'مدیریت تنظیمات و کلیدهای API',
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  
  return <SettingsPageClient />;
}

