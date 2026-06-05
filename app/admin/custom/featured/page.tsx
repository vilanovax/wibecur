import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import FeaturedManagementClient from './FeaturedManagementClient';

export const dynamic = 'force-dynamic';

export default async function AdminCustomFeaturedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab } = await searchParams;
  if (tab === 'weekly-report') {
    redirect('/admin/custom/featured');
  }
  return <FeaturedManagementClient />;
}
