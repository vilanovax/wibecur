import { requireAdmin } from '@/lib/auth';
import FeaturedManagementClient from './FeaturedManagementClient';

export const dynamic = 'force-dynamic';

export default async function AdminCustomFeaturedPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">مدیریت منتخب‌ها</h1>
      <FeaturedManagementClient />
    </div>
  );
}
