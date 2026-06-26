import { requireAdmin } from '@/lib/auth';
import PeoplePageClient from '@/components/admin/people/PeoplePageClient';

export const metadata = {
  title: 'اشخاص | پنل مدیریت',
  description: 'مدیریت پروفایل کارگردان، بازیگر، نویسنده و مترجم',
};

export default async function AdminPeoplePage() {
  await requireAdmin();

  return <PeoplePageClient />;
}
