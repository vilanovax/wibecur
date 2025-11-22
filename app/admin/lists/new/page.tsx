import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import NewListForm from './NewListForm';

export default async function NewListPage() {
  await requireAdmin();

  const categories = await prisma.categories.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="max-w-3xl">
      <NewListForm categories={categories} />
    </div>
  );
}
