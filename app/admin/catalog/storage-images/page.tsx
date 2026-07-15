import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import StorageImageRepairClient from '@/components/admin/catalog/StorageImageRepairClient';

export const metadata = {
  title: 'تصاویر | پنل مدیریت',
};

export default async function StorageImageRepairPage({
  searchParams,
}: {
  searchParams: Promise<{ categorySlug?: string; status?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const categories = await prisma.categories.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, name: true, slug: true, icon: true },
  });

  const initialStatus =
    params.status === 'missing' || params.status === 'external' ? params.status : 'all';

  return (
    <StorageImageRepairClient
      categories={categories}
      initialCategorySlug={params.categorySlug || 'all'}
      initialStatus={initialStatus}
      initialQ={params.q || ''}
    />
  );
}
