import { Metadata } from 'next';
import SettingsPageClient from './SettingsPageClient';

export const metadata: Metadata = {
  title: 'تنظیمات | پنل ادمین',
  description: 'مدیریت تنظیمات و کلیدهای API',
};

export default function AdminSettingsPage() {
  return <SettingsPageClient />;
}

