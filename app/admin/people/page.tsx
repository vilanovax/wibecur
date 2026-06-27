import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export const metadata = {
  title: 'اشخاص | پنل مدیریت',
  description: 'مدیریت پروفایل کارگردان، بازیگر، نویسنده و مترجم',
};

export default async function AdminPeoplePage() {
  await requireAdmin();
  redirect('/admin/lists?view=people');
}
